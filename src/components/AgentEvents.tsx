import type { AgentEvent } from "@/types/domain";

/**
 * What the agent is doing, as it does it.
 *
 * Every line here comes from the real tool loop on the server. We never show
 * the model's internal reasoning, only the steps it actually took, and the
 * list is the honest answer to "is that animation really your agent?".
 */
export default function AgentEvents({
  events,
  done,
}: {
  events: AgentEvent[];
  done: boolean;
}) {
  return (
    <ol className="space-y-2.5" aria-live="polite">
      {events.map((e, i) => {
        const isProblem = e.step === "error";
        const isSoft = e.step === "retrying" || e.step === "fallback";
        return (
          <li key={i} className="flex gap-3 text-sm">
            <span
              aria-hidden="true"
              className={
                isProblem ? "text-terracotta" : isSoft ? "text-slate" : "text-moss-deep"
              }
            >
              {isProblem ? "!" : isSoft ? "·" : "✓"}
            </span>
            <span className={isProblem ? "text-terracotta" : ""}>
              {e.label}
              {e.detail && <span className="text-slate"> · {e.detail}</span>}
            </span>
          </li>
        );
      })}

      {!done && (
        <li className="flex gap-3 text-sm text-slate">
          <span aria-hidden="true">·</span>
          <span>
            working
            <span className="nd-hide inline-block animate-pulse">…</span>
          </span>
        </li>
      )}
    </ol>
  );
}
