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
  quiet = false,
}: {
  onApply: (chips: string[], request?: string) => void;
  busy: boolean;
  quiet?: boolean;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const [text, setText] = useState("");

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

      {/* Or say it. The sentence becomes constraints our code applies, and
          those can only ever make today gentler. Hidden in simplified mode,
          where a blank box is one decision too many. */}
      {!quiet && (
        <div className="mt-4">
          <label htmlFor="fit-text" className="text-xs text-slate">
            Or tell Santé what today looks like
          </label>
          <textarea
            id="fit-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            placeholder="I only have 8 minutes and I need this quiet"
            className="mt-1 w-full rounded-xl bg-surface px-4 py-3 text-sm ring-1 ring-ink/15 placeholder:text-slate/70"
          />
        </div>
      )}

      {(picked.length > 0 || text.trim()) && (
        <button
          type="button"
          disabled={busy}
          onClick={() => onApply(picked, text.trim() || undefined)}
          className="mt-3 w-full rounded-xl bg-surface px-5 py-3 font-bold ring-1 ring-ink/20 disabled:opacity-60"
        >
          {busy ? "Adjusting" : "Adjust today's plan"}
        </button>
      )}
    </div>
  );
}
