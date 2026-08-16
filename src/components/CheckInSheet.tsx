"use client";

import { useEffect, useRef, useState } from "react";
import { useModalFocus } from "@/lib/useModalFocus";
import type { ReadinessCheckin, RedFlag } from "@/types/domain";
import CapacityBloom, { toBloom } from "./CapacityBloom";

/**
 * The check-in, in place.
 *
 * It used to be a route: leave Home, load a form, answer four things, come
 * back. For the interaction people are meant to do every day, that is too much
 * ceremony. This is a sheet that rises over wherever they already are, and it
 * morphs into the Bloom when they finish rather than navigating anywhere.
 *
 * The /today route still exists for deep links and for anyone who prefers a
 * page, but it is no longer the normal way in.
 */

type ScaleKey = "energy" | "discomfort" | "mood" | "sensory_load";

const STEPS: Array<{ key: ScaleKey; question: string; low: string; high: string }> = [
  { key: "energy", question: "How much energy do you have?", low: "Empty", high: "Full" },
  { key: "discomfort", question: "How does your body feel?", low: "Comfortable", high: "A lot going on" },
  { key: "mood", question: "Where is your mood?", low: "Low", high: "Good" },
  { key: "sensory_load", question: "How much is competing for your attention?", low: "Calm", high: "Overloaded" },
];

const RED_FLAGS: Array<{ value: RedFlag; label: string }> = [
  { value: "chest_pain", label: "Chest pain" },
  { value: "fainting_or_severe_dizziness", label: "Fainting or severe dizziness" },
  { value: "severe_or_unusual_pain", label: "Severe or unusual pain" },
  { value: "possible_pregnancy_complication", label: "Possible pregnancy complication" },
];

export default function CheckInSheet({
  open,
  quiet,
  onClose,
  onSubmit,
}: {
  open: boolean;
  quiet: boolean;
  onClose: () => void;
  onSubmit: (checkin: ReadinessCheckin) => void;
}) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState({ energy: 3, discomfort: 3, mood: 3, sensory_load: 3 });
  const [flags, setFlags] = useState<RedFlag[]>([]);
  const panel = useRef<HTMLDivElement>(null);

  const total = STEPS.length + 2;

  /* Reset each time it opens, so yesterday's answers are never pre-filled. */
  useEffect(() => {
    if (open) {
      setStep(0);
      setValues({ energy: 3, discomfort: 3, mood: 3, sensory_load: 3 });
      setFlags([]);
    }
  }, [open]);

  /* Focus into the sheet, trapped inside it, and handed back on close. */
  useModalFocus(open, panel);

  /* Escape closes, and the page behind should not scroll under the sheet. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        aria-label="Close check-in"
        onClick={onClose}
        className="absolute inset-0 bg-ink/25 backdrop-blur-[2px]"
      />

      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Daily check-in"
        tabIndex={-1}
        className={
          "relative max-h-[90vh] w-full overflow-y-auto rounded-t-[28px] bg-surface p-6 shadow-[0_-8px_60px_-20px_rgba(47,58,51,0.4)] sm:max-w-lg sm:rounded-[28px] sm:p-8 " +
          (quiet ? "" : "sheet-rise")
        }
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)" }}
      >
        {/* Grab handle, mobile affordance */}
        <div aria-hidden="true" className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-ink/15 sm:hidden" />

        <div className="mb-6 flex items-center gap-1.5" aria-hidden="true">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={"h-1.5 flex-1 rounded-full " + (i <= step ? "bg-moss-deep" : "bg-ink/10")}
            />
          ))}
        </div>

        {step < STEPS.length && (
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate">
              How are you arriving today?
            </p>
            <h2 className="mt-2 font-display text-3xl leading-tight">{current.question}</h2>

            <div className="mt-6 grid grid-cols-5 gap-2" role="group" aria-label={current.question}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  aria-pressed={values[current.key] === n}
                  onClick={() => {
                    setValues((v) => ({ ...v, [current.key]: n }));
                    setTimeout(() => setStep((s) => s + 1), quiet ? 0 : 150);
                  }}
                  className={
                    "rounded-2xl py-5 font-display text-2xl tabular-nums ring-1 transition-all " +
                    (values[current.key] === n
                      ? "bg-moss/35 ring-transparent"
                      : "bg-canvas ring-ink/10 hover:-translate-y-0.5")
                  }
                >
                  {n}
                </button>
              ))}
            </div>

            <div className="mt-2 flex justify-between text-xs text-slate">
              <span>{current.low}</span>
              <span>{current.high}</span>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}
                className="text-sm text-slate underline"
              >
                {step === 0 ? "Not now" : "Back"}
              </button>
              <span className="font-mono text-xs text-slate">
                {step + 1} / {total}
              </span>
            </div>
          </div>
        )}

        {step === STEPS.length && (
          <div>
            <h2 className="font-display text-3xl leading-tight">Anything that needs care?</h2>
            <p className="mt-2 text-sm text-ink-soft">
              If you tick any of these, Santé will not suggest a session today.
            </p>

            <div className="mt-5 grid gap-2">
              {RED_FLAGS.map((f) => {
                const on = flags.includes(f.value);
                return (
                  <button
                    key={f.value}
                    aria-pressed={on}
                    onClick={() =>
                      setFlags(on ? flags.filter((x) => x !== f.value) : [...flags, f.value])
                    }
                    className={
                      "rounded-2xl px-4 py-3.5 text-left ring-1 " +
                      (on ? "bg-terracotta/15 ring-terracotta/40" : "bg-canvas ring-ink/10")
                    }
                  >
                    {on && <span aria-hidden="true">✓ </span>}
                    {f.label}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setStep(total - 1)}
              className="mt-6 w-full rounded-2xl bg-coral px-6 py-4 font-bold text-coral-on"
            >
              {flags.length ? "Continue" : "None of these"}
            </button>
          </div>
        )}

        {step === total - 1 && (
          <div className="text-center">
            <CapacityBloom values={toBloom({ ...values, red_flags: flags })} quiet={quiet} />

            <button
              onClick={() => onSubmit({ ...values, red_flags: flags })}
              className="mt-7 w-full rounded-2xl bg-coral px-6 py-4 text-lg font-bold text-coral-on"
            >
              Adapt today&rsquo;s plan
            </button>
            <button onClick={() => setStep(0)} className="mt-3 text-sm text-slate underline">
              Change my answers
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
