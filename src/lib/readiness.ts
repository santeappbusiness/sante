import type {
  DailyPlan,
  Movement,
  ReadinessCheckin,
  ReadinessResult,
  UserProfile,
} from "@/types/domain";
import { MOVEMENTS } from "./demo-data";

/**
 * Deterministic. No model involved anywhere in this file.
 *
 * This is the safety boundary: the red-flag gate and the constraints are
 * computed here, in our own code, and the model personalises inside limits it
 * cannot widen. If this file says 12 minutes and low intensity, nothing
 * downstream can produce 30 minutes and moderate.
 */

const RED_FLAG_MESSAGE =
  "Some of what you reported is worth speaking to a health professional about, so we are not suggesting a session today. Rest is a reasonable choice right now.";

export function computeReadiness(
  checkin: ReadinessCheckin,
  profile: UserProfile,
  plan: DailyPlan
): ReadinessResult {
  /* 1. Red-flag gate. Runs before anything else and cannot be overridden. */
  if (checkin.red_flags.length > 0) {
    return {
      score: 0,
      blocked: true,
      block_reason: RED_FLAG_MESSAGE,
      max_intensity: "low",
      target_minutes: 5,
      max_movements: 1,
      excluded_tags: [],
      drivers: [],
    };
  }

  /* 2. Capacity score. Energy and mood help, discomfort and sensory load cost.
     Deliberately simple and explainable: a judge can follow it in one read. */
  const capacity =
    (checkin.energy - 1) / 4 * 0.35 +
    (5 - checkin.discomfort) / 4 * 0.35 +
    (checkin.mood - 1) / 4 * 0.15 +
    (5 - checkin.sensory_load) / 4 * 0.15;

  const score = Math.round(capacity * 100);

  /* 3. Constraints derived from the score, then tightened by specifics. */
  let max_intensity: ReadinessResult["max_intensity"] =
    score >= 70 ? "high" : score >= 45 ? "moderate" : "low";

  let target_minutes = Math.round((plan.total_minutes * (0.25 + capacity * 0.75)) / 5) * 5;
  target_minutes = clamp(target_minutes, 5, plan.total_minutes);

  /* A remembered preference is a ceiling, never a floor. If someone told us
     that days like this should start around ten minutes, today does not come
     back longer than that just because the arithmetic says it could. */
  if (profile.preferred_minutes) {
    target_minutes = Math.min(target_minutes, profile.preferred_minutes);
  }

  let max_movements = score >= 70 ? plan.movements.length : score >= 45 ? 4 : 3;

  const excluded_tags = [...profile.avoid_tags];
  const drivers: string[] = [];

  if (checkin.energy <= 2) {
    drivers.push("you reported low energy");
    if (max_intensity === "high") max_intensity = "moderate";
  }

  if (checkin.discomfort >= 4) {
    drivers.push("you reported high discomfort");
    max_intensity = "low";
    if (!excluded_tags.includes("jumping")) excluded_tags.push("jumping");
    target_minutes = Math.min(target_minutes, 15);
  }

  if (checkin.mood <= 2) {
    drivers.push("you reported low mood");
    max_movements = Math.min(max_movements, 3);
  }

  if (checkin.sensory_load >= 4) {
    drivers.push("you reported high sensory load");
    max_movements = Math.min(max_movements, 3);
    if (!excluded_tags.includes("jumping")) excluded_tags.push("jumping");
  }

  if (drivers.length === 0) drivers.push("you reported feeling steady today");

  return {
    score,
    blocked: false,
    max_intensity,
    target_minutes: clamp(target_minutes, 5, 60),
    max_movements: clamp(max_movements, 1, 8),
    excluded_tags,
    drivers,
  };
}

/** The candidates the model is allowed to choose from. Filtering happens here,
 *  so an out-of-bounds movement is impossible rather than merely discouraged. */
export function allowedMovements(result: ReadinessResult): Movement[] {
  const rank = { low: 1, moderate: 2, high: 3 } as const;
  return MOVEMENTS.filter(
    (m) =>
      rank[m.intensity] <= rank[result.max_intensity] &&
      !m.tags.some((t) => result.excluded_tags.includes(t))
  );
}

/**
 * The plan we produce when the model fails, times out, or returns something
 * invalid. The app has to work with the AI switched off, and this is how.
 */
export function fallbackPlan(result: ReadinessResult, original: DailyPlan): DailyPlan {
  const pool = allowedMovements(result);
  const picked: Movement[] = [];
  let minutes = 0;

  /* Prefer movements already in today's plan, so the adaptation still feels
     like the same session rather than a different one. */
  const preferred = [
    ...pool.filter((m) => original.movements.some((o) => o.id === m.id)),
    ...pool.filter((m) => !original.movements.some((o) => o.id === m.id)),
  ];

  for (const m of preferred) {
    if (picked.length >= result.max_movements) break;
    if (minutes + m.minutes > result.target_minutes && picked.length > 0) continue;
    picked.push(m);
    minutes += m.minutes;
  }

  if (picked.length === 0 && pool.length > 0) {
    picked.push(pool[0]);
    minutes = pool[0].minutes;
  }

  return {
    id: "adapted-fallback",
    title: "Adapted for today",
    total_minutes: minutes,
    intensity: result.max_intensity,
    movements: picked,
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
