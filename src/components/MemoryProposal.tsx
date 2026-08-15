"use client";

import type { FeedbackVerdict } from "@/types/domain";

/**
 * Memory, with permission.
 *
 * Santé does not quietly learn about anyone. When a pattern shows up in what
 * someone actually told us, we say what we noticed, what we would change, and
 * wait to be told yes. Declining is a real answer and we stop asking.
 *
 * The evidence is always the person's own words back to them, never an
 * inference about who they are.
 */
export default function MemoryProposal({
  feedback,
  alreadyOffered,
  adaptedMinutes,
  onRemember,
  onDismiss,
}: {
  feedback: FeedbackVerdict[];
  alreadyOffered: boolean;
  adaptedMinutes: number;
  onRemember: (minutes: number) => void;
  onDismiss: () => void;
}) {
  /* Two "too much" verdicts is a pattern worth naming. One is just a day. */
  const tooMuch = feedback.filter((f) => f === "too_much").length;
  if (alreadyOffered || tooMuch < 2) return null;

  const suggested = Math.max(5, adaptedMinutes - 4);

  return (
    <div className="mt-5 rounded-2xl bg-lavender/35 p-5">
      <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate">
        Santé noticed
      </p>
      <p className="mt-2 text-lg">
        The last {tooMuch} sessions still felt like a lot, even after adapting.
      </p>
      <p className="mt-1 text-sm text-ink-soft">
        Start days like this closer to {suggested} minutes?
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => onRemember(suggested)}
          className="rounded-xl bg-coral px-5 py-2.5 font-bold text-coral-on"
        >
          Remember this
        </button>
        <button
          onClick={onDismiss}
          className="rounded-xl px-5 py-2.5 text-ink-soft underline"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
