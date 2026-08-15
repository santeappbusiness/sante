"use client";

import { useState } from "react";
import type { ReadinessCheckin, RedFlag } from "@/types/domain";
import CapacityBloom, { toBloom } from "./CapacityBloom";
import { Blob } from "./BrandShapes";

/**
 * The check-in, as a short ritual rather than a form.
 *
 * One question at a time, thumb-sized answers, no scrolling, and a Bloom at the
 * end so the last thing someone sees is a picture of their own day rather than
 * a submit button. Still about twenty seconds start to finish.
 */

type ScaleKey = "energy" | "discomfort" | "mood" | "sensory_load";

const STEPS: Array<{
  key: ScaleKey;
  question: string;
  helper: string;
  low: string;
  high: string;
}> = [
  {
    key: "energy",
    question: "How much energy do you have today?",
    helper: "Whatever you have is the right answer.",
    low: "Running on empty",
    high: "Full tank",
  },
  {
    key: "discomfort",
    question: "How comfortable does your body feel?",
    helper: "Pain, tightness, cramps, anything that is asking for attention.",
    low: "Comfortable",
    high: "A lot going on",
  },
  {
    key: "mood",
    question: "Where is your mood today?",
    helper: "Not a judgement, just a starting point.",
    low: "Low",
    high: "Good",
  },
  {
    key: "sensory_load",
    question: "How much sensory load are you carrying?",
    helper: "Noise, light, people, screens, everything competing for attention.",
    low: "Calm",
    high: "Overloaded",
  },
];

const RED_FLAGS: Array<{ value: RedFlag; label: string }> = [
  { value: "chest_pain", label: "Chest pain" },
  { value: "fainting_or_severe_dizziness", label: "Fainting or severe dizziness" },
  { value: "severe_or_unusual_pain", label: "Severe or unusual pain" },
  { value: "possible_pregnancy_complication", label: "Possible pregnancy complication" },
];

export default function ReadinessRitual({
  onSubmit,
  busy,
  quiet = false,
}: {
  onSubmit: (checkin: ReadinessCheckin) => void;
  busy: boolean;
  quiet?: boolean;
}) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState({ energy: 3, discomfort: 3, mood: 3, sensory_load: 3 });
  const [flags, setFlags] = useState<RedFlag[]>([]);

  const total = STEPS.length + 2; // scales, then the safety question, then the bloom
  const current = STEPS[step];

  function answer(value: number) {
    setValues((v) => ({ ...v, [current.key]: value }));
    /* Answering advances. One tap per question, no separate Next button. */
    setTimeout(() => setStep((s) => s + 1), quiet ? 0 : 160);
  }

  return (
    <section className="relative overflow-hidden rounded-[28px] bg-surface p-7 shadow-[0_1px_2px_rgba(47,58,51,0.04),0_20px_50px_-32px_rgba(47,58,51,0.35)] sm:p-10">
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 text-lavender/40">
        <Blob size={280} />
      </div>
      {/* Progress: dots, not a percentage. */}
      <div className="relative mb-7 flex items-center gap-1.5" aria-hidden="true">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={
              "h-2 flex-1 rounded-full " + (i <= step ? "bg-moss-deep" : "bg-ink/10")
            }
          />
        ))}
      </div>

      {step < STEPS.length && (
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate">
            Step {step + 1} of {total}
          </p>
          <h2 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">{current.question}</h2>
          {!quiet && <p className="mt-2 text-sm text-ink-soft">{current.helper}</p>}

          <div className="mt-7 grid grid-cols-5 gap-2" role="group" aria-label={current.question}>
            {[1, 2, 3, 4, 5].map((n) => {
              const selected = values[current.key] === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => answer(n)}
                  aria-pressed={selected}
                  className={
                    "rounded-2xl py-6 font-display text-3xl tabular-nums transition-all ring-1 " +
                    (selected
                      ? "bg-moss/35 ring-transparent"
                      : "bg-canvas ring-ink/10 hover:-translate-y-0.5 hover:ring-ink/30")
                  }
                >
                  {n}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex justify-between text-xs text-slate">
            <span>{current.low}</span>
            <span>{current.high}</span>
          </div>

          {step > 0 && (
            <button
              type="button"
              className="mt-6 text-sm text-slate underline"
              onClick={() => setStep((s) => s - 1)}
            >
              Back
            </button>
          )}
        </div>
      )}

      {step === STEPS.length && (
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate">
            Step {total - 1} of {total}
          </p>
          <h2 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">Anything today that needs care?</h2>
          <p className="mt-2 text-sm text-ink-soft">
            If you tick any of these, Santé will not suggest a session today.
          </p>

          <div className="mt-5 grid gap-2">
            {RED_FLAGS.map((flag) => {
              const on = flags.includes(flag.value);
              return (
                <button
                  key={flag.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    setFlags(
                      on ? flags.filter((f) => f !== flag.value) : [...flags, flag.value]
                    )
                  }
                  className={
                    "rounded-xl px-4 py-3.5 text-left ring-1 " +
                    (on
                      ? "bg-terracotta/15 ring-terracotta/40"
                      : "bg-canvas ring-ink/10 hover:ring-ink/25")
                  }
                >
                  {on && <span aria-hidden="true">✓ </span>}
                  {flag.label}
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              className="rounded-xl bg-surface px-5 py-3 ring-1 ring-ink/15"
              onClick={() => setStep((s) => s - 1)}
            >
              Back
            </button>
            <button
              type="button"
              className="flex-1 rounded-xl bg-coral px-5 py-3.5 font-bold text-coral-on"
              onClick={() => setStep(total - 1)}
            >
              {flags.length > 0 ? "Continue" : "None of these"}
            </button>
          </div>
        </div>
      )}

      {step === total - 1 && (
        <div className="relative text-center">
          <CapacityBloom values={toBloom({ ...values, red_flags: flags })} quiet={quiet} />

          <button
            type="button"
            disabled={busy}
            onClick={() => onSubmit({ ...values, red_flags: flags })}
            className="mt-8 w-full rounded-2xl bg-coral px-6 py-4 text-lg font-bold text-coral-on disabled:opacity-60"
          >
            {busy ? "Working on it" : "Adapt today's plan"}
          </button>
          <button
            type="button"
            className="mt-3 text-sm text-slate underline"
            onClick={() => setStep(0)}
          >
            Change my answers
          </button>
        </div>
      )}
    </section>
  );
}
