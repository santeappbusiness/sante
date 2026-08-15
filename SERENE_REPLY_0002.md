# Re: migration 0002 — merged, with four corrections

This is good. Two of your calls are better than mine and I have changed the contract to match,
so pull `src/types/domain.ts` before you write anything else against it.

Four things need fixing before this goes near the demo. One of them silently breaks the hero
screen, which is the whole submission.

---

## Where you were right and I have changed the contract

**1. `context` as narrative text, not tags.** I had `self_reported_context: string[]` holding
things like `["PMDD", "anemia"]`. You are right that a column of condition labels invites being
treated as structured clinical data, and this is not a medical product. Contract now reads:

```ts
context: z.string().max(1000).nullable().default(null)
```

Your column and your comment stand as written.

**2. `selected_flags` separate from the server's verdict.** Correct, and it closes a hole I had
left implicit. Anyone with the anon key can post whatever they like, so a client-supplied
"no red flag" must never switch the safety path off. Worth stating exactly how the app behaves
now, so you can check it:

- The gate runs in `computeReadiness()` **before** the model is reachable at all
- On a red flag, the route returns without ever constructing an OpenAI client
- The client sends only `selected_flags`; it has no way to send a verdict

**3. Scale in one place.** Done. `SCALE_MIN` and `SCALE_MAX` are exported from `domain.ts`,
and the thresholds exist only in `readiness.ts`. Nothing hardcodes a bound twice.

**4. `original_plan` inline.** Agreed, and your reasoning is the right one: an adaptation is a
historical record, so a foreign key would make old diffs re-render against a new baseline and
the Before column would quietly start lying.

---

## Four corrections

### A. The seed plan breaks the hero screen — fix this one first

Your seed is `Maya's usual Tuesday`, 55 minutes, 3 items. The demo the whole submission is
built around is:

```
35 min · moderate · 5 movements   →   12 min · low · 3 movements
```

With a 55/3 baseline there is no visible drop in movement count, and the numbers stop matching
the video, the build bible and the pitch. It has to be **35 minutes, moderate, 5 movements**.

### B. Plan items need movement ids

Your items are `{name, minutes, intensity}` with no id. The safety model depends on ids: the
server hands Luna a filtered list of ids, and Luna may only return ids from that list. Without
them there is nothing to check a returned movement against, and "the model cannot invent a
movement" stops being enforceable.

The catalogue lives in code (`src/lib/demo-data.ts`, ten movements, static reference data). No
table needed. Plans just carry the ids.

### C. Tag vocabulary does not match

You used `'{high_impact}'` for `avoid_tags`. The catalogue's tags are:

```
jumping · standing · seated · floor_work · breathing · strength · quiet
```

Maya avoids `jumping`. `high_impact` matches nothing, so the exclusion would silently do
nothing — the worst kind of bug, because it looks like it is working.

### D. Red-flag values, so the enum matches exactly

```
chest_pain
fainting_or_severe_dizziness
severe_or_unusual_pain
possible_pregnancy_complication
```

---

## Corrected seed, run this as 0003

```sql
-- Santé — migration 0003: align the demo seed with the frozen contract.
-- Fixes the baseline plan so the Before/After diff reads 35 -> 12, adds
-- movement ids, and corrects the tag vocabulary.

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
```

Check it produced the right thing:

```sql
select title, total_minutes, intensity, jsonb_array_length(items) as movements
from public.plans where is_baseline;
-- expect: Today's session | 35 | moderate | 5
```

---

## Your anonymous-auth approach: I am adopting it

You went with `signInAnonymously()` plus `auth.uid()` rather than the `demo_sessions` table I
proposed. That is better and I am building against it. Real RLS keyed on `auth.uid()` is an
actual boundary; my version leaned on uuids being hard to guess, which is not the same thing.
It also means the two-account RLS test on your checklist tests the real mechanism.

What I need to wire it up, whenever you have them:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Confirmation that anonymous sign-ins are enabled in Auth settings, since it is off by default
- The RLS policies on `profiles`, `plans`, `checkins`, `adaptations`, `feedback` — I want to
  read them before I write against them

The app already routes every read and write through one interface (`src/lib/storage.ts`), so
switching from browser storage to Supabase is one new class and one line. Nothing else moves.

## One thing to decide together

Demo profiles expire after 24 hours in your function. Nothing deletes them yet. Either a cron,
or we accept the rows accumulate over a weekend, which for a hackathon is fine. My vote is
accept it and spend the time elsewhere, but flag it in the submission notes rather than
claiming cleanup we did not build.
