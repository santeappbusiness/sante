/**
 * Navigation icons, drawn in the brand's language rather than pulled from a
 * generic icon set.
 *
 * Each one is the ambient shape that already belongs to that part of the app:
 * the sprig for home, the bloom for today, waves for the week. Filled when the
 * tab is current, outlined when it is not, so the active state does not rely on
 * colour alone.
 */

type Props = { active?: boolean; size?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  "aria-hidden": "true" as const,
  focusable: "false" as const,
});

/** Home: the sprig. Where you are. */
export function HomeIcon({ active, size = 24 }: Props) {
  return (
    <svg {...base(size)}>
      <path d="M12 21v-9" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path
        d="M12 14c0-4 3-7 7-7 0 4-3 7-7 7Zm0 0c0-4-3-7-7-7 0 4 3 7 7 7Z"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Explore: gathered shapes, things to look through. */
export function ExploreIcon({ active, size = 24 }: Props) {
  return (
    <svg {...base(size)}>
      <rect
        x="3.2" y="3.2" width="8" height="8" rx="3"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor" strokeWidth="1.7"
      />
      <rect
        x="12.8" y="3.2" width="8" height="8" rx="3"
        fill={active ? "currentColor" : "none"} opacity={active ? 0.5 : 1}
        stroke="currentColor" strokeWidth="1.7"
      />
      <rect
        x="3.2" y="12.8" width="8" height="8" rx="3"
        fill={active ? "currentColor" : "none"} opacity={active ? 0.5 : 1}
        stroke="currentColor" strokeWidth="1.7"
      />
      <rect
        x="12.8" y="12.8" width="8" height="8" rx="3"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor" strokeWidth="1.7"
      />
    </svg>
  );
}

/** Week: waves, the rhythm of it. */
export function WeekIcon({ active, size = 24 }: Props) {
  return (
    <svg {...base(size)}>
      <g stroke="currentColor" strokeWidth={active ? 2.4 : 1.8} strokeLinecap="round" fill="none">
        <path d="M3 7.5c1.9-2 3.8-2 5.7 0s3.8 2 5.7 0 3.8-2 5.6 0" />
        <path d="M3 12c1.9-2 3.8-2 5.7 0s3.8 2 5.7 0 3.8-2 5.6 0" />
        <path d="M3 16.5c1.9-2 3.8-2 5.7 0s3.8 2 5.7 0 3.8-2 5.6 0" />
      </g>
    </svg>
  );
}

/** Today: the bloom itself. The centre of the product. */
export function TodayIcon({ active, size = 24 }: Props) {
  const petal = "M12 12 C 8.4 9.2, 8.4 4.6, 12 2.4 C 15.6 4.6, 15.6 9.2, 12 12 Z";
  return (
    <svg {...base(size)}>
      {[0, 90, 180, 270].map((a) => (
        <path
          key={a}
          d={petal}
          transform={`rotate(${a} 12 12)`}
          fill={active ? "currentColor" : "none"}
          opacity={active ? 0.9 : 1}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      ))}
      <circle cx="12" cy="12" r="2.1" fill="currentColor" />
    </svg>
  );
}

/** Progress: the arch, something built over time. */
export function ProgressIcon({ active, size = 24 }: Props) {
  return (
    <svg {...base(size)}>
      <path
        d="M4 20v-6a8 8 0 0 1 16 0v6"
        stroke="currentColor"
        strokeWidth={active ? 2.6 : 1.9}
        strokeLinecap="round"
        fill="none"
      />
      {active && <circle cx="12" cy="20" r="1.8" fill="currentColor" />}
    </svg>
  );
}

/** Profile: you, as the flower's centre. */
export function ProfileIcon({ active, size = 24 }: Props) {
  return (
    <svg {...base(size)}>
      <circle
        cx="12" cy="8.4" r="3.8"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor" strokeWidth="1.7"
      />
      <path
        d="M4.8 20.4c0-3.8 3.2-6.4 7.2-6.4s7.2 2.6 7.2 6.4"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
      />
    </svg>
  );
}
