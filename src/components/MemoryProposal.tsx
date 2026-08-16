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
  busy = false,
  error = null,
  onRemember,
  onDismiss,
}: {
  feedback: FeedbackVerdict[];
  alreadyOffered: boolean;
  adaptedMinutes: number;
  /** A save is in flight. Both answers are held until it resolves. */
  busy?: boolean;
  /** The preference could not be stored. The proposal stays put and the person
   *  can try again, because dismissing it on our behalf would record a choice
   *  they did not make. */
  error?: string | null;
  onRemember: (minutes: number) => void;
  onDismiss: () => void;
}) {
  /* Two "too much" verdicts is a pattern worth naming. One is just a day.
     The count includes the session just rated, which is why this is rendered
     after the verdict is saved rather than before it is given. */
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

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-terracotta/10 px-4 py-3 text-sm text-terracotta">
          {error} Nothing has been changed, so trying again is safe.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => onRemember(suggested)}
          disabled={busy}
          className="rounded-xl bg-coral px-5 py-2.5 font-bold text-coral-on disabled:opacity-60"
        >
          {busy ? "Saving" : error ? "Try again" : "Remember this"}
        </button>
        <button
          onClick={onDismiss}
          disabled={busy}
          className="rounded-xl px-5 py-2.5 text-ink-soft underline disabled:opacity-60"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
