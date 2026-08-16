import Link from "next/link";
import type { Workout } from "@/lib/workouts";
import { Arch, Asterisk, Flower, Sprig, Waves } from "./BrandShapes";

/**
 * A workout, as the thing you choose.
 *
 * Three sizes because a grid of identical cards is what made Explore read as a
 * database. The featured size carries a motif and gets room to breathe; the
 * row is for lists where the title is doing the work.
 */

const MOTIFS = [Flower, Waves, Asterisk, Arch, Sprig];

const TINT: Record<string, string> = {
  low: "bg-moss/20",
  moderate: "bg-lavender/35",
  high: "bg-coral/15",
};

export function WorkoutCard({
  workout,
  size = "default",
  index = 0,
}: {
  workout: Workout;
  size?: "featured" | "default" | "row";
  index?: number;
}) {
  const Motif = MOTIFS[index % MOTIFS.length];

  if (size === "row") {
    return (
      <Link
        href={`/workout/${workout.id}`}
        className="flex items-center gap-4 rounded-2xl bg-surface p-4 ring-1 ring-ink/10 hover:ring-ink/25"
      >
        <span
          aria-hidden="true"
          className={
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl " +
            TINT[workout.intensity]
          }
        >
          <Motif size={22} id={workout.id} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-bold">{workout.title}</span>
          <span className="block font-mono text-xs text-slate">
            {workout.duration_minutes} min · {workout.intensity} · {workout.blocks.length} moves
          </span>
        </span>
      </Link>
    );
  }

  if (size === "featured") {
    return (
      <Link
        href={`/workout/${workout.id}`}
        className={
          "group relative block overflow-hidden rounded-[26px] p-7 sm:p-9 " +
          TINT[workout.intensity]
        }
      >
        <div aria-hidden="true" className="absolute -right-8 -top-8 text-ink/10">
          <Motif size={170} id={workout.id} />
        </div>
        <p className="relative font-mono text-xs uppercase tracking-[0.14em] text-slate">
          {workout.duration_minutes} min · {workout.intensity}
        </p>
        <h3 className="relative mt-2 font-display text-3xl leading-tight sm:text-4xl">
          {workout.title}
        </h3>
        <p className="relative mt-2 max-w-md text-ink-soft">{workout.description}</p>
        <p className="relative mt-5 font-mono text-xs text-slate">
          {workout.blocks.length} movements
          {workout.equipment.length > 0 && ` · ${workout.equipment.join(", ")}`}
        </p>
      </Link>
    );
  }

  return (
    <Link
      href={`/workout/${workout.id}`}
      className="group relative block overflow-hidden rounded-[22px] bg-surface p-5 ring-1 ring-ink/10 transition-shadow hover:shadow-[0_18px_44px_-30px_rgba(47,58,51,0.4)]"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.13em] text-slate">
          {workout.duration_minutes} min · {workout.intensity}
        </p>
        <span aria-hidden="true" className="shrink-0 text-moss/60">
          <Motif size={26} id={workout.id} />
        </span>
      </div>
      <h3 className="mt-2 font-display text-xl leading-tight">{workout.title}</h3>
      <p className="mt-1.5 line-clamp-2 text-sm text-ink-soft">{workout.description}</p>
      <p className="mt-3 font-mono text-xs text-slate">{workout.blocks.length} movements</p>
    </Link>
  );
}
