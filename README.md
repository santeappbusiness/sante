# Santé

**Your body changed today. Your plan should too.**

Santé adapts today's movement plan to the capacity you actually have, based on a twenty-second
check-in instead of a wearable. When the plan is too much, it shortens it, explains why, and
lets you keep the original if you disagree.

---

## The problem

Most wellness apps assume every day is the same. They hand you a fixed plan and treat missing
it as a failure, which is how people end up abandoning something that was supposed to help.

Capacity is not constant. Energy, pain, mood and sensory overload change day to day, and for
a lot of people they change a great deal. The apps that do adapt to daily readiness mostly
require a wearable, which means the people most likely to have unpredictable days are the
least likely to be able to afford the hardware that would help.

## What Santé does

You open the app and see the session you intended to do today:

```
30 min · moderate · 5 movements
```

You answer four questions on a slider: energy, discomfort, mood, sensory load. It takes about
twenty seconds. Then the plan changes:

```
12 min · low · 3 movements
```

Underneath, in plain language, is why:

> You reported low energy and high discomfort, so the session is shorter and low intensity.
> You reported high sensory load, so you have mostly seated, quiet options.

You can start the adapted plan, ask for something lighter still, or keep the original. It is
your body and your call. Afterwards you say whether it was too much, just right, or you could
have done more, and the next adaptation takes that into account.

## What makes it different

**No wearable.** Twenty seconds and a phone. Nothing to buy, charge or wear to bed.

**It shows its work.** While the plan is being adapted you watch the actual steps happen:
today's limits being worked out, the movement options being looked up, the plan being checked
against those limits. Those are real events from the real process, not a loading animation.

**Sensory load is a first-class input.** Sensory overload is a reason a session might be too
much, and Santé treats it as one. A simplified mode reduces choices, removes motion, and cuts
the interface back to one thing at a time.

**No guilt.** Nothing in the app frames a lighter day as a failure or praises pushing through.

## How the adaptation works

The safety boundary belongs to the application, not to the AI.

1. **A red-flag check runs first.** If someone reports chest pain, fainting, severe or unusual
   pain, or a possible pregnancy complication, Santé does not generate a session at all. It
   pauses, says so, and no AI is involved in that decision or able to overrule it.
2. **Limits are calculated in ordinary code** from the check-in: a maximum intensity, a target
   duration, a maximum number of movements, and any movement types to avoid.
3. **The assistant works inside those limits.** It can look up which movements are permitted
   today and what feedback was left recently, then propose a plan. The tools it is given only
   ever return options that already satisfy the limits, so it cannot reach past them.
4. **Its answer is checked before anything is shown.** Structure, movement choices, duration
   and intensity are all verified against the limits from step 2. If anything is out of
   bounds, it is asked again once, and after that Santé builds the plan with its own rules.
5. **It works with the AI switched off.** If the model is slow, unavailable or wrong, the
   deterministic path produces the same kind of adapted plan and the app says plainly that it
   did.

Movements are only ever resolved from Santé's own catalogue, so the assistant cannot invent an
exercise or rewrite an instruction.

## Privacy

Every visitor gets their own isolated session. Check-in data is readable only by the person who
entered it, enforced at the database level rather than by application code, and the safety
verdict for a check-in can only be written by the server. Two people using Santé at the same
time cannot see anything belonging to each other.

## Not a medical product

Santé is a wellness tool. It does not diagnose, treat, prevent injury, or give medical advice,
and it is not a substitute for a health professional. Adaptations refer only to what someone
reported in their check-in that day. Any context a person chooses to share about themselves is
never treated as clinical information and never used to justify a recommendation.

## Built with

Next.js and TypeScript, Tailwind, Supabase for Postgres, authentication and row-level security,
and OpenAI's GPT-5.6 Luna for the adaptation itself. Deployed on Vercel.

## Running it locally

```bash
npm install
cp .env.example .env.local   # add your own keys
npm run dev
```

Santé runs without an OpenAI key: the deterministic path produces adapted plans on its own,
which is the same path that covers a model failure in production.
