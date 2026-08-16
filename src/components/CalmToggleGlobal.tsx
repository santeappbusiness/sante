"use client";

import { useEffect, useRef, useState } from "react";
import { CalmIcon } from "./ControlIcons";
import { readCalm, useCalmSync, writeCalm } from "./CalmMode";
import { useModalFocus } from "@/lib/useModalFocus";
import { readScoped, useIdentity, writeScoped } from "@/lib/identity";
import { getSupabase } from "@/lib/supabase/client";
import { ABOVE_BOTTOM_STACK } from "@/lib/bottomInset";

/**
 * Calm mode, reachable from anywhere.
 *
 * It was prominent on Today and buried in Profile, which is the wrong way
 * round: the moment a person needs it is rarely the moment she is on the
 * screen that offers it. Now it lives in the navigation, which is the one
 * thing present on every page.
 *
 * A label, not a lone icon. An unexplained symbol in the corner of a wellness
 * app is a guess, and guessing costs exactly the attention this is here to
 * protect.
 *
 * The first time it is switched on it says what it does. After that it just
 * switches, because being re-explained something you already chose is its own
 * small tax.
 */

const EXPLAINED = "calm-explained";

const CHANGES = [
  "All motion stops.",
  "Larger text and more room between things.",
  "Instructions shorten, and fewer choices are shown at once.",
  "Results open simplified, with the detail folded away.",
  "Sessions keep to fewer, quieter movements.",
];

export default function CalmToggleGlobal({ variant }: { variant: "bar" | "rail" }) {
  const { identity, loading } = useIdentity();
  const [on, setOn] = useState(false);
  const [ready, setReady] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  useModalFocus(explaining, panel);

  /* Nothing renders until we know whose preference this is, so the control
     never shows the wrong state and then corrects itself. */
  useEffect(() => {
    if (loading) return;
    const id = identity?.id ?? null;
    const value = readCalm(id);
    setOn(value);
    document.documentElement.setAttribute("data-nd", value ? "on" : "off");
    setReady(true);
  }, [loading, identity]);

  /* Profile has its own row for this. Whichever one she touches, both move. */
  useCalmSync((value) => {
    setOn(value);
    document.documentElement.setAttribute("data-nd", value ? "on" : "off");
  });

  async function apply(next: boolean) {
    const id = identity?.id ?? null;
    setOn(next);
    document.documentElement.setAttribute("data-nd", next ? "on" : "off");
    writeCalm(next, id);

    /* The adaptation is built server-side from the stored profile, so this has
       to reach the database or the session stays exactly as noisy as before. */
    const sb = getSupabase();
    if (!sb || !id) return;
    await sb.from("profiles").update({ nd_mode: next }).eq("id", id);
  }

  function toggle() {
    const id = identity?.id ?? null;
    if (!on && !readScoped<boolean>(EXPLAINED, id, false)) {
      setExplaining(true);
      return;
    }
    apply(!on);
  }

  function confirmFirstTime() {
    writeScoped(EXPLAINED, identity?.id ?? null, true);
    setExplaining(false);
    apply(true);
  }

  if (!ready) return null;

  const label = (
    <>
      <span aria-hidden="true">
        <CalmIcon size={18} />
      </span>
      Calm
    </>
  );

  return (
    <>
      {variant === "bar" ? (
        /* Above the navigation, right aligned, and narrow enough that it never
           sits over a primary action or the safe area. */
        <div
          className="pointer-events-none fixed inset-x-0 z-20 flex justify-end px-4 lg:hidden"
          /* Clears the navigation and whatever else is anchored above it: the
             check-in prompt, or the session player's controls. */
          style={{ bottom: ABOVE_BOTTOM_STACK, marginBottom: "env(safe-area-inset-bottom)" }}
        >
          <button
            onClick={toggle}
            aria-pressed={on}
            aria-label={on ? "Calm mode is on. Turn it off." : "Turn calm mode on"}
            className={
              "pointer-events-auto flex min-h-[44px] items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold shadow-[0_8px_24px_-12px_rgba(47,58,51,0.5)] ring-1 " +
              (on ? "bg-lavender text-ink ring-transparent" : "bg-surface/95 text-ink-soft ring-ink/15 backdrop-blur")
            }
          >
            {label}
            <span
              aria-hidden="true"
              className={"ml-0.5 block h-2 w-2 rounded-full " + (on ? "bg-moss-deep" : "bg-ink/25")}
            />
          </button>
        </div>
      ) : (
        <button
          onClick={toggle}
          aria-pressed={on}
          aria-label={on ? "Calm mode is on. Turn it off." : "Turn calm mode on"}
          className={
            "mb-3 flex min-h-[44px] w-full items-center gap-2.5 rounded-2xl px-3.5 py-3 text-[15px] ring-1 " +
            (on ? "bg-lavender font-bold text-ink ring-transparent" : "bg-canvas text-ink-soft ring-ink/15")
          }
        >
          {label}
          <span
            aria-hidden="true"
            className={"ml-auto block h-2.5 w-2.5 rounded-full " + (on ? "bg-moss-deep" : "bg-ink/25")}
          />
        </button>
      )}

      {explaining && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 px-4 pb-4 backdrop-blur-sm sm:items-center sm:pb-0"
          onClick={() => setExplaining(false)}
        >
          <div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="calm-explainer-title"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-[26px] bg-surface p-7 shadow-[0_30px_70px_-30px_rgba(47,58,51,0.5)]"
          >
            <span aria-hidden="true" className="text-lavender">
              <CalmIcon size={34} />
            </span>
            <h2 id="calm-explainer-title" className="mt-3 font-display text-2xl leading-tight">
              Calm mode
            </h2>
            <p className="mt-2 text-ink-soft">
              For days when an ordinary interface is the thing that is too much.
            </p>

            <ul className="mt-4 grid gap-2 text-sm text-ink-soft">
              {CHANGES.map((c) => (
                <li key={c} className="rounded-xl bg-canvas px-4 py-3">
                  {c}
                </li>
              ))}
            </ul>

            <p className="mt-4 text-sm text-slate">
              It does not shorten your session or lower its intensity. Fewer things to hold in
              your head is not the same as being allowed to do less.
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              <button
                onClick={confirmFirstTime}
                className="min-h-[44px] flex-1 rounded-2xl bg-coral px-5 py-3 font-bold text-coral-on"
              >
                Turn it on
              </button>
              <button
                onClick={() => setExplaining(false)}
                className="min-h-[44px] rounded-2xl bg-canvas px-5 py-3 font-bold ring-1 ring-ink/15"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
