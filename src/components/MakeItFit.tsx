"use client";

import { useState } from "react";

/**
 * Make it fit.
 *
 * Four things people actually say, as taps rather than a chat box. Each one is
 * a constraint edit applied by our own code before the model runs, so a chip
 * can only ever make today gentler, never push past a limit.
 *
 * A text box would look cleverer and work less reliably in front of a judge.
 */

const CHIPS: Array<{ id: string; label: string }> = [
  { id: "shorter", label: "5 minutes shorter" },
  { id: "quieter", label: "Quieter" },
  { id: "no_floor", label: "No floor work" },
  { id: "fewer", label: "Fewer movements" },
];

export default function MakeItFit({
  onApply,
  busy,
}: {
  onApply: (chips: string[]) => void;
  busy: boolean;
}) {
  const [picked, setPicked] = useState<string[]>([]);

  return (
    <div className="mt-5 rounded-2xl bg-canvas p-4 ring-1 ring-ink/10">
      <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate">
        Make it fit
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {CHIPS.map((chip) => {
          const on = picked.includes(chip.id);
          return (
            <button
              key={chip.id}
              type="button"
              aria-pressed={on}
              onClick={() =>
                setPicked(on ? picked.filter((c) => c !== chip.id) : [...picked, chip.id])
              }
              className={
                "rounded-full px-4 py-2 text-sm ring-1 " +
                (on ? "bg-moss/30 font-bold ring-transparent" : "bg-surface ring-ink/15")
              }
            >
              {on && <span aria-hidden="true">✓ </span>}
              {chip.label}
            </button>
          );
        })}
      </div>

      {picked.length > 0 && (
        <button
          type="button"
          disabled={busy}
          onClick={() => onApply(picked)}
          className="mt-4 w-full rounded-xl bg-surface px-5 py-3 font-bold ring-1 ring-ink/20 disabled:opacity-60"
        >
          {busy ? "Adjusting" : "Adjust today's plan"}
        </button>
      )}
    </div>
  );
}
