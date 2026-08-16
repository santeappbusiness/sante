
-- ============================================================================
-- Santé — migration 0003: align the demo seed with the frozen contract.
--
-- Fixes the baseline plan so the Before/After diff reads 35 -> 12, adds
-- movement ids, and corrects the tag vocabulary.
--
-- Authored by Amazing Man (contract owner), run by Serene.
--
-- Why the ids matter: the server hands Luna a filtered list of movement ids
-- and Luna may only return ids from that list. Without ids there is nothing
-- to check a returned movement against, and "the model cannot invent a
-- movement" stops being enforceable. They are the safety model, not a detail.
--
-- Run in: Supabase SQL Editor, SANTE project (not sante-hq).
-- ============================================================================
 
-- OPEN QUESTION FOR AMAZING MAN — do not resolve by guessing.
-- The items below sum to 5+6+7+5+6 = 29 minutes, but total_minutes is 35.
-- If the UI ever sums items, the Before column reads 29 while the pitch, the
-- video and the build bible all say 35. Which is authoritative: the per-item
-- minutes in src/lib/demo-data.ts, or the 35 total? Leaving as-authored so
-- the catalogue stays the source of truth.
 
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
    'Stay consistent without forcing myself through bad days', 30,
    '{jumping}', true,
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
      'Today''s session',
      -- ids must match src/lib/demo-data.ts. minutes and intensity are carried
      -- for display only; the server resolves the real movement by id.
      '[
        {"id": "mv_walk",  "name": "Gentle walk in place", "minutes": 5, "intensity": "low"},
        {"id": "mv_squat", "name": "Bodyweight squats",    "minutes": 6, "intensity": "moderate"},
        {"id": "mv_lunge", "name": "Walking lunges",       "minutes": 7, "intensity": "moderate"},
        {"id": "mv_core",  "name": "Core hold",            "minutes": 5, "intensity": "moderate"},
        {"id": "mv_jumps", "name": "Jump squats",          "minutes": 6, "intensity": "high"}
      ]'::jsonb,
      35,
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
-- VERIFY
--
-- NOTE: this returns 0 rows until someone actually clicks "Try the demo".
-- The function only DEFINES the seed; nothing is inserted until a session
-- starts. An empty result here is expected, not a failure.
-- ============================================================================
-- select title, total_minutes, intensity, jsonb_array_length(items) as movements
-- from public.plans where is_baseline;
-- -- expect once a demo has run: Today's session | 35 | moderate | 5
 
