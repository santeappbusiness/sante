"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DailyPlan, Movement } from "@/types/domain";
import { Blob } from "./BrandShapes";
import { usePublishBottomInset } from "@/lib/bottomInset";
import { mediaForMovement, watchUrl } from "@/lib/movement-media";
import MovementDemo from "./MovementDemo";
import MediaStage from "./MediaStage";
import {
  DoneIcon,
  HelpIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PrevIcon,
  StopIcon,
  SwapIcon,
} from "./ControlIcons";
import MovementTimer from "./MovementTimer";

/**
 * The session, one movement at a time.
 *
 * No countdown timers, on purpose: a clock running down turns a gentle session
 * into a test. You move, you tap, you go on.
 *
 * The controls live in one place that never moves. Previously the ways forward
 * were scattered down the card and below it, so the thing a person needed next
 * was in a different place on every movement, and on a phone it was often below
 * the fold. Now there is a fixed bar: back, pause, done, forward, always the
 * same four, always in the same order.
 *
 * The important part is still "This isn't working today". It swaps the current
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
  const [running, setRunning] = useState(false);

  /* Opening a demonstration pauses the movement, and closing it deliberately
     does not start it again. Coming back from watching how something is done
     is not the same as being ready to do it, and a timer that resumes on its
     own decides that for her. */
  const [demoOpen, setDemoOpen] = useState(false);
  function openDemo() {
    setRunning(false);
    setDemoOpen(true);
  }
  const [justDone, setJustDone] = useState<string | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const advancing = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* The control bar is fixed above the navigation, so anything else that
     floats down there has to be told how tall it is. */
  const controls = useRef<HTMLDivElement>(null);
  usePublishBottomInset(controls);

  const movement = plan.movements[index];
  const total = plan.movements.length;
  const media = mediaForMovement(movement.id);

  /* Moving between movements stops the clock. A timer that keeps running on a
     movement nobody is looking at is counting the wrong thing. */
  const goTo = useCallback(
    (next: number) => {
      setIndex((i) => {
        const target = Math.max(0, Math.min(total - 1, next));
        if (target !== i) {
          setLastSwap(null);
          setRunning(false);
        }
        return target;
      });
    },
    [total]
  );

  /* Left and right move through the session, the way a slideshow would. Skipped
     while someone is typing, and Space is deliberately left alone: it belongs
     to whichever button has focus. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goTo(index + 1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo(index - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, index]);

  useEffect(() => () => {
    if (advancing.current) clearTimeout(advancing.current);
  }, []);

  if (!movement) return null;

  const remaining = plan.movements
    .slice(index)
    .filter((m) => !completed.includes(m.id))
    .reduce((s, m) => s + m.minutes, 0);

  const isDone = completed.includes(movement.id);
  const isLast = index === total - 1;
  const doneCount = plan.movements.filter((m) => completed.includes(m.id)).length;

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

  function handleDone() {
    onToggleComplete(movement.id);
    if (isDone) return;

    setRunning(false);
    /* A beat of acknowledgement, then on. Marking something done and being
       left staring at it is the moment a session stops feeling like one. The
       last movement stays put so nobody is thrown into the end. */
    setJustDone(movement.id);
    if (advancing.current) clearTimeout(advancing.current);
    advancing.current = setTimeout(
      () => {
        setJustDone(null);
        if (!isLast) goTo(index + 1);
      },
      quiet ? 0 : 480
    );
  }

  return (
    <section className="pb-40 lg:pb-28">
      {/* One announcement per movement. The heading below is visual; this is
          what a screen reader is told when the session moves on. */}
      <p className="sr-only" role="status" aria-live="polite">
        Movement {index + 1} of {total}. {movement.name}. {movement.minutes} minutes,{" "}
        {movement.intensity} intensity.{isDone ? " Marked done." : ""}
      </p>

      <div className="flex items-baseline justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate">
          Movement {index + 1} of {total}
        </p>
        <p className="font-mono text-sm tabular-nums text-slate">{remaining} min left</p>
      </div>

      <div
        className="mt-2 flex gap-1.5"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={doneCount}
        aria-label={`${doneCount} of ${total} movements done`}
      >
        {plan.movements.map((m, i) => (
          <span
            key={m.id + i}
            className={
              "h-2 flex-1 rounded-full transition-colors duration-300 " +
              (completed.includes(m.id)
                ? "bg-moss-deep"
                : i === index
                ? "bg-coral"
                : "bg-ink/10")
            }
          />
        ))}
      </div>

      {/* Keyed on the movement, so arriving at one is a small entrance rather
          than a text swap. */}
      <div
        key={movement.id + index}
        className={
          "relative mt-6 overflow-hidden rounded-[28px] bg-surface p-7 shadow-[0_1px_2px_rgba(47,58,51,0.04),0_24px_60px_-34px_rgba(47,58,51,0.4)] sm:p-10 " +
          (quiet ? "" : "rise ") +
          (justDone === movement.id ? "sante-settled" : "")
        }
      >
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 text-moss/15">
          <Blob size={260} />
        </div>

        {/* Demonstration first, then the name, then the one instruction that
            matters, then the clock. Reading order and visual order agree, and
            the frame holds its height whether or not she ever presses play. */}
        {media && !quiet && (
          <div className="relative mb-6">
            <MediaStage
              media={media}
              movementName={movement.name}
              quiet={quiet}
              onPlay={() => setRunning(false)}
            />
            <p className="mt-2 text-xs leading-relaxed text-slate">
              {media.title} · {media.channel}.{" "}
              <a
                href={watchUrl(media)}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                If it does not load, open it on YouTube
              </a>
              .
            </p>
          </div>
        )}

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-4xl leading-tight sm:text-5xl">{movement.name}</h2>
            <p className="mt-2 font-mono text-sm text-slate">
              {movement.minutes} min · {movement.intensity}
            </p>
          </div>

        </div>

        <p className="relative mt-6 max-w-lg text-xl leading-relaxed text-ink-soft">
          {movement.instructions}
        </p>

        {/* In calm mode the stage above is not rendered, so this is how a
            demonstration is reached: one explicit press, after the words, and
            nothing playing until she asks. Offered only where a verified video
            exists — a button leading to a search page, or to nothing, is worse
            than none on a movement whose instructions are already here. */}
        {media && quiet && (
          <button
            onClick={openDemo}
            aria-label={`Watch a demonstration of ${movement.name}`}
            aria-haspopup="dialog"
            className="relative mt-5 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl bg-canvas px-5 py-3 font-bold text-ink-soft ring-1 ring-ink/15 sm:w-auto"
          >
            <span aria-hidden="true">
              <HelpIcon size={19} />
            </span>
            Watch demonstration
          </button>
        )}

        <div className="relative mt-6">
          <MovementTimer
            minutes={movement.minutes}
            quiet={quiet}
            running={running}
            onRunningChange={setRunning}
            onComplete={() => {
              if (!completed.includes(movement.id)) onToggleComplete(movement.id);
            }}
          />
        </div>

        {lastSwap && (
          <p className="relative mt-6 rounded-2xl bg-moss/25 px-5 py-4 text-sm" role="status">
            {lastSwap}
          </p>
        )}

        {/* The mid-session escape hatch. Present on every movement, never
            framed as giving up. */}
        <button
          onClick={handleSwap}
          className="relative mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-2xl px-4 py-3 text-sm text-ink-soft underline decoration-slate/40 underline-offset-4"
        >
          <span aria-hidden="true">
            <SwapIcon size={17} />
          </span>
          This isn&rsquo;t working today
        </button>
      </div>

      {confirmEnd ? (
        <div className="mt-5 rounded-[24px] bg-lavender/35 p-6">
          <p className="font-display text-2xl">End the session here?</p>
          <p className="mt-1.5 text-ink-soft">
            {doneCount === 0
              ? "Nothing is lost. Stopping before you start is a choice, not a failure."
              : doneCount === 1
              ? "The movement you finished still counts, and today still counts."
              : `The ${doneCount} movements you finished still count, and today still counts.`}
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              onClick={onFinish}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-coral px-6 py-3 font-bold text-coral-on"
            >
              <span aria-hidden="true">
                <StopIcon size={17} />
              </span>
              End session
            </button>
            <button
              onClick={() => setConfirmEnd(false)}
              className="min-h-[44px] rounded-2xl bg-surface px-5 py-3 font-bold ring-1 ring-ink/15"
            >
              Keep going
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setConfirmEnd(true)}
          className="nd-secondary mt-5 min-h-[44px] text-sm text-slate underline underline-offset-4"
        >
          End session here
        </button>
      )}

      {/* The one place the controls live. Fixed above the nav on a phone so a
          thumb always finds the same four things in the same order, static on
          a wide screen where nothing is out of reach. */}
      <div
        ref={controls}
        className="fixed inset-x-0 bottom-[60px] z-20 border-t border-ink/10 bg-surface/95 px-5 py-3 backdrop-blur lg:bottom-0 lg:left-56"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <button
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            aria-label="Previous movement"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-canvas ring-1 ring-ink/15 disabled:opacity-35"
          >
            <PrevIcon size={19} />
          </button>

          <button
            onClick={() => setRunning((r) => !r)}
            aria-pressed={running}
            aria-label={running ? "Pause the timer" : "Start the timer"}
            className={
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 " +
              (running ? "bg-lavender/60 ring-transparent" : "bg-canvas ring-ink/15")
            }
          >
            {running ? <PauseIcon size={19} /> : <PlayIcon size={19} />}
          </button>

          {isLast && isDone ? (
            <button
              onClick={onFinish}
              className="flex min-h-[48px] min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-coral px-3 py-3 text-base font-bold text-coral-on sm:px-5 sm:text-lg"
            >
              <DoneIcon size={19} />
              Finish session
            </button>
          ) : (
            <button
              onClick={handleDone}
              aria-pressed={isDone}
              className={
                "flex min-h-[48px] min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-2xl px-3 py-3 text-base font-bold sm:px-5 sm:text-lg " +
                (isDone ? "bg-moss/40 text-ink" : "bg-coral text-coral-on")
              }
            >
              <span aria-hidden="true">
                <DoneIcon size={19} />
              </span>
              {isDone ? "Done" : isLast ? "Mark done" : "Done · next"}
            </button>
          )}

          <button
            onClick={() => goTo(index + 1)}
            disabled={isLast}
            aria-label="Next movement"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-canvas ring-1 ring-ink/15 disabled:opacity-35"
          >
            <NextIcon size={19} />
          </button>
        </div>
      </div>

      {/* Above the controls in the stacking order, and closing it leaves the
          movement, its completion and any swap exactly where they were. */}
      {demoOpen && media && (
        <MovementDemo
          media={media}
          movementName={movement.name}
          instructions={movement.instructions}
          quiet={quiet}
          onClose={() => setDemoOpen(false)}
        />
      )}
    </section>
  );
}
