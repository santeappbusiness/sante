/**
 * The control icon family.
 *
 * One drawing language for everything a person operates: same 24 unit box,
 * same stroke weight, same round caps and joins, all in currentColor. The
 * brand shapes in BrandShapes are ambient and decorative; these are functional
 * and always sit next to a word or carry an accessible name of their own.
 *
 * Rounded rather than sharp on purpose. Santé's geometry is organic, and a
 * hard-edged media-player set would read as somebody else's product bolted on.
 *
 * Nothing here is emoji, and nothing here replaces a label on a primary
 * action: an icon-only control that matters is a guess dressed as a shortcut.
 */

type IconProps = {
  size?: number;
  className?: string;
  /** Set only when the icon is the whole control. Beside a label, leave it off
   *  so a screen reader hears the word once rather than twice. */
  title?: string;
};

function Svg({
  size = 20,
  className = "",
  title,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title && <title>{title}</title>}
      {children}
    </svg>
  );
}

/* ---------------------------------------------------------------- *
 * Session transport
 * ---------------------------------------------------------------- */

export const PlayIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 5.5 18.5 12 8 18.5V5.5Z" />
  </Svg>
);

export const PauseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9.5 5.5v13M14.5 5.5v13" />
  </Svg>
);

export const PrevIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M18 6.5 10 12l8 5.5v-11Z" />
    <path d="M6 5.5v13" />
  </Svg>
);

export const NextIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 6.5 14 12l-8 5.5v-11Z" />
    <path d="M18 5.5v13" />
  </Svg>
);

/** Ending a session on purpose, which is not the same as failing it. */
export const StopIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="6.5" y="6.5" width="11" height="11" rx="3" />
  </Svg>
);

/* ---------------------------------------------------------------- *
 * Actions
 * ---------------------------------------------------------------- */

/** Adaptation. The asterisk, because that is already the mark for the moment
 *  something changes. */
export const AdaptIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4v16M5 7.5l14 9M19 7.5l-14 9" />
  </Svg>
);

/** Swapping one movement for a gentler one, mid session. */
export const SwapIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5" />
  </Svg>
);

export const SaveIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 4.5h10a1.5 1.5 0 0 1 1.5 1.5v13.5L12 15.5 5.5 19.5V6A1.5 1.5 0 0 1 7 4.5Z" />
  </Svg>
);

export const SavedIcon = (p: IconProps) => (
  <Svg {...p}>
    <path
      d="M7 4.5h10a1.5 1.5 0 0 1 1.5 1.5v13.5L12 15.5 5.5 19.5V6A1.5 1.5 0 0 1 7 4.5Z"
      fill="currentColor"
    />
  </Svg>
);

/** How to do a movement. A question, not an alert. */
export const HelpIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M9.75 9.5a2.25 2.25 0 1 1 2.75 2.2v1.3" />
    <path d="M12.5 16.5h.01" />
  </Svg>
);

/* ---------------------------------------------------------------- *
 * Attributes of a session
 * ---------------------------------------------------------------- */

export const TimeIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
);

export const EquipmentIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 9.5v5M7 7.5v9M17 7.5v9M20 9.5v5M7 12h10" />
  </Svg>
);

/** Intensity, as a rising line rather than flames. */
export const IntensityIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 17.5v-3M10 17.5v-6M15 17.5v-9M20 17.5v-12" />
  </Svg>
);

/** Sensory load. Waves, the same idea as the ambient motif. */
export const SensoryIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 9.5c2-2.2 4-2.2 6 0s4 2.2 6 0 4-2.2 5 0" />
    <path d="M3.5 15c2-2.2 4-2.2 6 0s4 2.2 6 0 4-2.2 5 0" />
  </Svg>
);

export const MovementsIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 7h14M5 12h14M5 17h9" />
  </Svg>
);

export const PlaceIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21s6.5-5.5 6.5-10a6.5 6.5 0 1 0-13 0C5.5 15.5 12 21 12 21Z" />
    <circle cx="12" cy="11" r="2.25" />
  </Svg>
);

/* ---------------------------------------------------------------- *
 * Outcomes
 * ---------------------------------------------------------------- */

export const DoneIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12.5 10 17.5 19 7" />
  </Svg>
);

export const ProgressIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 19h16" />
    <path d="M7.5 19v-5M12 19V8M16.5 19v-8" />
  </Svg>
);

/** Calm mode. A single closed petal: quieter than the four-petal bloom. */
export const CalmIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 20.5c0-5 1.5-9 6.5-11.5 0 6-2.5 10-6.5 11.5Z" />
    <path d="M12 20.5C12 15.5 10.5 11.5 5.5 9c0 6 2.5 10 6.5 11.5Z" />
    <path d="M12 20.5v-3" />
  </Svg>
);
