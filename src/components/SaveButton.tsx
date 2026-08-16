"use client";

import { useEffect, useState } from "react";

/**
 * Saving, at the level people actually think in: whole sessions, not
 * individual movements. Kept in the browser, which is the right weight for a
 * favourites list.
 */
const KEY = "sante-saved-workouts";

export function readSaved(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export default function SaveButton({ workoutId }: { workoutId: string }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => setSaved(readSaved().includes(workoutId)), [workoutId]);

  function toggle() {
    const list = readSaved();
    const next = list.includes(workoutId)
      ? list.filter((id) => id !== workoutId)
      : [...list, workoutId];
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
    setSaved(next.includes(workoutId));
  }

  return (
    <button
      onClick={toggle}
      aria-pressed={saved}
      className={
        "shrink-0 rounded-2xl px-5 py-3.5 font-bold ring-1 " +
        (saved ? "bg-moss/30 ring-transparent" : "bg-surface ring-ink/15")
      }
    >
      {saved ? "✓ Saved" : "Save"}
    </button>
  );
}
