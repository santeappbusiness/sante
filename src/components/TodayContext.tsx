"use client";

import { useState } from "react";

/**
 * Optional context for today.
 *
 * The principle both briefs insist on, and the one that matters most here:
 * what someone reports today decides the session, never a label or a predicted
 * phase. There is no cycle prediction in Santé, no phase maths, and no rule
 * anywhere that says a period means a gentle day.
 *
 * Someone on day one who reports high energy and no discomfort gets their
 * normal plan, because that is what they told us.
 *
 * These selections become ordinary movement constraints, exactly like the
 * check-in sliders. Nothing here is stored as a diagnosis or read as one.
 */

const SYMPTOMS: Array<{ id: string; label: string; tags: string[] }> = [
  { id: "cramps", label: "Cramps", tags: ["jumping"] },
  { id: "fatigue", label: "Fatigue", tags: [] },
  { id: "headache", label: "Headache", tags: ["jumping"] },
  { id: "bloating", label: "Bloating", tags: ["floor_work"] },
  { id: "brain_fog", label: "Brain fog", tags: [] },
  { id: "poor_sleep", label: "Slept badly", tags: [] },
];

export type TodayContextValue = {
  period_today: boolean;
  symptoms: string[];
};

export function contextTags(value: TodayContextValue): string[] {
  const tags = new Set<string>();
  for (const s of value.symptoms) {
    const found = SYMPTOMS.find((x) => x.id === s);
    found?.tags.forEach((t) => tags.add(t));
  }
  return [...tags];
}

export default function TodayContext({
  value,
  onChange,
}: {
  value: TodayContextValue;
  onChange: (v: TodayContextValue) => void;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl bg-surface px-5 py-4 text-left ring-1 ring-ink/10"
      >
        <span className="font-bold">Anything else going on today?</span>
        <span className="mt-0.5 block text-sm text-ink-soft">
          Optional. Symptoms, your period, a rough night.
        </span>
      </button>
    );
  }

  return (
    <div className="rounded-2xl bg-surface p-5 ring-1 ring-ink/10">
      <p className="font-bold">Anything else going on today?</p>
      <p className="mt-1 text-sm text-ink-soft">
        Only what you want to share. Santé uses it the same way it uses the sliders, and never
        as a medical conclusion.
      </p>

      <button
        aria-pressed={value.period_today}
        onClick={() => onChange({ ...value, period_today: !value.period_today })}
        className={
          "mt-4 w-full rounded-xl px-4 py-3 text-left ring-1 " +
          (value.period_today ? "bg-lavender/45 ring-transparent" : "bg-canvas ring-ink/10")
        }
      >
        {value.period_today && <span aria-hidden="true">✓ </span>}
        My period started or is happening
      </button>

      <p className="mt-4 text-xs font-bold uppercase tracking-[0.13em] text-slate">
        Symptoms today
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {SYMPTOMS.map((s) => {
          const on = value.symptoms.includes(s.id);
          return (
            <button
              key={s.id}
              aria-pressed={on}
              onClick={() =>
                onChange({
                  ...value,
                  symptoms: on
                    ? value.symptoms.filter((x) => x !== s.id)
                    : [...value.symptoms, s.id],
                })
              }
              className={
                "rounded-full px-4 py-2 text-sm ring-1 " +
                (on ? "bg-moss/30 font-bold ring-transparent" : "bg-canvas ring-ink/15")
              }
            >
              {on && <span aria-hidden="true">✓ </span>}
              {s.label}
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-slate">
        Santé does not predict cycles or suggest what any of this means. If you feel good today,
        your usual plan is still there.
      </p>
    </div>
  );
}
