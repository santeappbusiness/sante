# Serene: three things I need, and one gap in the schema

Your five tables look right. This is what I need back so the app code matches your columns
exactly instead of guessing, plus one table that is missing.

Fastest path: **paste the answers to sections 1 and 2 in chat**, and run the
SQL in section 3. Fifteen minutes total.

---

## 1. Send me the actual column definitions

In the Supabase SQL editor, run this and paste the output:

```sql
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;
```

I have frozen the shared contracts in `src/types/domain.ts`. Your columns and those types have
to line up, and reconciling now while every table has 0 rows costs nothing. Reconciling at hour
40 costs the demo.

The shapes the app expects, so you can compare as you read:

- **profiles** — display name, goal, preferred minutes, tags to avoid, neurodivergent mode flag,
  self-reported context (storytelling only, never a clinical input), and an `is_demo` flag
- **plans** — title, total minutes, intensity, and its movements
- **checkins** — energy, discomfort, mood, sensory load, each 1 to 5, plus any red flags selected
- **adaptations** — the original plan, the adapted plan, the reasons shown under "Why this
  changed", and whether the deterministic fallback produced it rather than the model
- **feedback** — verdict of too much, just right, or could do more, plus which movements were
  completed

## 2. Confirm RLS is actually on

Run this and paste the output:

```sql
select tablename, rowsecurity from pg_tables where schemaname = 'public';
```

Every row must say `true`. It is the first item on your own security checklist, and the
screenshot you shared does not show it. If any say false, turn RLS on before we put a single
row in.

Also confirm, in one line each:

- Is the **service-role key** anywhere other than server-side environment variables?
- Is `NEXT_PUBLIC_` used for the anon key only, never the service-role key or the OpenAI key?

## 3. The missing table: ephemeral demo sessions

This is the gap. The build bible calls for it in hour one and it is not there.

**The problem it solves.** Judges open the demo link at the same time. If "Try the demo" logs
everyone into one shared Maya, judge two sees judge one's half-finished check-in, their
adaptation and their feedback. That is the single most visible way the demo can embarrass us,
and it happens exactly when several people are looking.

**The fix.** Every click of "Try the demo" creates its own throwaway session with its own copy
of Maya's data. It also gives us demo reset for free, because a fresh session is a fresh start.

Run this in the SQL editor:

```sql
-- Every demo visitor gets their own session and their own copy of Maya.
create table if not exists demo_sessions (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  -- rows belonging to a session are deleted together when we clean up
  expires_at timestamptz not null default now() + interval '6 hours'
);

-- Everything a person generates hangs off either a real user or a demo session.
-- Exactly one of the two is set, never both, never neither.
alter table profiles     add column if not exists demo_session_id uuid references demo_sessions(id) on delete cascade;
alter table plans        add column if not exists demo_session_id uuid references demo_sessions(id) on delete cascade;
alter table checkins     add column if not exists demo_session_id uuid references demo_sessions(id) on delete cascade;
alter table adaptations  add column if not exists demo_session_id uuid references demo_sessions(id) on delete cascade;
alter table feedback     add column if not exists demo_session_id uuid references demo_sessions(id) on delete cascade;

create index if not exists profiles_demo_idx    on profiles(demo_session_id);
create index if not exists plans_demo_idx       on plans(demo_session_id);
create index if not exists checkins_demo_idx    on checkins(demo_session_id);
create index if not exists adaptations_demo_idx on adaptations(demo_session_id);
create index if not exists feedback_demo_idx    on feedback(demo_session_id);

alter table demo_sessions enable row level security;
```

**Then tell me which of these two you prefer**, because it changes how I write the server code:

- **A. Demo rows are written server-side only**, using the service-role key inside our own API
  routes, with no anon policy on demo rows at all. Safer, and my preference.
- **B. Anon can insert and read rows matching a session id it holds.** Simpler, but any visitor
  can read any session's rows if they can guess a uuid.

I will build for A unless you say otherwise.

## 4. What I am building meanwhile

The app shell, landing with one-click demo entry, today's plan, and the readiness check-in,
all against mock data shaped like `src/types/domain.ts`. None of that depends on your answers.
It swaps to real data the moment sections 1 and 3 land.

You keep: auth, the migration above, RLS, persistence, the rate limit on the adapt route, and
the OpenAI spend cap.
