import Link from "next/link";
import { Asterisk, Blob, Flower, Sprig, Waves } from "@/components/BrandShapes";

/**
 * The landing page.
 *
 * The job is one sentence and one proof: your plan can flex, and here is what
 * that looks like. Everything else on the page is in service of that, and the
 * ambient shapes exist so it reads as a product rather than a document.
 */
export default function Landing() {
  return (
    <main className="overflow-hidden">
      {/* Hero */}
      <section className="relative mx-auto max-w-5xl px-6 pb-16 pt-14 sm:pt-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 text-moss/25 sm:-right-10"
        >
          <Blob size={420} />
        </div>
        {/* Kept clear of the headline: an ambient shape behind text reads as a
            smudge rather than as brand. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-32 bottom-0 hidden text-lavender/40 sm:block"
        >
          <Blob size={240} />
        </div>

        <div className="relative">
          <img src="/brand/sante-logo.png" alt="Santé" className="-ml-5 w-48 sm:w-56" />

          <h1 className="mt-7 max-w-3xl font-display text-5xl leading-[1.02] sm:text-7xl">
            Your plan can flex.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft sm:text-xl">
            A movement app that adapts today&rsquo;s session to the capacity you actually have.
            Energy, discomfort, mood, sensory load, and the preferences that make movement work
            for you.
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
              Sign in
            </Link>
          </div>
          <p className="mt-3 text-sm text-slate">
            The demo needs no account. It opens as Maya, with a week already in it.
          </p>
        </div>
      </section>

      {/* The proof. This is the product in one glance. */}
      <section className="relative mx-auto max-w-5xl px-6 pb-20">
        <div className="rounded-[28px] bg-surface p-7 shadow-[0_1px_2px_rgba(47,58,51,0.04),0_24px_60px_-30px_rgba(47,58,51,0.25)] sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate">
            One check-in, twenty seconds
          </p>

          <div className="mt-6 grid items-center gap-5 sm:grid-cols-[1fr_auto_1fr]">
            <div className="rounded-2xl bg-canvas p-6">
              <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate">
                What you planned
              </p>
              <p className="mt-2 font-display text-3xl leading-tight tabular-nums sm:text-4xl">
                35 min
                <br />
                moderate
                <br />5 movements
              </p>
            </div>

            <div className="flex items-center justify-center text-coral" aria-hidden="true">
              <Asterisk size={44} />
            </div>

            <div className="rounded-2xl bg-moss/25 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate">
                What today needed
              </p>
              <p className="mt-2 font-display text-3xl leading-tight tabular-nums text-moss-deep sm:text-4xl">
                12 min
                <br />
                low
                <br />3 movements
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border-l-[3px] border-coral bg-canvas px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral-ink">
              Why this changed
            </p>
            <p className="mt-1.5 text-ink-soft">
              You reported low energy and high discomfort, so the session is shorter and low
              intensity. You reported high sensory load, so you have mostly seated, quiet
              options.
            </p>
          </div>
        </div>
      </section>

      {/* What makes it different. Three different card shapes on purpose. */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="relative overflow-hidden rounded-[24px] bg-moss/20 p-7">
            <div aria-hidden="true" className="absolute -right-6 -top-6 text-moss/40">
              <Flower size={90} />
            </div>
            <h2 className="relative font-display text-2xl leading-tight">No wearable</h2>
            <p className="relative mt-2 text-ink-soft">
              Twenty seconds and a phone. Nothing to buy, charge, or wear to bed.
            </p>
          </div>

          <div className="rounded-[24px] bg-surface p-7 ring-1 ring-ink/10">
            <div aria-hidden="true" className="text-coral">
              <Asterisk size={30} />
            </div>
            <h2 className="mt-4 font-display text-2xl leading-tight">It shows its work</h2>
            <p className="mt-2 text-ink-soft">
              You watch the real steps happen, and every change explains itself in plain words.
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[24px] bg-lavender/40 p-7">
            <div aria-hidden="true" className="absolute -bottom-3 -right-3 text-slate/30">
              <Waves size={150} />
            </div>
            <h2 className="relative font-display text-2xl leading-tight">Built for low days</h2>
            <p className="relative mt-2 text-ink-soft">
              Sensory load is part of the check-in, not an afterthought. Rest counts as showing
              up.
            </p>
          </div>
        </div>
      </section>

      {/* Editorial band. Full bleed, different rhythm to everything above. */}
      <section className="bg-ink px-6 py-20 text-canvas">
        <div className="mx-auto max-w-3xl text-center">
          <div aria-hidden="true" className="mx-auto mb-6 w-fit text-moss">
            <Sprig size={44} />
          </div>
          <p className="font-display text-3xl leading-snug sm:text-4xl">
            Most apps assume every day is the same, then treat missing one as failing.
          </p>
          <p className="mx-auto mt-5 max-w-xl text-canvas/70">
            Santé is built around fluctuation instead. The plan changes. The intention does not.
          </p>
        </div>
      </section>

      <footer className="mx-auto max-w-5xl px-6 py-14">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <img src="/brand/sante-logo.png" alt="Santé" className="-ml-3 w-32" />
            <p className="mt-2 max-w-md text-xs leading-relaxed text-slate">
              Santé is a wellness tool, not a medical one. It does not diagnose, treat, prevent
              injury, or give medical advice, and it is not a substitute for a health
              professional.
            </p>
          </div>
          <Link
            href="/home"
            className="rounded-2xl bg-coral px-6 py-3.5 font-bold text-coral-on"
          >
            Try the demo
          </Link>
        </div>
      </footer>
    </main>
  );
}
