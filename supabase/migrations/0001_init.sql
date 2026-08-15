-- ============================================================================
-- Santé — migration 0001
-- Schema + RLS + ephemeral demo sessions + rate limit, in one file.
--
-- RLS is enabled in the SAME migration that creates each table. Turning it on
-- later is how teams ship a leak.
--
-- PREREQUISITE: Dashboard > Authentication > Sign In / Providers >
-- enable "Anonymous sign-ins". The demo will not work without it.
--
-- Run in: Supabase SQL Editor, on the SANTE project (not sante-hq).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enums. Cheaper than check constraints to read, and they self-document.
-- ----------------------------------------------------------------------------
do $$ begin
  create type intensity_level as enum ('rest', 'low', 'moderate', 'high');
exception when duplicate_object then null; end $$;

do $$ begin
  create type adaptation_source as enum ('llm', 'fallback');
exception when duplicate_object then null; end $$;

do $$ begin
  create type feedback_rating as enum ('helped', 'not_for_me');
exception when duplicate_object then null; end $$;


-- ----------------------------------------------------------------------------
-- profiles — one row per auth user, real or anonymous.
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  is_demo       boolean     not null default false,
  -- Demo profiles get a TTL. Real accounts have expires_at = null.
  expires_at    timestamptz,
  created_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "own profile: read"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "own profile: insert"
  on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));

create policy "own profile: update"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- No delete policy on purpose. Deletion happens via the cleanup function
-- below, which runs as a privileged role. A user cannot delete their own
-- row out from under a foreign key by accident.


-- ----------------------------------------------------------------------------
-- checkins — the 20-second check-in. Four sliders, nothing else.
--
-- red_flag and red_flag_reasons are written by the SERVER after the
-- deterministic gate runs. They are NOT model output and never will be.
-- ----------------------------------------------------------------------------
create table if not exists public.checkins (
  id                uuid primary key default gen_random_uuid(),
  profile_id        uuid not null references public.profiles(id) on delete cascade,
  energy            smallint not null check (energy       between 0 and 10),
  discomfort        smallint not null check (discomfort   between 0 and 10),
  mood              smallint not null check (mood         between 0 and 10),
  sensory_load      smallint not null check (sensory_load between 0 and 10),
  red_flag          boolean  not null default false,
  red_flag_reasons  text[]   not null default '{}',
  created_at        timestamptz not null default now()
);

create index if not exists checkins_profile_created_idx
  on public.checkins (profile_id, created_at desc);

alter table public.checkins enable row level security;

create policy "own checkins: read"
  on public.checkins for select to authenticated
  using (profile_id = (select auth.uid()));

create policy "own checkins: insert"
  on public.checkins for insert to authenticated
  with check (profile_id = (select auth.uid()));

-- Deliberately no update policy. A check-in is a record of what someone
-- reported at a moment in time. Editing history would make the Before/After
-- diff a lie.


-- ----------------------------------------------------------------------------
-- plans — the baseline plan, before adaptation. The "Before" column.
--
-- items is jsonb because the shape is owned by src/types/domain.ts, which is
-- frozen in hour one. Keep this in sync with that file, not with a guess.
-- Expected shape: [{ "name": "...", "minutes": 10, "intensity": "low" }, ...]
-- ----------------------------------------------------------------------------
create table if not exists public.plans (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  title         text not null,
  items         jsonb not null default '[]'::jsonb,
  total_minutes integer not null default 0 check (total_minutes >= 0),
  intensity     intensity_level not null default 'moderate',
  is_baseline   boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists plans_profile_idx on public.plans (profile_id);

alter table public.plans enable row level security;

create policy "own plans: read"
  on public.plans for select to authenticated
  using (profile_id = (select auth.uid()));

create policy "own plans: insert"
  on public.plans for insert to authenticated
  with check (profile_id = (select auth.uid()));

create policy "own plans: update"
  on public.plans for update to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));


-- ----------------------------------------------------------------------------
-- adaptations — the "After" column plus the reasoning trail.
--
-- constraints_applied is what the APP computed, not what the model chose.
-- Storing it is what lets you prove at judging time that the model worked
-- inside a box it could not widen.
--
-- source tells you whether Luna produced this or the deterministic fallback
-- did. Do not drop this column: it is the evidence that the app works with
-- the AI switched off.
-- ----------------------------------------------------------------------------
create table if not exists public.adaptations (
  id                  uuid primary key default gen_random_uuid(),
  profile_id          uuid not null references public.profiles(id) on delete cascade,
  checkin_id          uuid not null references public.checkins(id) on delete cascade,
  plan_id             uuid references public.plans(id) on delete set null,
  constraints_applied jsonb not null default '{}'::jsonb,
  adapted_plan        jsonb not null,
  why_this_changed    text  not null,
  source              adaptation_source not null,
  -- AI evidence. Populated for source = 'llm', null for fallback.
  model_id            text,
  latency_ms          integer,
  input_tokens        integer,
  output_tokens       integer,
  created_at          timestamptz not null default now()
);

create index if not exists adaptations_profile_created_idx
  on public.adaptations (profile_id, created_at desc);

alter table public.adaptations enable row level security;

create policy "own adaptations: read"
  on public.adaptations for select to authenticated
  using (profile_id = (select auth.uid()));

create policy "own adaptations: insert"
  on public.adaptations for insert to authenticated
  with check (profile_id = (select auth.uid()));


-- ----------------------------------------------------------------------------
-- feedback — two buttons under the diff. Not a survey.
-- ----------------------------------------------------------------------------
create table if not exists public.feedback (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null references public.profiles(id) on delete cascade,
  adaptation_id  uuid not null references public.adaptations(id) on delete cascade,
  rating         feedback_rating not null,
  note           text check (note is null or char_length(note) <= 500),
  created_at     timestamptz not null default now(),
  unique (adaptation_id, profile_id)
);

alter table public.feedback enable row level security;

create policy "own feedback: read"
  on public.feedback for select to authenticated
  using (profile_id = (select auth.uid()));

create policy "own feedback: insert"
  on public.feedback for insert to authenticated
  with check (profile_id = (select auth.uid()));

create policy "own feedback: update"
  on public.feedback for update to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));


-- ============================================================================
-- RATE LIMIT
--
-- Enforced in the database, not in the API route. An API-level check is
-- bypassable by anyone who reads your client bundle and calls Supabase
-- directly with the anon key. This one is not.
--
-- A public button that triggers model calls is an open wallet, and judging
-- day is exactly when that hurts. Set a hard spend cap on the OpenAI account
-- as well — this covers your database, not your bill.
-- ============================================================================
create or replace function public.enforce_adaptation_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  recent_count integer;
  max_per_hour constant integer := 10;
begin
  select count(*) into recent_count
  from public.adaptations
  where profile_id = new.profile_id
    and created_at > now() - interval '1 hour';

  if recent_count >= max_per_hour then
    raise exception 'Adaptation limit reached (% per hour). Try again shortly.', max_per_hour
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists adaptations_rate_limit on public.adaptations;
create trigger adaptations_rate_limit
  before insert on public.adaptations
  for each row execute function public.enforce_adaptation_limit();


-- ============================================================================
-- EPHEMERAL DEMO SESSIONS
--
-- Flow: client calls supabase.auth.signInAnonymously(), then calls
--   supabase.rpc('start_demo_session')
--
-- Every "Try the demo" click gets its own anonymous session seeded with
-- Maya's data. Two judges opening the link at the same time never see each
-- other's check-in. Demo reset comes free: sign out, sign in again, new
-- session, clean slate.
--
-- security definer so it can seed rows before the caller has a profile.
-- It only ever writes rows keyed to auth.uid(), so it cannot be used to
-- touch anyone else's data.
-- ============================================================================
create or replace function public.start_demo_session()
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid     uuid := auth.uid();
  plan_id uuid;
begin
  if uid is null then
    raise exception 'Not authenticated. Call signInAnonymously() first.';
  end if;

  -- Idempotent: refreshing the page must not create a second profile.
  insert into public.profiles (id, display_name, is_demo, expires_at)
  values (uid, 'Maya', true, now() + interval '24 hours')
  on conflict (id) do nothing;

  -- Only seed the baseline plan once per session.
  select id into plan_id
  from public.plans
  where profile_id = uid and is_baseline
  limit 1;

  if plan_id is null then
    insert into public.plans (profile_id, title, items, total_minutes, intensity, is_baseline)
    values (
      uid,
      'Maya''s usual Tuesday',
      '[
        {"name": "Morning walk",        "minutes": 20, "intensity": "moderate"},
        {"name": "Strength circuit",    "minutes": 25, "intensity": "high"},
        {"name": "Evening stretch",     "minutes": 10, "intensity": "low"}
      ]'::jsonb,
      55,
      'moderate',
      true
    )
    returning id into plan_id;
  end if;

  return plan_id;
end;
$$;

revoke all on function public.start_demo_session() from public;
grant execute on function public.start_demo_session() to authenticated;


-- ----------------------------------------------------------------------------
-- Cleanup. Anonymous users are real rows in auth.users and they accumulate.
--
-- Run manually before judging, or schedule with pg_cron if available:
--   select cron.schedule('sante-demo-cleanup', '0 * * * *',
--                        'select public.cleanup_expired_demos()');
--
-- Deleting from auth.users cascades to profiles, and profiles cascades to
-- everything else.
-- ----------------------------------------------------------------------------
create or replace function public.cleanup_expired_demos()
returns integer
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  removed integer;
begin
  with gone as (
    delete from auth.users u
    using public.profiles p
    where p.id = u.id
      and p.is_demo
      and p.expires_at < now()
    returning u.id
  )
  select count(*) into removed from gone;

  return removed;
end;
$$;

revoke all on function public.cleanup_expired_demos() from public, authenticated, anon;


-- ============================================================================
-- VERIFY — run this after, and read the output rather than assuming.
--
-- Every table must show rowsecurity = true. Any false is a leak.
-- ============================================================================
-- select tablename, rowsecurity
-- from pg_tables
-- where schemaname = 'public'
-- order by tablename;   

