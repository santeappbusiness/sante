# Serene: verifying the schema is actually correct

Two parts. The first proves the structure is right and takes two minutes. The second proves
RLS actually *works*, which is the only part that matters, and takes about ten.

A migration that ran without errors is not the same as a database that is safe. Only part 2
tells you that.

---

## Part 1 — Structure check

Paste this whole block into the Supabase SQL editor and run it. Every row must say `PASS`.

```sql
with checks as (
  -- RLS is on for every table we own
  select 'RLS on ' || tablename as check_name,
         case when rowsecurity then 'PASS' else 'FAIL' end as result
  from pg_tables
  where schemaname = 'public'

  union all
  -- every table has at least one policy, because RLS with no policy denies everything
  select 'policies exist on ' || t.tablename,
         case when count(p.policyname) > 0 then 'PASS' else 'FAIL - table is locked to everyone' end
  from pg_tables t
  left join pg_policies p on p.tablename = t.tablename and p.schemaname = 'public'
  where t.schemaname = 'public'
  group by t.tablename

  union all
  -- the demo sessions table landed
  select 'demo_sessions table exists',
         case when to_regclass('public.demo_sessions') is not null then 'PASS' else 'FAIL' end

  union all
  -- every data table can be tied to a demo session
  select 'demo_session_id on ' || t,
         case when exists (
           select 1 from information_schema.columns
           where table_schema = 'public' and table_name = t and column_name = 'demo_session_id'
         ) then 'PASS' else 'FAIL' end
  from unnest(array['profiles','plans','checkins','adaptations','feedback']) as t

  union all
  -- deleting a session must take its rows with it
  select 'cascade delete from ' || cl.relname,
         case when co.confdeltype = 'c' then 'PASS' else 'FAIL - not ON DELETE CASCADE' end
  from pg_constraint co
  join pg_class cl on cl.oid = co.conrelid
  join pg_class fk on fk.oid = co.confrelid
  where co.contype = 'f' and fk.relname = 'demo_sessions'
)
select result, check_name from checks order by result desc, check_name;
```

Anything that says FAIL, fix before we write a single row.

**One trap worth knowing:** RLS enabled with *no policy* means nothing can read or write the
table at all, including our own server code using the anon key. That reads as "very secure"
right up to the moment the app returns empty screens. That is why the second check above
exists.

---

## Part 2 — Prove RLS actually works

This is security checklist item "User A cannot read User B's profile, check-ins or
adaptations". Structure checks cannot tell you this. You have to try the attack.

### Set up

You need the project URL and the **anon** key, both from Settings, API. Not the service-role
key: the whole point is to test what a browser can do.

```bash
export SB_URL="https://<your-project>.supabase.co"
export SB_ANON="<anon key>"
```

### Test 1 — can anonymous read the tables at all?

```bash
curl -s "$SB_URL/rest/v1/profiles?select=*" \
  -H "apikey: $SB_ANON" -H "Authorization: Bearer $SB_ANON"
```

- `[]` — good, and expected while the tables are empty.
- A list of rows belonging to real users — **fail**, the policy is too open.
- `{"message":"permission denied..."}` — RLS is denying everything, which is safe but will
  also break the app. See the trap above.

### Test 2 — the one that counts, two sessions

Create two demo sessions and put a row in each, then try to read one while pretending to be
the other. Run this in the SQL editor:

```sql
insert into demo_sessions default values returning id;  -- note this as SESSION_A
insert into demo_sessions default values returning id;  -- note this as SESSION_B
```

Insert a profile row against SESSION_A, then from the command line try to read SESSION_B's
rows using only the anon key and SESSION_A's id:

```bash
curl -s "$SB_URL/rest/v1/profiles?select=*&demo_session_id=eq.<SESSION_B>" \
  -H "apikey: $SB_ANON" -H "Authorization: Bearer $SB_ANON"
```

**What you want back is `[]`.** If it returns SESSION_A's row, or any row at all, then any
visitor who guesses a uuid can read another person's check-ins, and that is a real finding to
fix before launch.

### Test 3 — can anonymous write?

```bash
curl -s -X POST "$SB_URL/rest/v1/profiles" \
  -H "apikey: $SB_ANON" -H "Authorization: Bearer $SB_ANON" \
  -H "Content-Type: application/json" \
  -d '{"display_name":"attacker"}'
```

If that succeeds, anyone can write rows into our database from a terminal. For option A, which
is what I am building against, demo rows are written **server-side only** with the service-role
key, so anon should have no insert policy at all and this must fail.

### Test 4 — real accounts, after auth exists

Once sign-up works, make two accounts, sign in as each, and confirm account A cannot read
account B's check-ins or adaptations. Same shape as test 2, with real JWTs instead of session
ids. This is the version that goes in the submission as evidence.

---

## Recording it

Tick these in HQ under **Checklists → Security and QA**, and put the evidence in the field
next to each: the query output, or a one-line note like "test 2 returned [] with anon key".

The relevant items are already seeded: RLS two-user test, IDOR, secrets not exposed, inputs
validated.

If any test fails, flag the task as blocked in HQ rather than fixing it silently. It shows on
the dashboard and it is the kind of thing the whole team should know about.
