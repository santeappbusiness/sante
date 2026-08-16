"use client";

import { useEffect, useState } from "react";

/**
 * Calm mode.
 *
 * Previously called "simplified mode", which said nothing about what it does
 * and sounded like a lesser version of the product. It is not lesser. It is the
 * version that works on a day when a normal interface is too much.
 *
 * What it actually changes, all of it visible:
 *   - motion stops everywhere, including the plan morph and the bloom
 *   - the free-text box disappears, because a blank box is an open decision
 *   - instructions shorten to the first sentence
 *   - ambient shapes and tints drop back
 *   - one action per screen is emphasised, the rest recede
 *   - larger text and more space between things
 *
 * Stored on the profile when someone is signed in, so it survives a refresh
 * rather than being a toggle they have to find again every visit.
 */

const KEY = "sante-calm";

export function readCalm(fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === "on") return true;
    if (raw === "off") return false;
  } catch {}
  return fallback;
}

export function writeCalm(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {}
}

export default function CalmModeToggle({
  value,
  onChange,
  compact = false,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-nd", value ? "on" : "off");
    writeCalm(value);
  }, [value]);

  if (compact) {
    return (
      <button
        onClick={() => onChange(!value)}
        aria-pressed={value}
        className={
          "flex items-center gap-2 rounded-full px-3.5 py-2 text-sm ring-1 " +
          (value ? "bg-lavender/50 font-bold ring-transparent" : "bg-surface ring-ink/15")
        }
      >
        <span
          aria-hidden="true"
          className={
            "block h-2.5 w-2.5 rounded-full " + (value ? "bg-moss-deep" : "bg-ink/25")
          }
        />
        Calm mode
      </button>
    );
  }

  return (
    <div className="rounded-[24px] bg-lavender/30 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl">Calm mode</h2>
          <p className="mt-1 max-w-md text-ink-soft">
            For days when an ordinary interface is the thing that is too much.
          </p>
        </div>

        <button
          role="switch"
          aria-checked={value}
          aria-label="Calm mode"
          onClick={() => onChange(!value)}
          className={
            "relative h-8 w-14 shrink-0 rounded-full transition-colors " +
            (value ? "bg-moss-deep" : "bg-ink/20")
          }
        >
          <span
            aria-hidden="true"
            className={
              "absolute top-1 h-6 w-6 rounded-full bg-surface transition-[left] " +
              (value ? "left-7" : "left-1")
            }
          />
        </button>
      </div>

      <button
        onClick={() => setOpen((o) => !o)}
        className="mt-4 text-sm text-ink-soft underline underline-offset-4"
      >
        {open ? "Hide what it changes" : "What does it change?"}
      </button>

      {open && (
        <ul className="mt-3 grid gap-2 text-sm text-ink-soft">
          {[
            "All motion stops, including the plan animation.",
            "The free-text box goes away, so nothing asks you to compose a sentence.",
            "Instructions shorten to the first line.",
            "Background shapes and tints drop back.",
            "One clear action per screen, with the rest quieter.",
            "Larger text and more room between things.",
          ].map((line) => (
            <li key={line} className="rounded-xl bg-surface/70 px-4 py-3">
              {line}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
