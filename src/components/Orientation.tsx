"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Asterisk, Flower, Sprig } from "./BrandShapes";
import { useModalFocus } from "@/lib/useModalFocus";
import { readScoped, writeScoped, type Identity } from "@/lib/identity";

/**
 * Thirty seconds on what Santé is, and how to get out of it.
 *
 * Deliberately not a tour. Nothing here points at a moving page element, so
 * nothing breaks when a layout changes, and it can be replayed from Profile
 * rather than being a thing you get once and never again.
 *
 * Three steps because that is what there is to say. Adding a fourth would be
 * padding, and this is an app for people who do not have attention to spare.
 *
 * "Seen" is recorded against the identity, not the browser. One person
 * finishing it should not silently skip it for the next account signed in on
 * the same laptop.
 */

const KEY = "orientation-seen";

export function hasSeenOrientation(identityId: string | null): boolean {
  return readScoped<boolean>(KEY, identityId, false);
}

export function markOrientationSeen(identityId: string | null) {
  writeScoped(KEY, identityId, true);
}

type Step = {
  motif: (p: { size?: number; id?: string }) => React.ReactElement;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    motif: Sprig,
    title: "Start with how today feels",
    body: "Four questions: energy, discomfort, mood and sensory load. About twenty seconds, no wearable, and no streak to keep alive.",
  },
  {
    motif: Asterisk,
    title: "Your goal stays. The route changes.",
    body: "Santé works out what today can hold, in its own code, then rebuilds your session inside those limits and tells you what changed.",
  },
  {
    motif: Flower,
    title: "You stay in charge",
    body: "Swap a movement, simplify the day, stop early, or turn on calm mode. Nothing here decides anything about you that you did not say.",
  },
];

export default function Orientation({
  identity,
  onClose,
  quiet,
}: {
  identity: Identity;
  onClose: () => void;
  /** Calm mode or reduced motion: present the same words without the motion. */
  quiet: boolean;
}) {
  const [step, setStep] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  useModalFocus(true, panel);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  });

  function finish() {
    markOrientationSeen(identity.id);
    onClose();
  }

  const current = STEPS[step];
  const Motif = current.motif;
  const isLast = step === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 px-4 pb-4 backdrop-blur-sm sm:items-center sm:pb-0"
      onClick={finish}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="orientation-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={
          "relative w-full max-w-md overflow-hidden rounded-[26px] bg-surface p-7 shadow-[0_30px_70px_-30px_rgba(47,58,51,0.5)] " +
          (quiet ? "" : "sheet-rise")
        }
      >
        <div className="flex items-start justify-between gap-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate">
            {identity.isDemo ? "You are looking at the demo" : "How Santé works"}
          </p>
          <button
            onClick={finish}
            aria-label="Close"
            className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate ring-1 ring-ink/10"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        {identity.isDemo && step === 0 && (
          <p className="mt-2 text-sm text-ink-soft">
            You are Maya, a fictional woman with a week and a history already in it. Everything
            you change is yours and nobody else sees it.
          </p>
        )}

        <div className="mt-5 flex gap-1.5" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={
                "h-1.5 flex-1 rounded-full transition-colors duration-300 " +
                (i <= step ? "bg-moss-deep" : "bg-ink/10")
              }
            />
          ))}
        </div>

        {/* Keyed so each step arrives rather than swapping its text in place. */}
        <div key={step} className={quiet ? "mt-6" : "rise mt-6"}>
          <span aria-hidden="true" className="text-moss-deep">
            <Motif size={38} id={`orientation-${step}`} />
          </span>
          <h2 id="orientation-title" className="mt-3 font-display text-2xl leading-tight">
            {current.title}
          </h2>
          <p className="mt-2 text-ink-soft">{current.body}</p>
        </div>

        <p className="sr-only" role="status" aria-live="polite">
          Step {step + 1} of {STEPS.length}. {current.title}.
        </p>

        <div className="mt-7 flex items-center gap-2.5">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="min-h-[44px] rounded-2xl bg-canvas px-5 py-3 font-bold ring-1 ring-ink/15"
            >
              Back
            </button>
          )}

          {isLast ? (
            <Link
              href="/today"
              onClick={finish}
              className="flex min-h-[44px] flex-1 items-center justify-center rounded-2xl bg-coral px-5 py-3 font-bold text-coral-on"
            >
              Check in now
            </Link>
          ) : (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="min-h-[44px] flex-1 rounded-2xl bg-coral px-5 py-3 font-bold text-coral-on"
            >
              Next
            </button>
          )}

          {!isLast && (
            <button
              onClick={finish}
              className="nd-secondary min-h-[44px] px-3 text-sm text-slate underline underline-offset-4"
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
