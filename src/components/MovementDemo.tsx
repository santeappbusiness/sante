"use client";

import { useEffect, useRef } from "react";
import { useModalFocus } from "@/lib/useModalFocus";
import { watchUrl, type MovementMedia } from "@/lib/movement-media";
import MediaStage from "./MediaStage";

/**
 * A demonstration, without leaving the session.
 *
 * The question mark used to open a Google search in a new tab, which is a
 * strange thing for a wellness app to do halfway through a workout: it hands
 * the person to an ad-funded results page, on a phone, mid-movement, and
 * whatever it shows is nobody's decision. Now it opens something Santé chose.
 *
 * Nothing is requested from YouTube until she presses play. Until then this is
 * a Santé poster in a fixed 16:9 frame, so the layout does not jump when the
 * player arrives, and so a session that is never asked for video costs no
 * third-party request at all.
 *
 * The written instruction stays on screen underneath the video rather than
 * being replaced by it. In calm mode it comes first and the video waits behind
 * one more deliberate press.
 */
export default function MovementDemo({
  media,
  movementName,
  instructions,
  quiet,
  onClose,
}: {
  media: MovementMedia;
  movementName: string;
  instructions: string;
  /** Calm mode or reduced motion. */
  quiet: boolean;
  onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useModalFocus(true, panel);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 px-4 pb-4 backdrop-blur-sm sm:items-center sm:pb-0"
      onClick={onClose}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={
          "max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[26px] bg-surface p-6 shadow-[0_30px_70px_-30px_rgba(47,58,51,0.5)] sm:p-7 " +
          (quiet ? "" : "sheet-rise")
        }
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate">
              How this goes
            </p>
            <h2 id="demo-title" className="mt-1 font-display text-3xl leading-tight">
              {movementName}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close demonstration"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate ring-1 ring-ink/15 hover:text-ink"
          >
            <span aria-hidden="true" className="text-lg">
              ×
            </span>
          </button>
        </div>

        {/* In calm mode the words come first, because the point of calm mode is
            fewer things arriving at once. */}
        {quiet && (
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">{instructions}</p>
        )}

        <div className="mt-5">
          <MediaStage media={media} movementName={movementName} quiet={quiet} />
        </div>

        <p className="mt-3 text-xs leading-relaxed text-slate">
          {media.title} · {media.channel}. Played from YouTube, which loads only when you press
          play.{" "}
          {/* A workplace network, a blocker or a region rule can stop the embed
              and leave a dead rectangle. The instructions below still work, and
              so does this. */}
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

        {!quiet && (
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">{instructions}</p>
        )}

        <p className="mt-5 border-t border-ink/10 pt-4 text-sm text-slate">
          This is a demonstration, not an instruction to match it. Go at your own range and
          stop if anything hurts.
        </p>
      </div>
    </div>
  );
}
