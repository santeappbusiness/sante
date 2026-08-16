"use client";

import { useEffect, useRef, useState } from "react";
import { TimeIcon } from "./ControlIcons";

/**
 * A timer you have to start.
 *
 * Santé never runs a clock at someone: a countdown that begins on its own turns
 * a gentle session into a test, and this app is used by people on days when
 * that is the last thing they need.
 *
 * So it sits there, offered, until it is asked for. It can be paused, and it
 * can be ignored entirely, and finishing without it counts exactly the same.
 *
 * Running is controlled by the player rather than owned here, so the pause
 * control can live in the session's fixed bar where a thumb already is. The
 * countdown itself stays local: nothing above needs to re-render every second.
 */
export default function MovementTimer({
  minutes,
  quiet,
  running,
  onRunningChange,
  onComplete,
}: {
  minutes: number;
  quiet: boolean;
  running: boolean;
  onRunningChange: (running: boolean) => void;
  onComplete?: () => void;
}) {
  const total = minutes * 60;
  const [left, setLeft] = useState(total);
  const [finished, setFinished] = useState(false);

  /* Held in a ref so a new callback identity on the parent's render does not
     tear the interval down and start it again, which is how a one second tick
     turns into an unreliable one. */
  const complete = useRef(onComplete);
  complete.current = onComplete;

  /* A new movement means a new clock. */
  useEffect(() => {
    setLeft(minutes * 60);
    setFinished(false);
  }, [minutes]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          setFinished(true);
          onRunningChange(false);
          complete.current?.();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, onRunningChange]);

  const mm = Math.floor(left / 60);
  const ss = left % 60;
  const progress = total === 0 ? 0 : 1 - left / total;

  return (
    <div className="rounded-2xl bg-canvas p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.13em] text-slate">
            <span aria-hidden="true">
              <TimeIcon size={14} />
            </span>
            {finished ? "Time is up" : running ? "Counting down" : "Timer, if you want one"}
          </p>
          {/* Announced only at the two moments that matter. A live region on a
              ticking clock reads every second aloud. */}
          <p className="mt-0.5 font-display text-3xl tabular-nums">
            {mm}:{String(ss).padStart(2, "0")}
          </p>
        </div>

        <div className="flex gap-2">
          {!finished && (
            <button
              onClick={() => onRunningChange(!running)}
              className={
                "min-h-[44px] rounded-xl px-4 py-2.5 text-sm font-bold " +
                (running ? "bg-surface ring-1 ring-ink/15" : "bg-moss/30")
              }
            >
              {running ? "Pause" : left === total ? "Start" : "Resume"}
            </button>
          )}
          {(running || left !== total) && (
            <button
              onClick={() => {
                onRunningChange(false);
                setFinished(false);
                setLeft(total);
              }}
              className="min-h-[44px] rounded-xl px-3 py-2.5 text-sm text-slate underline"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {!quiet && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink/10">
          <div
            className="h-full rounded-full bg-moss-deep transition-[width] duration-1000 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}

      <p role="status" className="mt-2 text-xs text-slate">
        {finished
          ? "That is the time. Mark it done whenever you are ready."
          : "Optional. Going at your own pace counts the same."}
      </p>
    </div>
  );
}
