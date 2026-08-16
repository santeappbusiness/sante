"use client";

import { Flower } from "./BrandShapes";

/**
 * The sticky invitation to check in.
 *
 * Present without hunting, and gone once it is done: an app that keeps shouting
 * "check in" after you have checked in is not paying attention. Sits above the
 * bottom navigation and respects the safe area.
 */
export default function CheckInPrompt({
  capacity,
  onOpen,
}: {
  /** The word for today, once they have checked in. */
  capacity: string | null;
  onOpen: () => void;
}) {
  return (
    <div
      className="fixed inset-x-0 bottom-[60px] z-20 px-4 pb-3 lg:bottom-4 lg:left-auto lg:right-6 lg:w-80 lg:px-0"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
    >
      <button
        onClick={onOpen}
        className={
          "flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left shadow-[0_10px_40px_-16px_rgba(47,58,51,0.45)] " +
          (capacity ? "bg-surface ring-1 ring-ink/10" : "bg-coral text-coral-on")
        }
      >
        <span aria-hidden="true" className={capacity ? "text-lavender" : "text-coral-on"}>
          <Flower size={30} id="prompt" />
        </span>

        <span className="min-w-0 flex-1">
          {capacity ? (
            <>
              <span className="block text-sm font-bold">{capacity} today</span>
              <span className="block text-xs text-slate">View or update your check-in</span>
            </>
          ) : (
            <>
              <span className="block font-bold">How are you arriving today?</span>
              <span className="block text-sm opacity-80">A 20-second check-in</span>
            </>
          )}
        </span>

        <span aria-hidden="true" className="shrink-0 text-lg">
          →
        </span>
      </button>
    </div>
  );
}
