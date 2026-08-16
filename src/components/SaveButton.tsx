"use client";

import { useEffect, useState } from "react";
import { readScoped, useIdentity, writeScoped } from "@/lib/identity";

/**
 * Saving, at the level people actually think in: whole sessions, not
 * individual movements. Kept in the browser, which is the right weight for a
 * favourites list.
 */
const KEY = "saved-workouts";

/** Saved sessions belong to whoever saved them, not to the browser. */
export function readSaved(identityId: string | null): string[] {
  return readScoped<string[]>(KEY, identityId, []);
}

export default function SaveButton({ workoutId }: { workoutId: string }) {
  const { identity } = useIdentity();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(readSaved(identity?.id ?? null).includes(workoutId));
  }, [workoutId, identity]);

  function toggle() {
    const id = identity?.id ?? null;
    const list = readSaved(id);
    const next = list.includes(workoutId)
      ? list.filter((w) => w !== workoutId)
      : [...list, workoutId];
    writeScoped(KEY, id, next);
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
