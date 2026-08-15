"use client";

import { useState } from "react";
import type { DailyPlan, Movement } from "@/types/domain";
import { Blob, Sprig } from "./BrandShapes";

/**
 * The session, one movement at a time.
 *
 * No countdown timers, on purpose: a clock running down turns a gentle session
 * into a test. You move, you tap, you go on.
 *
 * The important part is "This isn't working today". It swaps the current
 * movement for another the server already permitted, recalculates the time
 * left, and says what changed. Nothing regenerates, nothing restarts, and the
 * rest of the session stays exactly where it was.
 */

function pickAlternative(
  current: Movement,
  plan: DailyPlan,
  pool: Movement[]
): Movement | null {
  const inUse = new Set(plan.movements.map((m) => m.id));

  /* Never longer than what it replaces. Someone tapping "this isn't working"
     is asking for less, and handing them a session that grew by three minutes
     is the opposite of the point. */
  const candidates = pool.filter((m) => !inUse.has(m.id) && m.minutes <= current.minutes);
  if (candidates.length === 0) return null;

  /* Prefer something that keeps the same character but asks less: a shared tag
     first, then whatever is gentlest. */
  const sameFeel = candidates.filter((m) => m.tags.some((t) => current.tags.includes(t)));
  const shortlist = sameFeel.length > 0 ? sameFeel : candidates;
  return shortlist.sort((a, b) => a.minutes - b.minutes)[0];
}

function swapExplanation(from: Movement, to: Movement): string {
  const shared = to.tags.filter((t) => from.tags.includes(t));
  const bits: string[] = [];
  if (shared.length > 0) bits.push(`same ${shared[0].replace(/_/g, " ")} focus`);
  if (to.minutes < from.minutes) {
    const d = from.minutes - to.minutes;
    bits.push(`${d} minute${d === 1 ? "" : "s"} shorter`);
  }
  if (to.intensity !== from.intensity) bits.push("easier going");
  return `${from.name} swapped for ${to.name}${bits.length ? `. ${bits.join(", ")}` : ""}.`;
}

export default function SessionPlayer({
  plan,
  pool,
  completed,
  quiet,
  onToggleComplete,
  onSwap,
  onFinish,
}: {
  plan: DailyPlan;
  pool: Movement[];
  completed: string[];
  quiet: boolean;
  onToggleComplete: (id: string) => void;
  onSwap: (index: number, replacement: Movement) => void;
  onFinish: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [lastSwap, setLastSwap] = useState<string | null>(null);

  const movement = plan.movements[index];
  if (!movement) return null;

  const remaining = plan.movements
    .slice(index)
    .filter((m) => !completed.includes(m.id))
    .reduce((s, m) => s + m.minutes, 0);

  const isDone = completed.includes(movement.id);
  const isLast = index === plan.movements.length - 1;

  function handleSwap() {
    const replacement = pickAlternative(movement, plan, pool);
    if (!replacement) {
      setLastSwap(
        "Nothing in today's options is gentler than this one. You can skip it, or end the session here."
      );
      return;
    }
    setLastSwap(swapExplanation(movement, replacement));
    onSwap(index, replacement);
  }

  return (
    <section>
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate">
          Movement {index + 1} of {plan.movements.length}
        </p>
        <p className="font-mono text-sm tabular-nums text-slate">{remaining} min left</p>
      </div>

      <div className="mt-2 flex gap-1.5" aria-hidden="true">
        {plan.movements.map((m, i) => (
          <span
            key={m.id}
            className={
              "h-2 flex-1 rounded-full transition-colors " +
              (completed.includes(m.id)
                ? "bg-moss-deep"
                : i === index
                ? "bg-coral"
                : "bg-ink/10")
            }
          />
        ))}
      </div>

      <div className="relative mt-6 overflow-hidden rounded-[28px] bg-surface p-7 shadow-[0_1px_2px_rgba(47,58,51,0.04),0_24px_60px_-34px_rgba(47,58,51,0.4)] sm:p-10">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 text-moss/15">
          <Blob size={260} />
        </div>

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-4xl leading-tight sm:text-5xl">{movement.name}</h2>
            <p className="mt-2 font-mono text-sm text-slate">
              {movement.minutes} min · {movement.intensity}
            </p>
          </div>
          <span aria-hidden="true" className="shrink-0 text-moss">
            <Sprig size={38} />
          </span>
        </div>

        <p className="relative mt-6 max-w-lg text-xl leading-relaxed text-ink-soft">
          {movement.instructions}
        </p>

        {lastSwap && (
          <p className="relative mt-6 rounded-2xl bg-moss/25 px-5 py-4 text-sm" role="status">
            {lastSwap}
          </p>
        )}

        <button
          onClick={() => onToggleComplete(movement.id)}
          aria-pressed={isDone}
          className={
            "relative mt-7 w-full rounded-2xl px-5 py-5 text-lg font-bold " +
            (isDone ? "bg-moss/35 text-ink" : "bg-coral text-coral-on")
          }
        >
          {isDone ? "✓ Done" : "Mark done"}
        </button>

        {/* The mid-session escape hatch. Present on every movement, never
            framed as giving up. */}
        <button
          onClick={handleSwap}
          className="relative mt-3 w-full rounded-2xl px-5 py-3.5 text-sm text-ink-soft underline decoration-slate/40 underline-offset-4"
        >
          This isn&rsquo;t working today
        </button>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          className="rounded-xl bg-surface px-5 py-3 ring-1 ring-ink/15 disabled:opacity-40"
          onClick={() => {
            setLastSwap(null);
            setIndex((i) => Math.max(0, i - 1));
          }}
          disabled={index === 0}
        >
          Back
        </button>

        {isLast ? (
          <button
            className="flex-1 rounded-xl bg-coral px-5 py-3.5 font-bold text-coral-on"
            onClick={onFinish}
          >
            Finish session
          </button>
        ) : (
          <button
            className="flex-1 rounded-xl bg-surface px-5 py-3.5 font-bold ring-1 ring-ink/15"
            onClick={() => {
              setLastSwap(null);
              setIndex((i) => i + 1);
            }}
          >
            Next movement
          </button>
        )}
      </div>

      {!quiet && (
        <button className="mt-4 text-sm text-slate underline" onClick={onFinish}>
          End session here
        </button>
      )}
    </section>
  );
}
