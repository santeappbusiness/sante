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
  /* 1. Red-flag gate. Runs before anything else and cannot be overridden.

     The zeroes matter as much as the flag does. These constraints used to
     describe a five minute, one movement session, which meant any caller that
     forgot to read `blocked` would quietly build one for a person reporting
     chest pain. A blocked day now describes nothing buildable, so forgetting
     the check produces an empty pool and a thrown error rather than a plan. */
  if (checkin.red_flags.length > 0) {
    return {
      score: 0,
      blocked: true,
      block_reason: RED_FLAG_MESSAGE,
      max_intensity: "low",
      target_minutes: 0,
      max_movements: 0,
      excluded_tags: [],
      prefer_quiet: profile.neurodivergent_mode,
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

  /* Calm mode, as a constraint rather than a request.
     It used to be a single line appended to the model's prompt, which meant it
     was a preference the model could ignore, the validator had nothing to check
     it against, and the fallback path ignored it completely. Here it binds:
     fewer transitions to hold in your head, nothing that lands hard, and quiet
     options preferred over equally permitted noisy ones.

     Deliberately not a shorter session. Calm mode is about load, not duration,
     and a long quiet session can be exactly right. */
  if (profile.neurodivergent_mode) {
    max_movements = Math.min(max_movements, 3);
    if (!excluded_tags.includes("jumping")) excluded_tags.push("jumping");
    /* A fragment, like every other driver. Written as a full clause it read as
       "you use calm mode, so this keeps to fewer movements, so today is 17
        minutes", because callers join drivers into a sentence with their own
       "so". */
    drivers.push("you use calm mode");
  }

  /* Say so when someone reports a good day. Without this the only sentence the
     model ever sees is a flat "feeling steady", and it plays safe by trimming a
     session that did not need trimming. A good day is information too. */
  if (score >= 70) {
    drivers.push("you reported good energy and little discomfort");
  } else if (drivers.length === 0) {
    drivers.push("you reported feeling steady today");
  }

  return {
    score,
    blocked: false,
    max_intensity,
    target_minutes: clamp(target_minutes, 5, 60),
    max_movements: clamp(max_movements, 1, 8),
    excluded_tags,
    prefer_quiet: profile.neurodivergent_mode,
    drivers,
  };
}

/** The candidates the model is allowed to choose from. Filtering happens here,
 *  so an out-of-bounds movement is impossible rather than merely discouraged. */
export function allowedMovements(result: ReadinessResult): Movement[] {
  /* Nothing is permitted on a blocked day. Returning the low intensity
     catalogue here is what would let a missed `blocked` check downstream find
     something to build with. */
  if (result.blocked) return [];

  const rank = { low: 1, moderate: 2, high: 3 } as const;
  const pool = MOVEMENTS.filter(
    (m) =>
      rank[m.intensity] <= rank[result.max_intensity] &&
      !m.tags.some((t) => result.excluded_tags.includes(t))
  );

  /* In calm mode the quiet options come first. The model sees this list in
     order and the fallback walks it in order, so the preference costs nothing
     and takes effect on both paths. Nothing is removed: a quiet day is still
     allowed to include something demanding if that is what fits.

     Longest first inside each group, because calm mode caps how many movements
     someone has to hold in their head, not how long they are allowed to move.
     Taking the three shortest quiet options turned a thirty minute allowance
     into thirteen minutes, which is the trimming nobody asked for. */
  if (!result.prefer_quiet) return pool;
  return [...pool].sort(
    (a, b) => Number(isQuiet(b)) - Number(isQuiet(a)) || b.minutes - a.minutes
  );
}

function isQuiet(m: Movement): boolean {
  return m.tags.includes("quiet") || m.tags.includes("breathing");
}

/**
 * The plan we produce when the model fails, times out, or returns something
 * invalid. The app has to work with the AI switched off, and this is how.
 */
export function fallbackPlan(result: ReadinessResult, original: DailyPlan): DailyPlan {
  /* The route returns before it reaches this on a blocked day. If that ever
     stops being true, fail loudly here rather than handing back a session with
     a reassuring sentence attached to it. */
  if (result.blocked) {
    throw new Error("fallbackPlan called on a blocked readiness result");
  }

  const pool = allowedMovements(result);
  const picked: Movement[] = [];
  let minutes = 0;

  /* Prefer movements already in today's plan, so the adaptation still feels
     like the same session rather than a different one. In calm mode that is
     the wrong instinct: keeping the familiar noisy movement is exactly what
     someone asked us not to do, so the pool's quiet-first order stands. */
  const preferred = result.prefer_quiet
    ? pool
    : [
        ...pool.filter((m) => original.movements.some((o) => o.id === m.id)),
        ...pool.filter((m) => !original.movements.some((o) => o.id === m.id)),
      ];

  for (const m of preferred) {
    if (picked.length >= result.max_movements) break;
    if (minutes + m.minutes > result.target_minutes && picked.length > 0) continue;
    picked.push(m);
    minutes += m.minutes;
  }

  /* Nothing fitted inside the target, so take one anyway rather than hand back
     an empty session. Gated on max_movements because a day that allows no
     movements must not be rescued into allowing one. */
  if (picked.length === 0 && pool.length > 0 && result.max_movements > 0) {
    picked.push(pool[0]);
    minutes = pool[0].minutes;
  }

  /* An unblocked day that produces no movements is not a session, and shipping
     it means a person sees "0 min" under a heading that promises a plan. It
     happens when the excluded tags between them rule out the whole catalogue.
     Callers cannot reach this with valid input any more, and if that stops
     being true this should surface rather than render. */
  if (picked.length === 0) {
    throw new Error(
      `no movement satisfies today's constraints (max_intensity=${result.max_intensity}, excluded=${result.excluded_tags.join(",") || "none"})`
    );
  }

  /* What was picked, not what was permitted. Reporting the ceiling meant a
     fallback of walking and stretches described itself as "high" whenever the
     day allowed high, so the plan a person read did not match the plan they
     were given. */
  const rank = { low: 1, moderate: 2, high: 3 } as const;
  const intensity = picked.reduce<Movement["intensity"]>(
    (worst, m) => (rank[m.intensity] > rank[worst] ? m.intensity : worst),
    "low"
  );

  return {
    id: "adapted-fallback",
    title: "Adapted for today",
    total_minutes: minutes,
    intensity,
    movements: picked,
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
