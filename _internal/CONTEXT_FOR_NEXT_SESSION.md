# Santé: context handoff for a new coding session

Read this file completely before you touch anything. It is written for a fresh
Claude session working with a teammate on the main product during a 48-hour
hackathon. It tells you what Santé is, what is already built, what the rules
are, and what is still wrong.

This file is committed so anyone who clones the repo gets it. The rest of
`_internal/` is gitignored and stays local. Nothing here is a secret, but it is
internal: never link it from the README, the app, or the submission.

---

## 0. Who you are on this project

Act as all of these at once, and say so plainly when they disagree:

- **Senior product engineer.** You own the code end to end. You write it, you
  verify it in a browser, you do not hand back untested work.
- **Product lead.** You are allowed to say a request is the wrong call, once,
  with a reason. Then you build what was asked.
- **UX and accessibility reviewer.** This app is for people whose days vary and
  for neurodivergent users. Every interaction is judged on whether it works on
  someone's worst day, not their best.
- **Security reviewer.** Assume an adversarial judge will open dev tools.
- **Hackathon judge.** After every stretch of work, ask: does this raise or
  lower our score in the Wellness track and the Best Use of AI bonus?

**Free hand.** You are explicitly authorised to fix, improve, or add things
nobody asked for, as long as you say what you did and why. If you spot a bug, a
dead end, a security hole, a clumsy interaction, an ugly screen, or a missed
chance to win, act on it. Do not sit on an observation waiting for permission.

**No bullshit.** Do not pad, do not congratulate, do not describe work as
finished when it has not been run. If a thing is broken and you did not fix it,
say so in one sentence and say why.

---

## 1. What Santé is

A capacity-first movement app. You open it, see the session you planned, answer
four questions (energy, discomfort, mood, sensory load) in about twenty seconds,
and the plan changes to fit the day you are actually having. Every change
explains itself in plain language.

The pitch in one line: **keep the goal, change the route.**

Competitor apps that adapt to daily readiness mostly require a wearable. Santé
needs twenty seconds and a phone, which matters because the people whose days
vary most are the least likely to afford the hardware.

**Tracks:** Wellness (main), Best Use of AI (bonus), Most Viral (optional).

**Team:** Serene (backend/security/Supabase), Amazing Man (frontend/AI, and the person
you are working with), Dua (brand/video), Jue (ops/submission).

**Names you will see in the code:**
- **Maya**: the fictional demo user. Every anonymous visitor is Maya.
- **Luna**: the model doing the adaptation (`gpt-5.6-luna` via the OpenAI
  Responses API). Not a separate service, just what we call the assistant.
- **Bloom**: the four-petal capacity visual on Home and Today.
- **Calm mode**: the neurodivergent-friendly mode. Called `nd_mode` in the
  database, `neurodivergent_mode` on the domain type, "Calm mode" in every
  user-facing string. Do not rename it back. The two field names are translated
  deliberately in `src/app/api/adapt/route.ts`; that is not a bug. See 6.6 for
  how Calm mode reaches the session.

---

## 2. Repos, deploys, accounts

| Thing | Where |
|---|---|
| Main app repo | `github.com/santeappbusiness/sante` (private) |
| Main app deploy | https://sante-chi.vercel.app |
| Internal tool repo | `github.com/santeappbusiness/sante-hq` |
| Internal tool deploy | https://sante-hq.vercel.app |
| Build bible | https://sante-buid-doc.dudeamazingman.workers.dev/ |
| Supabase project | `vrsjmqlpnaxdsxydihyu.supabase.co` |

Local working directory: `/Users/hassanali/Santé App/sante`

---

## 3. Git and GitHub rules: read this before your first commit

### Authorship

**Never add a Claude co-author trailer.** No `Co-Authored-By: Claude`, no
`Generated with Claude Code`, no bot attribution of any kind, in commits or in
PR bodies. Commits are authored by the human.

The repo already has local git config set correctly:

```bash
git config --local --get user.name    # santeappbusiness
git config --local --get user.email   # santeappbusiness@gmail.com
```

If you clone fresh and those are missing, set them before committing.

### Commit messages

Human language describing what changed and why, in full sentences. Not
conventional-commits, not a changelog, not bullet soup. A subject line under
about 72 characters, a blank line, then prose paragraphs.

Good:

```
Seed the demo for returning visitors too, not only first-time ones

Maya's history was only ever created on the path that starts a brand new
session. Anyone who had opened the app before already had an identity, so
that path never ran again and they kept landing on an empty Progress page.
```

Bad: `feat(store): add bootstrap to load()` or `fix stuff`.

### Pushing

The remote already embeds the username because the machine keychain holds a
different GitHub account:

```
https://hassanali-ko@github.com/santeappbusiness/sante.git
```

If a push fails with **"Repository not found"**, that is the keychain serving
the wrong account, not a permissions problem. The username in the remote URL is
what fixes it.

### If Claude is not connected to GitHub

You do not need a GitHub integration, an app install, or an OAuth connection to
work on this repo. Everything happens through the local `git` CLI over HTTPS.

**Never ask the user to paste a token into the chat, and never accept one if
they do.** A personal access token was pasted in plaintext earlier in this
project and had to be revoked. If a token reaches the transcript it is burned.

Working options, in order of preference:

1. **Already authenticated (most likely).** Just run `git push`. Credentials are
   in the macOS keychain from a previous session.
2. **`gh` CLI.** Have the *user* run `gh auth login` in their own terminal and
   complete the browser flow themselves. You never see the credential. After
   that, `git push` works.
3. **Git credential helper.** Have the user run
   `git config --global credential.helper osxkeychain`, then push once and enter
   the credential in the terminal prompt themselves.
4. **No push access at all.** Commit locally, then tell the user the exact
   command to run. Leave the work committed on the branch so nothing is lost.
   Do not silently skip committing because you cannot push.

Never enter a password, token, or any credential on the user's behalf, in a
terminal or a browser form. Ask them to do it, and continue with everything else
in the meantime.

### Secrets

`.env.local` is gitignored and has never been committed. Keep it that way. The
Supabase service-role key and the OpenAI key live only in `.env.local` locally
and in Vercel environment variables in production. If a secret ever appears in
the chat, stop, tell the user to rotate it immediately, and do not use it.

---

## 4. Stack and architecture

- Next.js 14 App Router, TypeScript, React 18, Tailwind. No component library.
- Supabase: Postgres, anonymous auth (`signInAnonymously`), RLS on `auth.uid()`.
- OpenAI Responses API, model `gpt-5.6-luna`, function calling plus structured
  outputs (`json_schema`, strict).
- SSE (`text/event-stream`) so the agent's real steps stream to the UI.
- Zod-first: schemas in `src/types/domain.ts` are the source of truth, TS types
  are inferred from them.

### The files that matter

| File | What it is |
|---|---|
| `src/types/domain.ts` | Frozen contracts. Zod schemas for check-in, plan, adaptation, agent events. Change carefully. |
| `src/lib/readiness.ts` | Deterministic. Red-flag gate, capacity score, constraint derivation, fallback plan. **No AI here, ever.** |
| `src/lib/luna.ts` | The agent loop, tools, re-validation, natural-language request interpretation. |
| `src/app/api/adapt/route.ts` | The SSE route. Safety gate → constraints → Luna → re-check → save. |
| `src/lib/persist.ts` | All database writes. Identity comes from the bearer token, never the request body. |
| `src/lib/workouts.ts` | 24 workouts, 20 collections. Collection → workout → movements. |
| `src/lib/week.ts` | The weekly planner, localStorage-backed. |
| `src/lib/patterns.ts` | Arithmetic-only pattern derivation for Progress. Minimum 3 entries. |
| `src/lib/seed-demo.ts` | Maya's 7-day history, written server-side with the service-role key. |
| `src/lib/supabase/store.ts` | The storage seam. `BrowserStore` / `SupabaseStore` behind one `Store` interface. |
| `src/components/CapacityBloom.tsx` | The Bloom. Real petal paths, not ellipses. |
| `src/components/SessionPlayer.tsx` | The session runner, timer, mid-session swap. |
| `src/components/AppPeek.tsx` | Drawn app views used on the landing page. Not screenshots, so they cannot go stale. |
| `src/components/BrandShapes.tsx` | Blob, Arch, Flower, Asterisk, Waves, Sprig. All decorative, all `aria-hidden`. |
| `supabase/migrations/` | Four migrations, all already applied. |

### The safety model: do not weaken it

1. Red-flag check runs first, in ordinary code. Chest pain, fainting, severe or
   unusual pain, possible pregnancy complication → no session is generated, and
   **no AI is involved in that decision**.
2. Constraints computed deterministically: max intensity, target minutes, max
   movements, excluded tags.
3. Luna may only pick from movements that already satisfy those constraints. The
   tool it calls returns a pre-filtered list.
4. Luna's answer is re-validated against the constraints after Zod parsing. Out
   of bounds → one retry → deterministic fallback.
5. The app works with the AI switched off and says so when it happens.

**The AI never widens a limit.** If you find yourself moving a check after the
model call, or letting the model choose the constraints, stop.

### Two hard-won implementation details

- **Luna is a reasoning model.** `function_call` items are paired with
  `reasoning` items. The follow-up turn must echo the **entire**
  `response.output` array, in order, unfiltered:
  `input = [...input, ...response.output, ...outputs]`. Filtering it produces
  `function_call was provided without its required reasoning item`. See
  `_internal/luna-notes.md`.
- **RLS filters rows, not columns.** Column-level GRANTs are what stop the
  browser client writing the safety verdict. Serene set these up; do not assume
  a policy alone protects a column.

---

## 5. What is already built and working

Verified live on `sante-chi.vercel.app` as of the last session:

- Landing page with drawn product views, impact framing, feature list, and the
  AI-limits explainer.
- Anonymous demo. Every visitor lands as Maya with a week and a real history.
- Check-in as an in-place bottom sheet on Home, and inline on Today.
- Full adaptation flow with streaming agent steps, `used_fallback: false`,
  `source: gpt-5.6-luna`, saved to the database with a real adaptation id.
- Session player: one movement at a time, opt-in timer, help link per movement,
  mid-session swap capped so a swap can never make the session longer, mark done
  advances to the next movement.
- Weekly planner: add, move, clear, retype days; rebalance proposal.
- Progress: honoured days, plans adapted, minutes, a fortnight chart, derived
  patterns, recent days.
- Profile: every setting is live and used; "What Santé remembers" lists each
  fact with its source.
- Calm mode: reshapes the interface, biases which workouts get recommended, and
  constrains the adapted session in our own deterministic code, so it holds on
  the fallback path too. See 6.6 for how, and for what not to undo.
- Email/password auth. **No Google auth.** This was explicitly killed. Do not
  add provider buttons back.
- Demo seeding is automatic, server-side, and idempotent. Nothing manual is
  needed in Supabase.

---

## 6. Open work, in priority order

### 6.1 DONE: the email confirmation flow

The callback is built and the templates are written. **The dashboard steps are
not done and cannot be done from here**: see `_internal/email-templates/README.md`
for exactly what to paste where, including the redirect URLs, which the flow
will not work without.

What follows is the original write-up, kept because it explains why the code
looks the way it does.

<details><summary>Original</summary>

Two separate problems, both blocking a judge who tries to make a real account.

**Problem A: the confirmation email is the Supabase default.** Plain black
Helvetica, "Supabase Auth <noreply@mail.app.supabase.io>", a bare "Confirm your
email address" link, and a footer that says "powered by Supabase". A judge who
signs up sees another company's branding before they see ours.

Fix it in **Supabase Dashboard → Authentication → Email Templates**. Templates
to brand: Confirm signup, Magic Link, Change email address, Reset password.

Constraints for the template HTML:
- Table-based layout, inline styles only. Email clients ignore `<style>` blocks
  and every modern CSS feature.
- Palette from `tailwind.config.ts`: canvas `#F7F6F2`, surface `#FFFDF9`, ink
  `#2F3A33`, ink-soft `#55635B`, moss `#A0A87C`, moss-deep `#5F7D52`, lavender
  `#CEC3D6`, coral `#F97C50` with `#3A1B0C` text on it.
- Georgia/serif for headings to echo the display face, system sans for body.
- The logo must be an absolute URL:
  `https://sante-chi.vercel.app/brand/sante-mark.png`. Relative paths do not
  work in email. Many clients block images by default, so the email must still
  read correctly with images off.
- Voice matches the app: warm, plain, no exclamation marks, no em dashes.
- Keep the required `{{ .ConfirmationURL }}` token.
- Also set **Authentication → Emails → sender name** so it stops saying
  "Supabase Auth".

Write the templates into `_internal/email-templates/` as files so they are
reviewable and version-controlled, then have the user paste them into the
dashboard. You cannot reach the Supabase dashboard yourself.

**Problem B: clicking the confirmation link does not sign the person in.** It
drops them on the landing page as an anonymous visitor, so they have to work out
for themselves that they now need to go and sign in. That is a dead end at
exactly the moment someone has committed to the product.

What should happen: the link lands on a route that exchanges the token for a
session, calls `/api/bootstrap`, and sends the person straight into
`/onboarding` with their account already signed in.

Implementation sketch:
- Add `src/app/auth/callback/route.ts` (or a client page) that reads the `code`
  / `token_hash` and `type` params and calls `supabase.auth.exchangeCodeForSession`
  or `verifyOtp`, then redirects.
- Set **Site URL** and **Redirect URLs** in Supabase Auth settings to include
  `https://sante-chi.vercel.app/auth/callback` and the localhost equivalent.
- Pass `options: { emailRedirectTo }` in the `signUp` call in
  `src/app/signin/page.tsx:49`.
- Handle the failure cases honestly: an expired link, an already-used link, a
  link opened in a different browser. Each needs its own message and a way
  forward, not a generic error.
- The `notice` copy at `src/app/signin/page.tsx:62` currently says "then sign
  in". Once the callback works it should say the confirmation link takes them
  straight in.

Test the whole path end to end with a real address before calling it done.

</details>

### 6.2 DONE: a real welcome and onboarding

Seven screens, a Calm mode screen with a live preview, a closing screen that
builds a real plan from the answers, and a once-only welcome for demo visitors
in `src/components/DemoWelcome.tsx`.

<details><summary>Original</summary>

`src/app/onboarding/page.tsx` exists but it is thin: five steps, plain type, no
brand shapes, no motion, no sense of arrival, and it only runs for
password-signup users. A judge opening the demo never sees it at all.

What it needs to become:

- **A genuine welcome.** The first screen should say what Santé is and what is
  about to happen, in one short paragraph, with the mark and a brand shape. Not
  a bare `<h1>` over a form.
- **Calm mode has to be a highlight, not a step.** Right now it is one of five
  questions with equal weight. It is our strongest accessibility story and one
  of the reasons we win the Wellness track. Give it its own screen with a real
  before/after preview so the person can *see* what changes: larger type, fewer
  choices, no motion, shorter instructions, quieter surfaces. Say plainly that
  it changes the session too, not only the interface. Let them try it and toggle
  it right there.
- **It should demonstrate value, not just collect settings.** After the answers,
  show the person their first plan being built from what they just said. Ending
  on "your Santé is ready" and a redirect wastes the moment.
- **A demo visitor needs a version of this too.** A judge landing on `/home` as
  Maya currently gets no orientation whatsoever. Consider a short, skippable,
  once-only welcome overlay that names the three things worth trying: check in,
  see the plan change, look at the week. Store the "seen" flag in localStorage
  keyed per identity. It must be dismissible in one tap and must never appear
  twice.
- **Every step stays skippable.** That principle is already right. Keep it.
- Onboarding currently writes with `sb.from("profiles").update(...)`. Confirm
  RLS actually permits that for a freshly confirmed user, because a silent
  failure here loses everything they just told us.

</details>

### 6.3 DONE: UI and UX bugs

<details><summary>Original</summary>

- **Explore cards are washed out.** `WorkoutCard`'s featured tint is
  `bg-moss/20` (see `TINT` in `src/components/WorkoutCard.tsx`) and it sits on
  the Explore header band, which is also `bg-moss/20`. The card effectively
  disappears into the background. It needs its own contrast: a solid surface, a
  ring, a shadow, or a different tint that is not the same value as the band it
  overlaps. Check the same collision on every page that pulls a card up into a
  tinted band.
- **"Feeling different today?" sits under the header band.** On
  `src/app/workout/[id]/page.tsx:90` the card uses `-mt-5` without the
  `relative z-10` that the other pull-ups got. Same class of bug as the "Sunday,
  as planned" overlap that was fixed on Home. Audit every `-mt-*` pull-up in
  `src/app` for a missing `relative z-10`, and give the band above enough bottom
  padding that the card has somewhere to land.

</details>

### 6.4 DONE: animation and motion

The vocabulary now covers page entrances, the Bloom opening, figures, presses
and focus. Everything is guarded twice, by calm mode and by reduced motion, and
every animated class has a visible end state under both guards so switching
motion off never hides content.

<details><summary>Original</summary>

There is a small motion vocabulary in `src/app/globals.css`: `sante-rise`
(`morph-in`), `sante-sheet`, `sante-nav-settle`, `sante-nav-bloom`. It is used
in a few places and absent everywhere else, which makes the app feel
half-finished.

Extend it deliberately, not decoratively:

- Page and section entrances that stagger content in rather than snapping it.
- The Bloom should grow into place when a check-in resolves. It is the emotional
  centre of the product and currently just appears.
- The plan diff should feel like a transformation, not a swap. The whole pitch
  is "your plan flexed" and the moment deserves a real transition.
- Number transitions on Progress.
- Press states, focus states, and hover states on every interactive element.
- Sheet and modal enter/exit.

**Non-negotiable motion rules:**
- Everything must be disabled under `[data-nd="on"]` (Calm mode) and under
  `@media (prefers-reduced-motion: reduce)`. Both guards already exist in
  `globals.css`. Extend them to cover anything you add.
- CSS transforms and opacity only. No layout-thrashing animation, no JS
  animation loop, no library.
- Nothing bouncy, nothing longer than about 500ms, nothing that delays a person
  from acting. This is an app for low-energy days. Motion should feel like
  settling, not performing.

</details>

### 6.5 Code review and hardening

Do a real pass, not a skim. Report findings with severity and a concrete failure
scenario, then fix them.

**Security**
- Confirm every database write derives identity from the bearer token, never
  from the request body. `src/lib/persist.ts` is the place to check.
- Re-verify RLS isolation between two visitors. The last check proved a client
  check-in insert is blocked (`42501`). Prove it again after any schema change.
- Confirm the service-role key is only ever imported in server-side modules.
  Grep for `getSupabaseAdmin` and check every call site runs on the server.
- `/api/adapt` now requires a bearer token and caps calls per authenticated
  identity. Anonymous tokens are accepted on purpose: the demo is the product,
  and a gate that only passed signed-up accounts would close it. Do not "tidy"
  that into a signed-up-only check. `/api/bootstrap` is still uncapped; it
  writes rows but calls no model.
- Check that no secret can reach the client bundle. Only `NEXT_PUBLIC_*` should
  be readable in the browser.
- Every value arriving in the adapt request body is bounded now: the free text
  is trimmed and capped, `recent_feedback` is parsed against the verdict enum
  before it can reach the model as tool output, and `context_tags` accepts only
  the two tags that feature can generate. Keep that property when adding
  fields. The rule is that anything from a body is either parsed against a
  schema or not used.

**Correctness**
- Any `-mt-*` pull-up without `relative z-10`.
- Any `w-full` child inside a flex column with `items-center` and no width on
  the parent. This silently collapses to zero width and already made the Home
  week bars invisible once.
- Any `Flower`/`BrandShapes` `id` prop that could contain characters unsafe in
  `url(#...)`. It is sanitised now, but new call sites can still pass odd values.
- Error paths on every `fetch` and every Supabase call. Silent `.catch(() => {})`
  hides real failures.
- The SSE route had a double-`controller.close()` bug on the red-flag path. That
  is the *safety* path. Re-verify it under a red flag.

**Accessibility**
- Keyboard navigation through the entire app, including the check-in sheet.
- Focus is trapped in the sheet and returned on close.
- Every interactive element has an accessible name.
- Contrast ratios, especially the washed-out tints in 6.3.
- `aria-live` on the adaptation result so a screen reader hears the plan change.
- Decorative shapes are all `aria-hidden`. They mostly are; verify.

**Performance and robustness**
- Offline and slow-network behaviour.
- What a judge sees if the OpenAI key is missing or rate-limited. The fallback
  should be graceful and honest.
- Anything blocking first paint.

**Hygiene**
- `npm run typecheck` and `npm run build` must both pass before any commit.
- No `console.log` left in shipped code.
- Dead code and unused exports.

### 6.6 Calm mode as a constraint (done, but know how it works)

This was a real gap and it is fixed. Recorded here because the shape of the fix
is the shape every future preference should take.

**What was wrong.** Calm mode used to be one sentence appended to Luna's prompt.
`computeReadiness` never read the flag, so it changed no constraint, the
re-validation had nothing to check it against, and the deterministic fallback
ignored it entirely. Separately, the toggle on Today was plain React state, so a
person who turned it on there got the interface change while the server kept
reading a stale `nd_mode` and Luna never heard about it. That was masked in the
demo because `MAYA.neurodivergent_mode` is `true`.

**What it does now.** In `computeReadiness`, Calm mode caps `max_movements` at
three, pushes `jumping` into `excluded_tags`, sets `prefer_quiet` on the result,
and adds its own line to `drivers` so the person sees why. `allowedMovements`
orders the pool quiet-first and, within that, longest-first. `fallbackPlan`
drops its usual keep-the-familiar-movement heuristic, because keeping the
familiar noisy movement is the one thing someone in Calm mode did not ask for.
The Today toggle now writes `nd_mode` to the profile.

**Two decisions worth not undoing.**

*It shortens the list, not the session.* Calm mode is about load, not duration,
and a long quiet session can be exactly right. Capping the count while leaving
`target_minutes` alone is deliberate.

*Longest-first inside each group.* Without it, a movement cap plus a
shortest-first walk turned a thirty minute allowance into thirteen minutes of
quiet movements. That is the same trimming-nobody-asked-for bug that the
good-day driver text was written to prevent. If you touch the ordering, re-check
a good day in Calm mode against a good day without it.

**Note for anyone re-checking this:** `nd_mode` (database column) and
`neurodivergent_mode` (domain field) are translated on purpose in
`src/app/api/adapt/route.ts`. That translation is correct and the field is not
being dropped. It was never the bug.

`runAdaptation` no longer takes a profile at all. Everything about a person that
may shape a session is absorbed into the constraints before the model is
reached, which is both the privacy story and the reason the model cannot reason
its way around a preference. Keep it that way.

---

## 7. Design and brand rules

Locked. Do not renegotiate these.

**Palette** (`tailwind.config.ts`): canvas `#F7F6F2`, surface `#FFFDF9`, ink
`#2F3A33` / soft `#55635B`, slate `#6E7D83`, moss `#A0A87C` / deep `#5F7D52`,
lavender `#CEC3D6`, coral `#F97C50` / ink `#A8420F` / on `#3A1B0C`, terracotta
`#B0533A`.

**Type:** Iowan Old Style (serif) for display, Avenir Next for body, system mono
for figures and labels. Large display type is part of the identity, so do not
shrink headings to fit more in.

**Shapes:** the six in `BrandShapes.tsx`. Always decorative, always
`aria-hidden`, never carrying meaning alone. Place them so a crop still reads as
the shape. A motif clipped into a corner reads as a stray mark, which is a bug
we have already fixed twice.

**Voice:**
- No em dashes. Anywhere. Not in code comments, not in the UI, not in commits.
- "Amazing Man", never "Amazing".
- "coding session", never "Claude Code session".
- "Calm mode", never "simplified mode".
- No guilt language, no streak-protection framing, no praise for pushing
  through. Rest counts as showing up, and the copy has to mean it.
- Plain words. If a sentence could appear in a wellness brochure, rewrite it.

**Comments in code:** explain *why*, in prose, matching the density already in
the files. Read a neighbouring file before you write one. Do not add
"// set the variable" noise.

---

## 8. Judging: be ruthless about what wins

After each stretch of work, score honestly against the tracks.

**Wellness track.** We win on the premise, not the feature count. The strongest
assets are: capacity as the organising idea, sensory load as a first-class
input, Calm mode reaching further than the interface, rest counting
in Progress, and the refusal to guilt anyone. Anything that dilutes those is a
net loss even if it adds a feature.

**Best Use of AI.** We win on restraint that is *visible*. The safety gate runs
before the model, the constraints are computed in ordinary code, the tools only
return permitted options, the answer is re-checked, and there is a working
fallback. The streamed agent steps are real events, not a fake loading
animation. Make sure a judge cannot miss any of that. The receipt on Today and
the AI section on the landing page are where it lands. If a judge has to be told
the AI is constrained rather than seeing it, we have lost the point.

**Most Viral.** The demo has to survive being opened cold on a phone by someone
who reads nothing. Time to the "your plan flexed" moment is the number that
matters. Measure it.

**Judge the work like a judge would.** Open the deployed site cold, on a phone,
with no context. Everything a judge cannot find in ninety seconds does not
exist. If a screen is boring, say it is boring and fix it.

**Say what would raise our score.** If you see a change that would materially
improve our chances and nobody has asked for it, whether that is a screen that needs
rebuilding, a story that is not landing, a moment that should be more
impressive. Propose it, then build it. Do not wait to be asked.

---

## 9. Working practices that this project learned the hard way

- **Never run `npm run build` while the dev server is running.** It corrupts
  `.next` and produces phantom 500s and 404s that waste an hour. Stop the
  preview, `rm -rf .next`, then build. This has happened three times.
- **Verify in a browser.** Take screenshots at 1440 wide and at 375 wide. Do not
  report a UI change as done from a typecheck.
- **A JSX comment cannot be the first thing inside `cond && ( ... )`.** Put it
  above the expression. This broke the build once.
- **Check the dev server logs after an edit**, not just the browser. A syntax
  error can leave the server serving 404s for unrelated routes.
- **Desktop is a rail plus content, not a stretched phone.** `AppNav` renders a
  left rail at `lg:` and a bottom bar below it. Wide screens need a real layout,
  not one narrow centred column with dead space either side.
- **Seeding is idempotent but the guards matter.** `seedDemoHistory` has an
  in-memory `Set` guard plus a row-count check, and `SupabaseStore` has a static
  `bootstrapped` set. React runs effects twice in development and both fire
  without them. The demo once ended up with a fortnight of history twice over.
- **When the user overrides your scoping advice, stop re-litigating.** Say the
  concern once, then build the full thing.

---

## 10. First moves for a new session

1. Read this file, then `README.md`, then `_internal/INTERNAL_NO_BS_REVIEW.md`
   and `_internal/luna-notes.md`.
2. `npm install`, confirm `.env.local` exists with the Supabase and OpenAI keys.
3. `npm run typecheck` and `npm run build` to confirm a clean baseline.
4. Start the dev server and click through every route: `/`, `/signin`,
   `/onboarding`, `/home`, `/explore`, `/explore/[id]`, `/workout/[id]`,
   `/plan`, `/today`, `/progress`, `/profile`, `/saved`.
5. Run one full adaptation and confirm `used_fallback: false` in the SSE
   response.
6. Then start on section 6, in order. 6.1 and 6.2 are urgent.

Report what you find honestly, fix what you can, and say plainly what you left
undone and why.
