"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A timer you have to start.
 *
 * Santé never runs a clock at someone: a countdown that begins on its own turns
 * a gentle session into a test, and this app is used by people on days when
 * that is the last thing they need.
 *
 * So it sits there, offered, until it is asked for. It can be paused, and it
 * can be ignored entirely, and finishing without it counts exactly the same.
 */
export default function MovementTimer({
  minutes,
  quiet,
  onComplete,
}: {
  minutes: number;
  quiet: boolean;
  onComplete?: () => void;
}) {
  const total = minutes * 60;
  const [left, setLeft] = useState(total);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  /* A new movement means a new clock. */
  useEffect(() => {
    setLeft(minutes * 60);
    setRunning(false);
    setFinished(false);
  }, [minutes]);

  useEffect(() => {
    if (!running) return;
    tick.current = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          setRunning(false);
          setFinished(true);
          onComplete?.();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (tick.current) clearInterval(tick.current);
    };
  }, [running, onComplete]);

  const mm = Math.floor(left / 60);
  const ss = left % 60;
  const progress = total === 0 ? 0 : 1 - left / total;

  return (
    <div className="rounded-2xl bg-canvas p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate">
            {finished ? "Time is up" : running ? "Counting down" : "Timer, if you want one"}
          </p>
          <p className="mt-0.5 font-display text-3xl tabular-nums">
            {mm}:{String(ss).padStart(2, "0")}
          </p>
        </div>

        <div className="flex gap-2">
          {!finished && (
            <button
              onClick={() => setRunning((r) => !r)}
              className={
                "rounded-xl px-4 py-2.5 text-sm font-bold " +
                (running ? "bg-surface ring-1 ring-ink/15" : "bg-moss/30")
              }
            >
              {running ? "Pause" : left === total ? "Start" : "Resume"}
            </button>
          )}
          {(running || left !== total) && (
            <button
              onClick={() => {
                setRunning(false);
                setFinished(false);
                setLeft(total);
              }}
              className="rounded-xl px-3 py-2.5 text-sm text-slate underline"
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

      <p className="mt-2 text-xs text-slate">
        Optional. Going at your own pace counts the same.
      </p>
    </div>
  );
}
