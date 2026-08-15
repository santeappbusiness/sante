import type { ReadinessCheckin } from "@/types/domain";

/**
 * The Santé Bloom.
 *
 * Four petals, one per thing we asked: energy, comfort, mood, sensory calm.
 * Each petal's size and fullness comes from that answer, so the shape of the
 * flower is the shape of the day.
 *
 * Deliberately NOT a score. There is no "your health is 73". The label is a
 * word, the four values stay visible underneath, and nothing here is a
 * measurement of a person.
 *
 * Accessibility: every petal has a text equivalent below, so no information
 * lives in colour or shape alone, and the whole thing is static when the
 * reader prefers reduced motion.
 */

export type BloomValues = {
  energy: number;
  comfort: number;
  mood: number;
  calm: number;
};

/** Discomfort and sensory load are "more is harder", so they flip: what we
 *  draw is how much room the person has, not how much is wrong. */
export function toBloom(checkin: ReadinessCheckin): BloomValues {
  return {
    energy: checkin.energy,
    comfort: 6 - checkin.discomfort,
    mood: checkin.mood,
    calm: 6 - checkin.sensory_load,
  };
}

export function capacityLabel(v: BloomValues): string {
  const avg = (v.energy + v.comfort + v.mood + v.calm) / 4;
  if (avg >= 4.2) return "Open";
  if (avg >= 3.2) return "Steady";
  if (avg >= 2.2) return "Low";
  return "Rest-oriented";
}

const PETALS: Array<{ key: keyof BloomValues; label: string; angle: number }> = [
  { key: "energy", label: "Energy", angle: 0 },
  { key: "comfort", label: "Comfort", angle: 90 },
  { key: "mood", label: "Mood", angle: 180 },
  { key: "calm", label: "Sensory calm", angle: 270 },
];

export default function CapacityBloom({
  values,
  size = 200,
  showLegend = true,
  quiet = false,
}: {
  values: BloomValues;
  size?: number;
  showLegend?: boolean;
  /** Simplified mode: less saturation, no motion, plainer shapes. */
  quiet?: boolean;
}) {
  const label = capacityLabel(values);

  return (
    <figure className="m-0 flex flex-col items-center">
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        role="img"
        aria-label={`Today's capacity: ${label}. Energy ${values.energy} of 5, comfort ${values.comfort} of 5, mood ${values.mood} of 5, sensory calm ${values.calm} of 5.`}
        className="overflow-visible"
      >
        {PETALS.map(({ key, angle }) => {
          const v = Math.max(1, Math.min(5, values[key]));
          /* A petal at 1 is small and faint; at 5 it is full and open. The
             range never reaches zero, because a hard day is still a day. */
          const reach = 26 + (v / 5) * 40;
          const width = 16 + (v / 5) * 20;
          const opacity = quiet ? 0.3 + (v / 5) * 0.25 : 0.35 + (v / 5) * 0.45;

          return (
            <ellipse
              key={key}
              cx="100"
              cy={100 - reach}
              rx={width}
              ry={reach}
              fill="var(--bloom-petal)"
              opacity={opacity}
              transform={`rotate(${angle} 100 100)`}
              style={
                quiet
                  ? undefined
                  : { transition: "all 600ms cubic-bezier(0.2, 0.8, 0.2, 1)" }
              }
            />
          );
        })}
        <circle cx="100" cy="100" r="13" fill="var(--bloom-center)" />
      </svg>

      <figcaption className="mt-2 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate">
          Today&rsquo;s capacity
        </p>
        <p className="font-display text-3xl leading-tight">{label}</p>
      </figcaption>

      {showLegend && (
        <dl className="mt-4 grid w-full max-w-xs grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
          {PETALS.map(({ key, label: petalLabel }) => (
            <div key={key} className="flex justify-between gap-2">
              <dt className="text-ink-soft">{petalLabel}</dt>
              <dd className="font-mono tabular-nums">{values[key]}/5</dd>
            </div>
          ))}
        </dl>
      )}
    </figure>
  );
}
