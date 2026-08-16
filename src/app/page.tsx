import Link from "next/link";
import { Asterisk, Blob, Flower, Sprig, Waves } from "@/components/BrandShapes";
import {
  PeekAdaptation,
  PeekBloom,
  PeekCheckIn,
  PeekSession,
  PeekWeek,
} from "@/components/AppPeek";

/**
 * The landing page.
 *
 * Its job is to answer three things before anyone taps anything: what this is,
 * who it is for, and what it actually looks like inside. The last one is the
 * part most product pages skip, so the app views here are drawn from the same
 * tokens as the product rather than screenshotted, and cannot go stale.
 */
export default function Landing() {
  return (
    <main className="overflow-hidden">
      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-6 pb-16 pt-12 sm:pt-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-28 -top-28 text-moss/25"
        >
          <Blob size={440} />
        </div>

        <div className="relative grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <img src="/brand/sante-mark.png" alt="Santé" className="-ml-5 w-48 sm:w-56" />

            <h1 className="mt-7 max-w-2xl font-display text-5xl leading-[1.02] sm:text-6xl lg:text-7xl">
              Keep the goal.
              <br />
              Change the route.
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft sm:text-xl">
              A movement app that adapts today&rsquo;s session to the capacity you actually
              have. Energy, discomfort, mood, sensory load, and the preferences that make
              movement work for you.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/home"
                className="rounded-2xl bg-coral px-7 py-4 text-lg font-bold text-coral-on transition-[filter] hover:brightness-105"
              >
                Try the demo
              </Link>
              <Link
                href="/signin"
                className="rounded-2xl px-6 py-4 font-bold text-ink underline decoration-coral decoration-2 underline-offset-4"
              >
                Create an account
              </Link>
            </div>
            <p className="mt-3 text-sm text-slate">
              The demo needs no account. It opens as Maya, with a week and a history already
              in it.
            </p>
          </div>

          {/* Two real views, so the product is visible above the fold. */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative flex items-start gap-4">
              <div className="mt-12 hidden sm:block">
                <PeekCheckIn />
              </div>
              <PeekBloom />
            </div>
          </div>
        </div>
      </section>

      {/* The problem, stated plainly. */}
      <section className="bg-ink px-6 py-20 text-canvas">
        <div className="mx-auto max-w-5xl">
          <div aria-hidden="true" className="mb-6 text-moss">
            <Sprig size={44} />
          </div>
          <p className="max-w-3xl font-display text-3xl leading-snug sm:text-4xl lg:text-5xl">
            Most apps assume every day is the same, then treat missing one as failing.
          </p>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              [
                "Capacity is not constant",
                "Energy, pain, mood and sensory load change day to day, and for a lot of people they change a great deal.",
              ],
              [
                "Adapting usually costs money",
                "The apps that respond to daily readiness mostly need a wearable, which prices out the people whose days vary most.",
              ],
              [
                "So the plan gets abandoned",
                "Not because the goal was wrong, but because the route never bent around a real week.",
              ],
            ].map(([title, body]) => (
              <div key={title}>
                <h2 className="font-display text-xl leading-tight">{title}</h2>
                <p className="mt-2 text-canvas/70">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The core moment. */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate">
              One check-in, twenty seconds
            </p>
            <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
              Your plan flexed.
            </h2>
            <p className="mt-4 max-w-md text-lg text-ink-soft">
              Four questions become the shape of your day. Santé works out what today can
              hold, rebuilds the session inside those limits, and tells you exactly what
              changed and why.
            </p>

            <ul className="mt-8 grid gap-3">
              {[
                ["What you planned", "35 min · moderate · 5 movements"],
                ["What today needed", "12 min · low · 3 movements"],
              ].map(([label, figure], i) => (
                <li
                  key={label}
                  className={
                    "rounded-2xl px-5 py-4 " +
                    (i === 1 ? "bg-moss/25" : "bg-surface ring-1 ring-ink/10")
                  }
                >
                  <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate">
                    {label}
                  </p>
                  <p
                    className={
                      "mt-1 font-display text-2xl leading-tight tabular-nums " +
                      (i === 1 ? "text-moss-deep" : "")
                    }
                  >
                    {figure}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-center lg:justify-end">
            <PeekAdaptation />
          </div>
        </div>
      </section>

      {/* What is in it. */}
      <section className="bg-lavender/25 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-4xl leading-tight sm:text-5xl">
            What is actually in it
          </h2>
          <p className="mt-3 max-w-lg text-lg text-ink-soft">
            Not one clever screen. A product you can live in.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Sessions, not exercise lists",
                body: "Twenty-four workouts across twenty collections, grouped by how a day feels: five minutes, low energy, sensory friendly, nothing on the floor.",
                tint: "bg-surface ring-1 ring-ink/10",
              },
              {
                title: "A week that bends",
                body: "Plan seven days, move a session, mark a rest day. When today comes out lighter, Santé offers to move the heavier session rather than drop it.",
                tint: "bg-moss/25",
              },
              {
                title: "A mid-session way out",
                body: "Any movement can be swapped for something gentler without restarting. Santé recalculates the time left and says what it changed.",
                tint: "bg-surface ring-1 ring-ink/10",
              },
              {
                title: "Say it in your own words",
                body: "“I only have 8 minutes and I need this quiet.” Santé turns that into limits and rebuilds the session around them.",
                tint: "bg-coral/15",
              },
              {
                title: "Memory you can see",
                body: "When a pattern shows up, Santé says what it noticed and asks before remembering it. Everything it knows is listed, sourced, and editable.",
                tint: "bg-surface ring-1 ring-ink/10",
              },
              {
                title: "Calm mode",
                body: "Larger text, no motion, fewer choices, shorter instructions, quieter surfaces. It also caps how many movements a session can hold and puts the quiet ones first, in our own code, so it holds even when the AI is switched off.",
                tint: "bg-lavender/50",
              },
            ].map((f) => (
              <div key={f.title} className={"rounded-[24px] p-6 " + f.tint}>
                <h3 className="font-display text-xl leading-tight">{f.title}</h3>
                <p className="mt-2 text-ink-soft">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* More of the inside. */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-display text-4xl leading-tight sm:text-5xl">A look inside</h2>

        <div className="mt-10 grid items-start gap-12 lg:grid-cols-2">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            <PeekSession />
            <div className="max-w-xs">
              <h3 className="font-display text-2xl leading-tight">The session</h3>
              <p className="mt-2 text-ink-soft">
                One movement at a time. A timer you have to start, because a countdown running
                at you turns a gentle session into a test. A question mark on every movement
                for when you are not sure how it goes.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            <PeekWeek />
            <div className="max-w-xs">
              <h3 className="font-display text-2xl leading-tight">The week</h3>
              <p className="mt-2 text-ink-soft">
                Rest days are typed the same as sessions and shown with the same weight.
                Progress counts them, because a streak that breaks when you rest is measuring
                compliance, not wellbeing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who it is for. */}
      <section className="relative overflow-hidden bg-moss/20 px-6 py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-8 -right-10 text-moss/40"
        >
          <Waves size={300} />
        </div>
        <div className="relative mx-auto max-w-5xl">
          <h2 className="font-display text-4xl leading-tight sm:text-5xl">Built for</h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            {[
              [
                "Days that vary",
                "Anyone whose energy, pain or focus is different on Tuesday than it was on Monday.",
              ],
              [
                "Different brains",
                "Sensory load is one of the four questions, not an afterthought, and calm mode reshapes both the app and the session.",
              ],
              [
                "No equipment, no wearable",
                "Twenty seconds and a phone. Nothing to buy, charge, or wear to bed.",
              ],
            ].map(([title, body]) => (
              <div key={title}>
                <span aria-hidden="true" className="text-moss-deep">
                  <Flower size={30} id={title} />
                </span>
                <h3 className="mt-3 font-display text-xl leading-tight">{title}</h3>
                <p className="mt-1.5 text-ink-soft">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How the AI is kept honest. */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <span aria-hidden="true" className="text-coral">
          <Asterisk size={34} />
        </span>
        <h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
          The AI works inside limits it cannot widen
        </h2>
        <p className="mt-4 max-w-2xl text-lg text-ink-soft">
          Santé decides what today can hold before the assistant is reached at all.
        </p>

        <ol className="mt-8 grid gap-3">
          {[
            "A safety check runs first, in ordinary code. Chest pain, fainting, severe pain, a possible pregnancy complication: no session is generated, and no AI is involved in that decision.",
            "Limits are calculated from your check-in: highest intensity, target minutes, how many movements, what to leave out.",
            "The assistant may only choose from movements that already satisfy those limits.",
            "Its answer is checked against them again before you see it. Out of bounds means it is asked once more, and after that Santé builds the session with its own rules.",
            "If the assistant is unavailable, the session is still built, and the app tells you so.",
          ].map((line, i) => (
            <li key={i} className="flex gap-4 rounded-2xl bg-surface p-5 ring-1 ring-ink/10">
              <span className="font-mono text-sm text-coral">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-ink-soft">{line}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Close. */}
      <section className="relative overflow-hidden bg-ink px-6 py-24 text-canvas">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-16 -top-16 text-moss/20"
        >
          <Blob size={340} />
        </div>
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="font-display text-4xl leading-snug sm:text-5xl">
            The plan changes. The intention does not.
          </p>
          <Link
            href="/home"
            className="mt-9 inline-block rounded-2xl bg-coral px-8 py-4 text-lg font-bold text-coral-on"
          >
            Try the demo
          </Link>
          <p className="mt-3 text-sm text-canvas/60">
            Opens straight into Maya&rsquo;s week. No account, no setup.
          </p>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <img src="/brand/sante-mark.png" alt="Santé" className="-ml-3 w-32" />
            <p className="mt-2 max-w-md text-xs leading-relaxed text-slate">
              Santé is a wellness tool, not a medical one. It does not diagnose, treat, prevent
              injury, or give medical advice, and it is not a substitute for a health
              professional. Maya is a fictional demo user.
            </p>
          </div>
          <Link href="/signin" className="text-sm text-ink underline underline-offset-4">
            Create an account
          </Link>
        </div>
      </footer>
    </main>
  );
}
