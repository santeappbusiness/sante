"use client";

import { useEffect, useState } from "react";

/**
 * Saving lives in the browser.
 *
 * A saved list is a convenience, not a record worth a table and a migration
 * during a sprint. If it ever becomes one, this is the single place to change.
 */
const KEY = "sante-saved";

export function readSaved(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export default function SaveButton({ movementId }: { movementId: string }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => setSaved(readSaved().includes(movementId)), [movementId]);

  function toggle() {
    const list = readSaved();
    const next = list.includes(movementId)
      ? list.filter((id) => id !== movementId)
      : [...list, movementId];
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
    setSaved(next.includes(movementId));
  }

  return (
    <button
      onClick={toggle}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${movementId} from saved` : `Save ${movementId}`}
      className={
        "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ring-1 " +
        (saved ? "bg-moss/30 ring-transparent" : "bg-canvas ring-ink/15")
      }
    >
      {saved ? "✓ Saved" : "Save"}
    </button>
  );
}
