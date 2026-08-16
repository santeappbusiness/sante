"use client";

import { useEffect, useState } from "react";
import { Flower } from "./BrandShapes";
import { PlayIcon } from "./ControlIcons";
import type { DailyPlan } from "@/types/domain";

/**
 * The moment between choosing and doing.
 *
 * Tapping start used to swap the page for a movement, mid-thought. This is a
 * short beat that confirms what is about to happen, names the session so
 * nobody wonders whether the right one loaded, and gives the brand somewhere to
 * breathe.
 *
 * Deliberately not a gym countdown. No three-two-one, no bar filling, no
 * urgency. A flower opening once, at the pace of one slow breath.
 *
 * Always skippable, and skipped entirely in calm mode and under reduced
 * motion, where being made to wait for an animation is the opposite of help.
 */
export default function SessionOpening({
  plan,
  quiet,
  onBegin,
}: {
  plan: DailyPlan;
  quiet: boolean;
  onBegin: () => void;
}) {
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const instant = quiet || reduced;

  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (instant) {
      onBegin();
      return;
    }
    const hold = setTimeout(() => setLeaving(true), 1500);
    const go = setTimeout(onBegin, 1900);
    return () => {
      clearTimeout(hold);
      clearTimeout(go);
    };
  }, [instant, onBegin]);

  if (instant) return null;

  return (
    <section
      aria-live="polite"
      className={
        "mt-8 overflow-hidden rounded-[26px] bg-moss/20 px-6 py-12 text-center transition-opacity duration-300 " +
        (leaving ? "opacity-0" : "opacity-100")
      }
    >
      <span aria-hidden="true" className="inline-block text-moss-deep sante-unfold">
        <Flower size={84} id="opening" />
      </span>

      <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-slate">
        Getting your session ready
      </p>
      <h2 className="mt-1.5 font-display text-3xl leading-tight">{plan.title}</h2>
      <p className="mt-1 font-mono text-sm text-slate">
        {plan.total_minutes} min · {plan.movements.length} movement
        {plan.movements.length === 1 ? "" : "s"}
      </p>

      <button
        onClick={onBegin}
        className="mt-7 inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-surface px-6 py-3 font-bold ring-1 ring-ink/15"
      >
        <PlayIcon size={17} />
        Start now
      </button>
    </section>
  );
}
