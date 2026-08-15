# Re: RLS policies — approved, with one hole to close

Structure is right. Every policy is scoped to `authenticated` and keyed on `auth.uid()`, which
with anonymous sign-in gives a real per-visitor boundary rather than one that depends on uuids
being hard to guess. Using `(select auth.uid())` rather than a bare call is the right pattern
too, since Postgres caches it as an initplan instead of re-evaluating per row.

Three things you did that I want to keep, then the one that needs fixing.

## Keep

**Check-ins and adaptations have no UPDATE policy.** Deliberate or not, it is correct. Both are
historical records. A check-in that can be edited after the fact is evidence that can be
rewritten, and an adaptation that can be edited makes the Before/After diff untrustworthy.
Append-only is right. Please leave it.

**No DELETE anywhere.** Also fine for the weekend. It does mean a real "delete my data" feature
cannot work as written, so either we add a policy when we build it, or we do not claim it.
Since it is P1, my vote is do not build it and do not claim it. Demo reset does not need it:
with anonymous auth I just start a new anonymous user, so reset is a new identity rather than a
deletion.

**Nothing granted to `anon`.** Correct. Anonymous sign-in produces an `authenticated` JWT, so
`anon` should stay empty.

## The hole

Your migration comment says:

> `red_flag` — the gate's conclusion. SERVER ONLY. Never trusted from client.

The policies do not enforce that. RLS filters **rows**, never **columns**. Your insert policy
is:

```sql
with_check (profile_id = (select auth.uid()))
```

which permits any authenticated user to insert a row of their own containing **any values in
any columns**, including `red_flag = false` while `selected_flags` contains `chest_pain`. The
invariant you wrote down in a comment is not the invariant the database enforces.

The same applies to `profiles`: the UPDATE policy lets a demo visitor set `is_demo = false` or
push out `expires_at`.

To be clear about actual impact: our app does not do this, and the real safety gate runs in
`computeReadiness()` on the server before the model is reachable, so the *demo* is not unsafe.
But "the client cannot switch the safety path off" is a claim we will make in the submission,
and right now it is true by convention rather than by construction.

## The fix I would like, and it is small

Move check-in and adaptation writes server-side. Our app already posts everything to
`/api/adapt`, which computes the verdict, so nothing in the UI needs insert rights at all:

```sql
-- The client reads its own rows. It does not write them.
drop policy if exists "own checkins: insert"    on public.checkins;
drop policy if exists "own adaptations: insert" on public.adaptations;
```

Then our API route writes with the service-role key, which bypasses RLS by design. The client
keeps its SELECT policies and sees exactly its own rows.

That gives us a sentence we can defend in the submission: *the safety verdict is written only
by the server, and the client has no privilege to write it at all.*

If you would rather keep client inserts, the alternative is column-level grants, which do work
but are fiddlier, because a table-level grant covers every column and has to be revoked first:

```sql
revoke insert on public.checkins from authenticated;
grant insert (profile_id, energy, discomfort, mood, sensory_load, selected_flags, note)
  on public.checkins to authenticated;
```

Note that `red_flag` and `red_flag_reasons` are simply absent from the grant. You will need to
confirm the exact column list against your table; I do not have it.

Either is fine. Tell me which and I will build the store to match. My preference is the first,
because it also removes any question about what else a client could write.

## What I need to start wiring it

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` set in Vercel only, never in a `NEXT_PUBLIC_` variable and never
  in the repo
- Confirmation that **anonymous sign-ins are enabled** in Auth settings, since it is off by
  default and everything above depends on it

Send those and the swap from browser storage to Supabase is one class, because every read and
write in the app already goes through `src/lib/storage.ts`.

## For your checklist

When you run the two-account RLS test, the useful version is now: open the demo in two
different browsers, confirm each gets a different `auth.uid()`, and confirm neither can read the
other's check-ins. That tests the real mechanism rather than a synthetic one, and it is exactly
the evidence to paste into HQ.
