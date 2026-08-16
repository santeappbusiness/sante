
-- ============================================================================
-- Santé — migration 0004: make "server only" enforced, not conventional.
--
-- Caught by Amazing Man. 0002's comment claimed red_flag was server-only, but
-- RLS filters ROWS, never COLUMNS. The insert policy checked
-- profile_id = auth.uid() and stopped there, so a client holding the anon key
-- could insert a check-in with selected_flags = {chest_pain} AND
-- red_flag = false, and the database would accept it.
--
-- The app never did this, and the real gate runs in computeReadiness() before
-- the model is reachable — so the demo was not unsafe. But "the client cannot
-- switch the safety path off" is a sentence we will write in the submission,
-- and it was true by convention rather than by construction. This makes it
-- structural.
--
-- Two changes:
--   1. Clients lose write access to checkins and adaptations entirely
--   2. Clients can update only their own presentational profile fields
--
-- Run in: Supabase SQL Editor, SANTE project (not sante-hq).
-- ============================================================================
 
 
-- ----------------------------------------------------------------------------
-- 1. Check-ins and adaptations become read-only to the client.
--
-- Everything already posts to /api/adapt, which computes the verdict, so the
-- UI needs no insert rights at all. The route writes with the service-role
-- key, which bypasses RLS by design.
--
-- With RLS enabled and no INSERT policy, client inserts are denied outright —
-- no grant juggling needed. SELECT policies are untouched: each visitor still
-- reads exactly their own rows.
--
-- Defensible claim this buys us: the safety verdict is written only by the
-- server, and the client has no privilege to write it at all.
-- ----------------------------------------------------------------------------
drop policy if exists "own checkins: insert"    on public.checkins;
drop policy if exists "own adaptations: insert" on public.adaptations;
 
comment on table public.checkins is
  'Append-only, server-written. No client INSERT or UPDATE policy exists. '
  'The deterministic gate verdict (red_flag, red_flag_reasons) is written by '
  '/api/adapt via service-role and cannot be supplied or altered by a client.';
 
comment on table public.adaptations is
  'Server-written. constraints_applied records what the APP computed, which is '
  'the evidence the model worked inside a box it could not widen. If a client '
  'could write it, it would prove nothing.';
 
 
-- ----------------------------------------------------------------------------
-- 2. profiles — close the privilege-escalation hole.
--
-- Also Amazing Man's catch. The UPDATE policy allows any authenticated user to
-- update their own row, which includes is_demo and expires_at. A demo visitor
-- could set is_demo = false to leave demo status, or push expires_at out to
-- avoid cleanup. Row-scoped, but the wrong columns.
--
-- Column-level grants are the right tool here: the user genuinely does need to
-- update their own preferences, so dropping the policy is too blunt. A
-- table-level grant covers every column, so it must be revoked before the
-- narrower one is granted.
--
-- id, is_demo, expires_at and created_at are deliberately absent below.
-- ----------------------------------------------------------------------------
revoke update on public.profiles from anon, authenticated;
 
grant update (
  display_name,
  goal,
  preferred_minutes,
  avoid_tags,
  nd_mode,
  context
) on public.profiles to authenticated;
 
comment on column public.profiles.is_demo is
  'Set once by start_demo_session(). Not client-updatable: excluded from the '
  'column grant in 0004.';
comment on column public.profiles.expires_at is
  'Demo TTL. Not client-updatable — otherwise a visitor could opt out of cleanup.';
 
 
-- ----------------------------------------------------------------------------
-- 3. Confirm the demo seeder still works.
--
-- start_demo_session() is SECURITY DEFINER and runs as the table owner, so it
-- bypasses RLS and these grants. Dropping the insert policies does not break
-- demo seeding. Worth stating explicitly because it looks like it should.
-- ----------------------------------------------------------------------------
 
 
-- ============================================================================
-- VERIFY — three checks. Run them; do not assume.
-- ============================================================================
 
-- 1. checkins and adaptations should now show SELECT only.
--
-- select tablename, policyname, cmd, roles
-- from pg_policies
-- where schemaname = 'public' and tablename in ('checkins', 'adaptations')
-- order by tablename;
 
-- 2. profiles UPDATE grants should list six columns and NOT is_demo,
--    expires_at, id or created_at.
--
-- select grantee, column_name, privilege_type
-- from information_schema.column_privileges
-- where table_schema = 'public' and table_name = 'profiles'
--   and privilege_type = 'UPDATE' and grantee in ('anon','authenticated')
-- order by grantee, column_name;
 
-- 3. The attack test. In the deployed app's browser console, signed in as a
--    demo visitor, BOTH of these must be rejected:
--
--    await supabase.from('checkins').insert({
--      profile_id: (await supabase.auth.getUser()).data.user.id,
--      energy: 1, discomfort: 5, mood: 2, sensory_load: 5,
--      selected_flags: ['chest_pain'],
--      red_flag: false                     // must fail
--    })
--
--    await supabase.from('profiles')
--      .update({ is_demo: false })         // must fail
--      .eq('id', (await supabase.auth.getUser()).data.user.id)
--
--    Do not tick the security checklist until you have watched both fail.
 
