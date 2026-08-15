import type { DailyPlan } from "@/types/domain";
import { Asterisk, Flower } from "./BrandShapes";

/**
 * The screen the whole product is built around.
 *
 * Two figures and the reasons underneath. The adapted side arrives a beat later
 * so the change reads as something that happened, and the movements that
 * survived are marked, because "what stayed" matters as much as what went.
 */

function Figure({
  plan,
  label,
  adapted,
  keptIds,
}: {
  plan: DailyPlan;
  label: string;
  adapted?: boolean;
  keptIds?: Set<string>;
}) {
  return (
    <div
      className={
        "relative overflow-hidden rounded-[24px] p-6 " +
        (adapted ? "bg-moss/25 morph-in morph-delay-2" : "bg-surface ring-1 ring-ink/10")
      }
    >
      {adapted && (
        <div aria-hidden="true" className="absolute -right-5 -top-5 text-moss/40">
          <Flower size={80} />
        </div>
      )}

      <p className="relative text-xs font-bold uppercase tracking-[0.13em] text-slate">{label}</p>

      <p
        className={
          "relative mt-2 font-display text-4xl leading-[1.05] tabular-nums " +
          (adapted ? "text-moss-deep" : "")
        }
      >
        {plan.total_minutes} min
        <br />
        <span className="text-3xl">{plan.intensity}</span>
        <br />
        <span className="text-3xl">
          {plan.movements.length} movement{plan.movements.length === 1 ? "" : "s"}
        </span>
      </p>

      <ul className="relative mt-4 space-y-1.5 text-sm">
        {plan.movements.map((m) => {
          const kept = keptIds?.has(m.id);
          return (
            <li key={m.id} className={kept ? "text-ink" : "text-ink-soft"}>
              {kept && (
                <span className="mr-1 text-moss-deep" aria-label="kept from your plan">
                  ·
                </span>
              )}
              {m.name}
            </li>
          );
        })}
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
  const originalIds = new Set(original.movements.map((m) => m.id));
  const kept = new Set(adapted.movements.filter((m) => originalIds.has(m.id)).map((m) => m.id));

  return (
    <div>
      <div className="grid items-stretch gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <Figure plan={original} label="What you planned" />

        <div
          className="flex items-center justify-center text-coral morph-in morph-delay-1"
          aria-hidden="true"
        >
          <Asterisk size={38} />
        </div>

        <Figure plan={adapted} label="What today needed" adapted keptIds={kept} />
      </div>

      <div className="morph-in morph-delay-3 mt-5 rounded-[24px] border-l-[3px] border-coral bg-surface p-5">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-coral-ink">
          Why this changed
        </p>
        <ul className="mt-2.5 space-y-2 text-ink-soft">
          {reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>

        {kept.size > 0 && (
          <p className="mt-3 border-t border-ink/10 pt-3 text-sm text-slate">
            {kept.size} movement{kept.size === 1 ? "" : "s"} from your original plan stayed.
          </p>
        )}

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
