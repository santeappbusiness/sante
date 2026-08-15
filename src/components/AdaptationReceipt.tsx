/**
 * The adaptation receipt.
 *
 * What was known, what was consulted, what changed. Every line is a fact about
 * the run rather than a claim about intelligence, and none of it is the model's
 * private reasoning, which we never surface.
 */
export type Receipt = {
  inputs: string[];
  tools: string[];
  outcome: {
    minutes: [number, number];
    movements: [number, number];
    intensity: [string, string];
    source: string;
  };
};

export default function AdaptationReceipt({ receipt }: { receipt: Receipt }) {
  const { outcome } = receipt;

  return (
    <details className="mt-4 rounded-2xl bg-surface ring-1 ring-ink/10">
      <summary className="cursor-pointer px-5 py-4 text-sm font-bold">
        How Santé did that
      </summary>

      <div className="grid gap-5 px-5 pb-5 sm:grid-cols-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate">Inputs used</p>
          <ul className="mt-2 space-y-1 text-sm text-ink-soft">
            {receipt.inputs.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate">Tools used</p>
          <ul className="mt-2 space-y-1 text-sm text-ink-soft">
            {receipt.tools.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate">Result</p>
          <ul className="mt-2 space-y-1 font-mono text-sm tabular-nums">
            <li>
              {outcome.minutes[0]} → {outcome.minutes[1]} min
            </li>
            <li>
              {outcome.movements[0]} → {outcome.movements[1]} movements
            </li>
            <li>
              {outcome.intensity[0]} → {outcome.intensity[1]}
            </li>
          </ul>
          <p className="mt-2 text-xs text-slate">Built by {outcome.source}</p>
        </div>
      </div>
    </details>
  );
}
