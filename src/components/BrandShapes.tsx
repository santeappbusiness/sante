/**
 * The brand's shapes, drawn from the board.
 *
 * These exist so surfaces can have character without every card looking like
 * the same rounded rectangle. They are ambient: always decorative, always
 * aria-hidden, never carrying meaning on their own.
 */

/** The peanut blob. Large ambient fills behind editorial sections. */
export function Blob({ className = "", id: _id, size = 300 }: { className?: string; id?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size * 0.72}
      viewBox="0 0 200 144"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M56 6c30-10 52 12 62 30 8 14 26 10 42 20 20 12 24 44 6 66-20 24-56 24-78 10-16-10-30-4-48-12C18 111 4 92 6 68 8 40 28 16 56 6Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** The arch. Used where something is in progress or building. */
export function Arch({ className = "", id: _id, size = 120 }: { className?: string; id?: string; size?: number }) {
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 100 60" fill="none" aria-hidden="true" className={className}>
      <path d="M6 60V36a44 44 0 0 1 88 0v24" stroke="currentColor" strokeWidth="10" strokeLinecap="round" />
    </svg>
  );
}

/**
 * The four-petal flower. The product's quiet signature.
 *
 * The centre is punched out rather than painted, so the shape works on any
 * tinted ground. Filling it with a fixed colour left a pale dot floating on
 * every surface that was not the canvas.
 */
export function Flower({
  className = "",
  size = 64,
  id = "petal",
}: {
  className?: string;
  size?: number;
  id?: string;
}) {
  // The id ends up inside url(#...), so anything that is not safe in a
  // fragment reference has to go. A space here silently breaks the mask and
  // the flower renders as a solid square.
  const maskId = `flower-${id.replace(/[^a-zA-Z0-9_-]/g, "-")}-${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true" className={className}>
      <mask id={maskId}>
        <rect width="64" height="64" fill="black" />
        <g fill="white">
          <ellipse cx="32" cy="16" rx="11" ry="15" />
          <ellipse cx="32" cy="48" rx="11" ry="15" />
          <ellipse cx="16" cy="32" rx="15" ry="11" />
          <ellipse cx="48" cy="32" rx="15" ry="11" />
        </g>
        <circle cx="32" cy="32" r="7" fill="black" />
      </mask>
      <rect width="64" height="64" fill="currentColor" mask={`url(#${maskId})`} />
    </svg>
  );
}

/** The coral asterisk. Energy, action, the moment something changes. */
export function Asterisk({ className = "", id: _id, size = 40 }: { className?: string; id?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true" className={className}>
      <g stroke="currentColor" strokeWidth="6" strokeLinecap="round">
        <path d="M20 5v30M7 12l26 16M33 12L7 28" />
      </g>
    </svg>
  );
}

/** Soft waves. Rhythm, repetition, the week. */
export function Waves({ className = "", id: _id, size = 140 }: { className?: string; id?: string; size?: number }) {
  return (
    <svg width={size} height={size * 0.34} viewBox="0 0 140 48" fill="none" aria-hidden="true" className={className}>
      <g stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none">
        <path d="M4 12c11-11 22-11 33 0s22 11 33 0 22-11 33 0 11 11 25 0" />
        <path d="M4 28c11-11 22-11 33 0s22 11 33 0 22-11 33 0 11 11 25 0" />
        <path d="M4 44c11-11 22-11 33 0s22 11 33 0 22-11 33 0 11 11 25 0" />
      </g>
    </svg>
  );
}

/** A botanical sprig, for quiet dividers. */
export function Sprig({ className = "", id: _id, size = 40 }: { className?: string; id?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true" className={className}>
      <path d="M20 38V14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path
        d="M20 22c0-6 5-11 11-11 0 6-5 11-11 11Zm0 0c0-6-5-11-11-11 0 6 5 11 11 11Z"
        fill="currentColor"
      />
    </svg>
  );
}
