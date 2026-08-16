"use client";

import { useLayoutEffect, type RefObject } from "react";

/**
 * How much fixed furniture is stacked above the bottom navigation.
 *
 * Two things park down there — the check-in prompt and the session player's
 * control bar — and the floating Calm control has to clear whichever is
 * present. Hard-coding an offset put the pill straight over "Mark done", and
 * covering a workout control is worse than not offering calm mode at all.
 *
 * So each of them reports its own height, the largest wins, and the pill reads
 * the result. Measuring rather than guessing also survives large text settings,
 * which is the exact audience this pill exists for.
 */

const VAR = "--sante-bottom-stack";
const heights = new Map<symbol, number>();

function republish() {
  const tallest = Math.max(0, ...heights.values());
  document.documentElement.style.setProperty(VAR, `${tallest}px`);
}

export function usePublishBottomInset(ref: RefObject<HTMLElement>) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const key = Symbol("bottom-inset");
    const measure = () => {
      heights.set(key, el.offsetHeight);
      republish();
    };
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      ro.disconnect();
      heights.delete(key);
      republish();
    };
  }, [ref]);
}

/** What a control anchored above that furniture should sit at. */
export const ABOVE_BOTTOM_STACK = `calc(64px + var(${VAR}, 0px))`;
