"use client";

import { useEffect, useRef, useState } from "react";
import { useModalFocus } from "@/lib/useModalFocus";
import { Asterisk, Flower } from "./BrandShapes";

/**
 * The one thing a judge sees before the product.
 *
 * Someone opening the demo cold arrives as Maya, mid-story, with a week and a
 * fortnight of history already in place and no idea which part is the point.
 * Three lines and a button fix that. It is not a tour, it does not follow them
 * around, and it never appears twice.
 *
 * Dismissible with the button, the backdrop, or escape, because a modal that
 * has to be beaten is exactly the kind of thing this product is against.
 */

const KEY = "sante-demo-welcome";

export default function DemoWelcome({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) !== "seen") setOpen(true);
    } catch {}
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function dismiss() {
    try {
      localStorage.setItem(KEY, "seen");
    } catch {}
    setOpen(false);
  }

  useModalFocus(open, panel);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 px-4 pb-4 backdrop-blur-sm sm:items-center sm:pb-0"
      onClick={dismiss}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-welcome-title"
        ref={panel}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="sheet-rise relative w-full max-w-md overflow-hidden rounded-[26px] bg-surface p-7 shadow-[0_30px_70px_-30px_rgba(47,58,51,0.5)]"
      >
        <div aria-hidden="true" className="absolute -bottom-10 -right-10 text-lavender/40">
          <Flower size={140} id="demo-welcome" />
        </div>

        <p className="relative text-xs font-bold uppercase tracking-[0.14em] text-slate">
          You are looking at the demo
        </p>
        <h2 id="demo-welcome-title" className="relative mt-2 font-display text-3xl leading-tight">
          This is {name}&rsquo;s Santé.
        </h2>
        <p className="relative mt-2.5 text-ink-soft">
          A fictional woman with a real week behind her, so there is something to look at.
          Everything you change is yours and nobody else sees it.
        </p>

        <ol className="relative mt-5 grid gap-2.5">
          {[
            ["Check in", "Four questions, about twenty seconds."],
            ["Watch the plan change", "It explains what changed and why, in plain words."],
            ["Look at the week", "Rest days count. Nothing here is a streak."],
          ].map(([title, body], i) => (
            <li key={title} className="flex gap-3">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-moss/30 font-mono text-xs font-bold"
              >
                {i + 1}
              </span>
              <span>
                <span className="block font-bold">{title}</span>
                <span className="block text-sm text-ink-soft">{body}</span>
              </span>
            </li>
          ))}
        </ol>

        <button
          onClick={dismiss}
          className="relative mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-coral px-6 py-4 text-lg font-bold text-coral-on"
        >
          <span aria-hidden="true">
            <Asterisk size={18} />
          </span>
          Have a look around
        </button>
      </div>
    </div>
  );
}
