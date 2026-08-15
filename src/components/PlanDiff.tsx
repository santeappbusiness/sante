import type { DailyPlan } from "@/types/domain";

/* The screen the whole product is built around. Two figures, an arrow, and the
   reasons underneath. Nothing else competes with it. */

function Figure({
  plan,
  label,
  adapted,
}: {
  plan: DailyPlan;
  label: string;
  adapted?: boolean;
}) {
  return (
    <div
      className={
        "rounded-2xl p-5 " + (adapted ? "bg-moss/25" : "bg-surface ring-1 ring-ink/10")
      }
    >
      <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate">{label}</p>
      <p
        className={
          "mt-2 font-display text-3xl leading-tight tabular-nums " +
          (adapted ? "text-moss-deep" : "")
        }
      >
        {plan.total_minutes} min · {plan.intensity}
        <br />
        {plan.movements.length} movement{plan.movements.length === 1 ? "" : "s"}
      </p>
      <ul className="mt-3 space-y-1 text-sm text-ink-soft">
        {plan.movements.map((m) => (
          <li key={m.id}>{m.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default function PlanDiff({
  original,
  adapted,
  reasons,
  usedFallback,
}: {
  original: DailyPlan;
  adapted: DailyPlan;
  reasons: string[];
  usedFallback: boolean;
}) {
  return (
    <div>
      <div className="grid items-stretch gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <Figure plan={original} label="Today's intended plan" />
        <div className="flex items-center justify-center text-2xl text-coral" aria-hidden="true">
          <span className="sm:hidden">↓</span>
          <span className="hidden sm:inline">→</span>
        </div>
        <Figure plan={adapted} label="Adapted for today" adapted />
      </div>

      <div className="mt-4 rounded-r-2xl border-l-[3px] border-coral bg-surface p-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral-ink">
          Why this changed
        </p>
        <ul className="mt-2 space-y-1.5 text-ink-soft">
          {reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
        {usedFallback && (
          <p className="mt-3 text-xs text-slate">
            Built with Santé&rsquo;s own rules just now, because the assistant was unavailable.
            Your plan still adapts.
          </p>
        )}
      </div>
    </div>
  );
}
