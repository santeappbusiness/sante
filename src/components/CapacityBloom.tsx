import type { ReadinessCheckin } from "@/types/domain";

/**
 * The Santé Bloom.
 *
 * Four petals, one per thing we asked. Each petal's length and width come from
 * that answer, so the shape of the flower is the shape of the day.
 *
 * The petals are drawn as real petal paths radiating from the centre, not
 * overlapping ellipses: ellipses centred on the middle cross each other and
 * read as a smudge rather than a bloom.
 *
 * Deliberately not a score. The label is a word, the four values stay written
 * out underneath, and nothing here is a measurement of a person.
 */

export type BloomValues = {
  energy: number;
  comfort: number;
  mood: number;
  calm: number;
};

/** Discomfort and sensory load are "more is harder", so they flip: what we draw
 *  is how much room someone has, not how much is wrong. */
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

/**
 * One petal, growing upward from the centre.
 *
 * `reach` is how far it extends, `spread` how wide it opens. Both come from the
 * answer, so a low day makes a small tight bloom and a good day a broad open
 * one, and the silhouette differs at a glance rather than only in opacity.
 */
function petalPath(reach: number, spread: number): string {
  const tip = 100 - reach;
  const waist = 100 - reach * 0.45;
  return [
    `M 100 100`,
    `C ${100 - spread} ${waist}, ${100 - spread * 0.72} ${tip + reach * 0.16}, 100 ${tip}`,
    `C ${100 + spread * 0.72} ${tip + reach * 0.16}, ${100 + spread} ${waist}, 100 100`,
    `Z`,
  ].join(" ");
}

export default function CapacityBloom({
  values,
  size = 200,
  showLegend = true,
  quiet = false,
}: {
  values: BloomValues;
  size?: number;
  showLegend?: boolean;
  /** Simplified mode: less saturation, no motion. */
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
          /* Never reaches zero: a hard day is still a day. */
          const reach = 30 + (v / 5) * 52;
          const spread = 20 + (v / 5) * 22;
          const opacity = quiet ? 0.42 + (v / 5) * 0.2 : 0.5 + (v / 5) * 0.35;

          return (
            <path
              key={key}
              d={petalPath(reach, spread)}
              fill="var(--bloom-petal)"
              opacity={opacity}
              transform={`rotate(${angle} 100 100)`}
              style={
                quiet
                  ? undefined
                  : { transition: "d 600ms cubic-bezier(0.2,0.8,0.2,1), opacity 600ms" }
              }
            />
          );
        })}

        {/* The centre sits on top of where the petals meet, so the joins read as
            a flower rather than as four shapes overlapping. */}
        <circle cx="100" cy="100" r="15" fill="var(--bloom-center)" />
        <circle cx="100" cy="100" r="6" fill="var(--bloom-petal)" opacity="0.55" />
      </svg>

      <figcaption className="mt-3 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate">
          Today&rsquo;s capacity
        </p>
        <p className="font-display text-3xl leading-tight">{label}</p>
      </figcaption>

      {showLegend && (
        <dl className="mt-5 grid w-full max-w-xs grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {PETALS.map(({ key, label: petalLabel }) => (
            <div key={key} className="flex items-center justify-between gap-2">
              <dt className="text-ink-soft">{petalLabel}</dt>
              <dd className="flex items-center gap-1.5">
                <span className="font-mono tabular-nums">{values[key]}</span>
                <span aria-hidden="true" className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span
                      key={n}
                      className={
                        "h-1.5 w-1.5 rounded-full " +
                        (n <= values[key] ? "bg-moss-deep" : "bg-ink/15")
                      }
                    />
                  ))}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      )}
    </figure>
  );
}
