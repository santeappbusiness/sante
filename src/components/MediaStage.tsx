"use client";

import { useState } from "react";
import { embedUrl, type MovementMedia } from "@/lib/movement-media";
import { Blob, Flower } from "./BrandShapes";
import { PlayIcon } from "./ControlIcons";

/**
 * The demonstration frame. One implementation, used inline in the session and
 * inside the demonstration sheet.
 *
 * The height is reserved from the first paint, so pressing play swaps a poster
 * for a player without moving a single thing underneath it. That matters more
 * here than in most products: the controls below are fixed and the timer is
 * mid-count, and a layout that jumps while someone is holding a wall sit is a
 * small cruelty.
 *
 * Nothing reaches YouTube until the press. Before that this is Santé's own
 * artwork and no third-party request has been made at all.
 */
export default function MediaStage({
  media,
  movementName,
  quiet,
  onPlay,
  label = "Watch demonstration",
}: {
  media: MovementMedia;
  movementName: string;
  /** Calm mode or reduced motion: no autoplay, no decorative motion. */
  quiet: boolean;
  /** Fired once, on the press that loads the player. */
  onPlay?: () => void;
  label?: string;
}) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-[20px] bg-moss/20">
      {playing ? (
        <iframe
          src={embedUrl(media, quiet)}
          title={`${movementName} — demonstration by ${media.channel}`}
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <button
          onClick={() => {
            onPlay?.();
            setPlaying(true);
          }}
          aria-label={`Play a demonstration of ${movementName} from ${media.channel}`}
          className="absolute inset-0 flex flex-col items-center justify-center gap-3"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-12 text-moss/30"
          >
            <Blob size={210} />
          </span>
          <span
            aria-hidden="true"
            className={"relative text-moss-deep/45 " + (quiet ? "" : "rise")}
          >
            <Flower size={52} id={`stage-${media.movementId}`} />
          </span>
          <span className="relative flex min-h-[44px] items-center gap-2 rounded-full bg-coral px-5 py-3 font-bold text-coral-on shadow-[0_10px_30px_-14px_rgba(47,58,51,0.6)]">
            <span aria-hidden="true">
              <PlayIcon size={18} />
            </span>
            {label}
          </span>
        </button>
      )}
    </div>
  );
}
