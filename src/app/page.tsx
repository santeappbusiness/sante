import Link from "next/link";

export default function Landing() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-20">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate">
        Capacity-first wellness
      </p>

      <h1 className="mt-4 text-5xl leading-[1.05] sm:text-6xl">Santé</h1>

      <p className="mt-5 max-w-md text-xl leading-relaxed text-ink-soft">
        Your body changed today. Your plan should too.
      </p>

      <p className="mt-6 max-w-lg text-ink-soft">
        A 20-second check-in, and today&rsquo;s session adapts to the capacity you actually have.
        No wearable. No guilt. You can always keep the original.
      </p>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <Link
          href="/today"
          className="rounded-xl bg-coral px-6 py-3.5 font-bold text-coral-on transition-[filter] hover:brightness-105"
        >
          Try the demo
        </Link>
        <span className="text-sm text-slate">No sign-up. Opens as Maya, a fictional user.</span>
      </div>

      <div className="mt-16 grid gap-3 sm:grid-cols-3">
        {[
          ["No wearable", "Twenty seconds and a phone, instead of a device you have to own."],
          ["Shows its work", "You see what the AI did, and why the plan changed."],
          ["Built for low days", "Sensory load is part of the check-in, not an afterthought."],
        ].map(([title, body]) => (
          <div key={title} className="rounded-xl bg-moss/20 p-4">
            <h2 className="text-base font-bold">{title}</h2>
            <p className="mt-1 text-sm text-ink-soft">{body}</p>
          </div>
        ))}
      </div>

      <p className="mt-12 text-xs leading-relaxed text-slate">
        Santé is a wellness tool, not a medical one. It does not diagnose, treat, or give medical
        advice.
      </p>
    </main>
  );
}
