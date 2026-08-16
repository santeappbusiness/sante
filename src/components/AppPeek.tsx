import { Asterisk, Flower } from "./BrandShapes";

/**
 * Views of the product, drawn rather than screenshotted.
 *
 * A landing page needs to show the inside, and real screenshots go stale the
 * moment anything moves. These are built from the same tokens and type as the
 * app, so they cannot drift out of date the way a PNG would, and they stay
 * crisp at any size.
 */

function Phone({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        "w-full max-w-[260px] overflow-hidden rounded-[30px] bg-canvas p-4 ring-1 ring-ink/10 shadow-[0_24px_60px_-30px_rgba(47,58,51,0.45)] " +
        className
      }
      aria-hidden="true"
    >
      {children}
    </div>
  );
}

/** The check-in, mid-question. */
export function PeekCheckIn() {
  return (
    <Phone>
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={"h-1 flex-1 rounded-full " + (i <= 1 ? "bg-moss-deep" : "bg-ink/10")}
          />
        ))}
      </div>
      <p className="mt-4 text-[9px] font-bold uppercase tracking-[0.13em] text-slate">
        How are you arriving today?
      </p>
      <p className="mt-1.5 font-display text-lg leading-tight">
        How does your body feel?
      </p>
      <div className="mt-4 grid grid-cols-5 gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className={
              "flex h-11 items-center justify-center rounded-xl font-display text-base " +
              (n === 4 ? "bg-moss/40" : "bg-surface ring-1 ring-ink/10")
            }
          >
            {n}
          </span>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[8px] text-slate">
        <span>Comfortable</span>
        <span>A lot going on</span>
      </div>
    </Phone>
  );
}

/** The Bloom, as the answer. */
export function PeekBloom() {
  const petal = "M 50 50 C 30 34, 30 12, 50 4 C 70 12, 70 34, 50 50 Z";
  return (
    <Phone className="bg-lavender/30">
      <p className="text-center text-[9px] font-bold uppercase tracking-[0.13em] text-slate">
        Today&rsquo;s capacity
      </p>
      <svg viewBox="0 0 100 100" className="mx-auto mt-2 h-28 w-28">
        {[0, 90, 180, 270].map((a, i) => (
          <path
            key={a}
            d={petal}
            transform={`rotate(${a} 50 50)`}
            fill="#CEC3D6"
            opacity={[0.85, 0.55, 0.8, 0.5][i]}
          />
        ))}
        <circle cx="50" cy="50" r="7" fill="#5F7D52" />
      </svg>
      <p className="mt-1 text-center font-display text-2xl">Low</p>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[9px]">
        {[
          ["Energy", 2],
          ["Comfort", 2],
          ["Mood", 3],
          ["Calm", 2],
        ].map(([label, v]) => (
          <div key={label as string} className="flex items-center justify-between gap-2">
            <dt className="text-ink-soft">{label}</dt>
            <dd className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  className={
                    "h-1 w-1 rounded-full " + (n <= (v as number) ? "bg-moss-deep" : "bg-ink/15")
                  }
                />
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </Phone>
  );
}

/** The moment the plan changes. */
export function PeekAdaptation() {
  return (
    <Phone>
      <p className="font-display text-lg leading-tight">Your plan flexed.</p>
      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
        <div className="rounded-xl bg-surface p-2.5 ring-1 ring-ink/10">
          <p className="text-[7px] font-bold uppercase tracking-wider text-slate">Planned</p>
          <p className="mt-0.5 font-display text-base leading-tight">
            30 min
            <br />
            <span className="text-[11px]">moderate</span>
          </p>
        </div>
        <span className="text-coral">
          <Asterisk size={16} />
        </span>
        <div className="rounded-xl bg-moss/25 p-2.5">
          <p className="text-[7px] font-bold uppercase tracking-wider text-slate">Today</p>
          <p className="mt-0.5 font-display text-base leading-tight text-moss-deep">
            12 min
            <br />
            <span className="text-[11px]">low</span>
          </p>
        </div>
      </div>
      <div className="mt-2.5 rounded-xl border-l-2 border-coral bg-surface p-2.5">
        <p className="text-[7px] font-bold uppercase tracking-wider text-coral-ink">
          Why this changed
        </p>
        <p className="mt-1 text-[9px] leading-relaxed text-ink-soft">
          You reported low energy and high discomfort, so the session is shorter and low
          intensity.
        </p>
      </div>
      <div className="mt-2 rounded-xl bg-coral px-3 py-2 text-center text-[10px] font-bold text-coral-on">
        Start adapted plan
      </div>
    </Phone>
  );
}

/** A session in progress. */
export function PeekSession() {
  return (
    <Phone>
      <div className="flex items-baseline justify-between">
        <p className="text-[8px] font-bold uppercase tracking-[0.13em] text-slate">
          Movement 2 of 3
        </p>
        <p className="font-mono text-[8px] text-slate">7 min left</p>
      </div>
      <div className="mt-1.5 flex gap-1">
        <span className="h-1 flex-1 rounded-full bg-moss-deep" />
        <span className="h-1 flex-1 rounded-full bg-coral" />
        <span className="h-1 flex-1 rounded-full bg-ink/10" />
      </div>
      <div className="mt-3 rounded-2xl bg-surface p-3 ring-1 ring-ink/10">
        <div className="flex items-start justify-between">
          <p className="font-display text-lg leading-tight">Seated hip opener</p>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-canvas text-[9px] font-bold text-slate ring-1 ring-ink/15">
            ?
          </span>
        </div>
        <p className="mt-0.5 font-mono text-[8px] text-slate">5 min · low</p>
        <p className="mt-1.5 text-[9px] leading-relaxed text-ink-soft">
          Cross one ankle over the opposite knee and lean forward gently.
        </p>
        <div className="mt-2 rounded-xl bg-canvas px-2.5 py-2">
          <p className="text-[7px] font-bold uppercase tracking-wider text-slate">Timer</p>
          <p className="font-display text-base">4:53</p>
        </div>
        <div className="mt-2 rounded-xl bg-coral px-3 py-2 text-center text-[10px] font-bold text-coral-on">
          Done · next movement
        </div>
        <p className="mt-1.5 text-center text-[8px] text-ink-soft underline">
          This isn&rsquo;t working today
        </p>
      </div>
    </Phone>
  );
}

/** The week, as rhythm. */
export function PeekWeek() {
  const days = [
    ["M", 32, "session"],
    ["T", 15, "recovery"],
    ["W", 28, "session"],
    ["T", 0, "rest"],
    ["F", 30, "session"],
    ["S", 20, "recovery"],
    ["S", 0, "rest"],
  ] as const;

  return (
    <Phone className="bg-moss/20">
      <div className="flex items-center justify-between">
        <p className="font-display text-lg">Your week</p>
        <span className="text-moss-deep">
          <Flower size={18} id="peek" />
        </span>
      </div>
      <p className="mt-0.5 text-[9px] text-ink-soft">Rest days are days, not gaps.</p>
      <div className="mt-4 flex items-end gap-1.5" style={{ height: 68 }}>
        {days.map(([label, mins, kind], i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={
                "w-full rounded-full " +
                (kind === "rest" ? "bg-ink/15" : kind === "recovery" ? "bg-lavender" : "bg-moss-deep")
              }
              style={{ height: mins === 0 ? 5 : Math.max(12, mins * 1.5) }}
            />
            <span className="text-[8px] text-slate">{label}</span>
          </div>
        ))}
      </div>
    </Phone>
  );
}
