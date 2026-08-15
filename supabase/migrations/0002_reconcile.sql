/0002 reconcile · SQL
-- ============================================================================
-- Santé — migration 0002: reconcile with src/types/domain.ts
--
-- Amazing Man owns the shared contract and it is frozen, so where his shapes
-- and mine disagreed, his win. This aligns the database to them.
--
-- SAFE TO RUN NOW: every table has 0 rows, so column type changes need no
-- data migration. This stops being true the moment anyone runs the demo.
-- Run it before that happens.
--
-- Run in: Supabase SQL Editor, SANTE project (not sante-hq).
-- ============================================================================
 
-- Guard. If this raises, stop and tell me — the file assumes empty tables.
do $$
declare n integer;
begin
  select (select count(*) from public.checkins)
       + (select count(*) from public.feedback)
       + (select count(*) from public.adaptations)
  into n;
  if n > 0 then
    raise exception 'Tables are not empty (% rows). Do not run 0002 blind.', n;
  end if;
end $$;
 
 
-- ----------------------------------------------------------------------------
-- 1. profiles — the columns the app expects and I did not have.
--
-- `context` is self-reported storytelling only. It is NEVER passed to the
-- red-flag gate and never treated as a clinical input. Santé is not a medical
-- product and this column is the most likely place for that line to blur, so
-- it is worth being explicit in the schema itself.
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists goal              text,
  add column if not exists preferred_minutes integer
    check (preferred_minutes is null or preferred_minutes between 5 and 180),
  add column if not exists avoid_tags        text[] not null default '{}',
  add column if not exists nd_mode           boolean not null default false,
  add column if not exists context           text
    check (context is null or char_length(context) <= 1000);
 
comment on column public.profiles.context is
  'Self-reported narrative context. Storytelling only. Never a clinical input, '
  'never consumed by the red-flag gate.';
 
comment on column public.profiles.avoid_tags is
  'Movement tags the person wants excluded. Enforced server-side when computing '
  'constraints, not left to the model to respect.';
 
 
-- ----------------------------------------------------------------------------
-- 2. checkins — scale changes from 0-10 to 1-5.
--
-- THIS IS THE SAFETY-CRITICAL ONE. The red-flag gate reads these numbers.
-- A discomfort of 4 means "mild" on a 0-10 scale and "severe" on 1-5. If the
-- frontend sends 1-5 while the database accepts 0-10, nothing errors — the
-- gate just quietly under-triggers on the people it exists to protect.
--
-- Whoever writes the gate: read the scale from ONE place. Do not hardcode
-- thresholds in two files.
-- ----------------------------------------------------------------------------
alter table public.checkins drop constraint if exists checkins_energy_check;
alter table public.checkins drop constraint if exists checkins_discomfort_check;
alter table public.checkins drop constraint if exists checkins_mood_check;
alter table public.checkins drop constraint if exists checkins_sensory_load_check;
 
alter table public.checkins
  add constraint checkins_energy_check       check (energy       between 1 and 5),
  add constraint checkins_discomfort_check   check (discomfort   between 1 and 5),
  add constraint checkins_mood_check         check (mood         between 1 and 5),
  add constraint checkins_sensory_load_check check (sensory_load between 1 and 5);
 
-- User-selected flags vs the server's verdict. Two different things, kept apart
-- deliberately.
--
--   selected_flags   — what the person ticked in the UI. CLIENT INPUT.
--   red_flag         — the gate's conclusion. SERVER ONLY.
--   red_flag_reasons — why the gate concluded it. SERVER ONLY.
--
-- The gate reads selected_flags as evidence. It does not accept red_flag from
-- the client. Anyone holding the anon key can post whatever they like to an
-- insert, so a client-supplied "no red flag" must never be able to switch the
-- safety path off.
alter table public.checkins
  add column if not exists selected_flags text[] not null default '{}';
 
comment on column public.checkins.selected_flags is
  'Red-flag options the user ticked. Client input, treated as evidence.';
comment on column public.checkins.red_flag is
  'Deterministic gate verdict. Written server-side only. Never trusted from client.';
 
 
-- ----------------------------------------------------------------------------
-- 3. adaptations — store the original plan inline.
--
-- Amazing Man is right that this beats a foreign key. If someone edits their
-- baseline plan later, a reference would make every past diff render against
-- the NEW baseline — the Before column would silently start lying. An
-- adaptation is a historical record, so it carries its own copy.
--
-- plan_id stays as a soft link for analytics. It is not what the diff reads.
-- ----------------------------------------------------------------------------
alter table public.adaptations
  add column if not exists original_plan jsonb;
 
update public.adaptations set original_plan = '{}'::jsonb where original_plan is null;
alter table public.adaptations alter column original_plan set not null;
 
comment on column public.adaptations.original_plan is
  'Snapshot of the Before plan at adaptation time. The diff reads THIS, not plan_id.';
comment on column public.adaptations.constraints_applied is
  'Constraints the APP computed. Evidence the model worked inside a box it could not widen.';
 
 
-- ----------------------------------------------------------------------------
-- 4. feedback — three-way verdict, plus which movements were completed.
-- ----------------------------------------------------------------------------
alter table public.feedback drop column if exists rating;
drop type if exists feedback_rating;
 
do $$ begin
  create type feedback_verdict as enum ('too_much', 'just_right', 'could_do_more');
exception when duplicate_object then null; end $$;
 
alter table public.feedback
  add column if not exists verdict feedback_verdict not null,
  add column if not exists completed_movements text[] not null default '{}';
 
 
-- ----------------------------------------------------------------------------
-- 5. Refresh the demo seed so Maya has the new profile fields.
--
-- The plan `items` shape is still my guess. Once domain.ts is readable,
-- check the field names against it and correct them here — this is the only
-- place in the SQL where that shape is hardcoded.
-- ----------------------------------------------------------------------------
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
 
  insert into public.profiles (
    id, display_name, is_demo, expires_at,
    goal, preferred_minutes, avoid_tags, nd_mode, context
  )
  values (
    uid, 'Maya', true, now() + interval '24 hours',
    'Move most days without wiping myself out', 30,
    '{high_impact}', true,
    'Some days I have plenty in the tank and some days I do not. I want a plan '
    'that meets me where I am instead of one I keep failing.'
  )
  on conflict (id) do nothing;
 
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
        {"name": "Morning walk",     "minutes": 20, "intensity": "moderate"},
        {"name": "Strength circuit", "minutes": 25, "intensity": "high"},
        {"name": "Evening stretch",  "minutes": 10, "intensity": "low"}
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
 
 
-- ============================================================================
-- VERIFY — run these after and read the output.
-- ============================================================================
-- select tablename, rowsecurity from pg_tables
--   where schemaname = 'public' order by tablename;
--
-- select table_name, column_name, data_type, is_nullable, column_default
-- from information_schema.columns
-- where table_schema = 'public'
-- order by table_name, ordinal_position;
 
