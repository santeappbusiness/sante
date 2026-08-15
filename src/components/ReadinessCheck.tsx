"use client";

import { useState } from "react";
import type { ReadinessCheckin, RedFlag } from "@/types/domain";

/* Four sliders and one honest question. The whole thing has to be answerable in
   about twenty seconds, so there is no scrolling and no free text on the path. */

const SCALES: Array<{
  key: keyof Pick<ReadinessCheckin, "energy" | "discomfort" | "mood" | "sensory_load">;
  label: string;
  low: string;
  high: string;
}> = [
  { key: "energy", label: "Energy", low: "Running on empty", high: "Full tank" },
  { key: "discomfort", label: "Discomfort", low: "None", high: "A lot" },
  { key: "mood", label: "Mood", low: "Low", high: "Good" },
  { key: "sensory_load", label: "Sensory load", low: "Calm", high: "Overloaded" },
];

const RED_FLAGS: Array<{ value: RedFlag; label: string }> = [
  { value: "chest_pain", label: "Chest pain" },
  { value: "fainting_or_severe_dizziness", label: "Fainting or severe dizziness" },
  { value: "severe_or_unusual_pain", label: "Severe or unusual pain" },
  { value: "possible_pregnancy_complication", label: "Possible pregnancy complication" },
];

export default function ReadinessCheck({
  onSubmit,
  busy,
}: {
  onSubmit: (checkin: ReadinessCheckin) => void;
  busy: boolean;
}) {
  const [values, setValues] = useState({ energy: 3, discomfort: 3, mood: 3, sensory_load: 3 });
  const [flags, setFlags] = useState<RedFlag[]>([]);

  return (
    <form
      className="rounded-2xl bg-surface p-6 ring-1 ring-ink/10"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ ...values, red_flags: flags });
      }}
    >
      <h2 className="text-2xl">How are you today?</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Four quick answers. There is no wrong one, and nothing here is a test.
      </p>

      <div className="mt-6 grid gap-6">
        {SCALES.map((scale) => (
          <div key={scale.key}>
            <div className="flex items-baseline justify-between">
              <label htmlFor={scale.key} className="font-bold">
                {scale.label}
              </label>
              <span className="font-mono text-sm tabular-nums text-slate">
                {values[scale.key]} / 5
              </span>
            </div>
            <input
              id={scale.key}
              type="range"
              min={1}
              max={5}
              step={1}
              value={values[scale.key]}
              onChange={(e) => setValues({ ...values, [scale.key]: Number(e.target.value) })}
              className="mt-2 w-full accent-coral"
            />
            <div className="flex justify-between text-xs text-slate">
              <span>{scale.low}</span>
              <span>{scale.high}</span>
            </div>
          </div>
        ))}
      </div>

      <fieldset className="mt-7 rounded-xl bg-canvas p-4">
        <legend className="px-1 text-xs font-bold uppercase tracking-[0.12em] text-slate">
          Anything today that needs care
        </legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {RED_FLAGS.map((flag) => (
            <label key={flag.value} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-terracotta"
                checked={flags.includes(flag.value)}
                onChange={(e) =>
                  setFlags(
                    e.target.checked
                      ? [...flags, flag.value]
                      : flags.filter((f) => f !== flag.value)
                  )
                }
              />
              {flag.label}
            </label>
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={busy}
        className="mt-6 w-full rounded-xl bg-coral px-6 py-3.5 font-bold text-coral-on disabled:opacity-60"
      >
        {busy ? "Working on it" : "Adapt today's plan"}
      </button>
    </form>
  );
}
