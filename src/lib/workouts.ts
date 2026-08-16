import type { DailyPlan, Intensity, Movement } from "@/types/domain";
import { movementById } from "./demo-data";

/**
 * Workouts, not exercises.
 *
 * The hierarchy is collection → workout → movements. Before this, a collection
 * called "Five Minutes" opened onto twenty-four individual movements adding up
 * to eighty minutes, which made Santé read as an exercise database rather than
 * something you could actually do today.
 *
 * A workout is the unit a person chooses, schedules, starts and finishes. The
 * movement library underneath it is infrastructure.
 */

export type WorkoutBlock = {
  movement_id: string;
  /** What this block asks for, in the language of the movement itself. */
  prescription: string;
  /** Seconds of rest after this block. Longer in low-intensity work, on purpose. */
  rest_seconds: number;
};

export type Workout = {
  id: string;
  title: string;
  description: string;
  collection_ids: string[];
  duration_minutes: number;
  intensity: Intensity;
  /** "home" | "gym" | "outdoors" | "desk" | "travel" */
  environment: string[];
  equipment: string[];
  sensory_load: "low" | "moderate" | "high";
  intent: string;
  blocks: WorkoutBlock[];
  featured?: boolean;
};

const b = (movement_id: string, prescription: string, rest_seconds = 30): WorkoutBlock => ({
  movement_id,
  prescription,
  rest_seconds,
});

export const WORKOUTS: Workout[] = [
  /* ---------------- Five minutes ---------------- */
  {
    id: "w_morning_reset",
    title: "Morning reset",
    description: "Wake the body up without asking much of it. Standing, quiet, no floor.",
    collection_ids: ["five-minutes", "slow-morning", "no-floor"],
    duration_minutes: 5,
    intensity: "low",
    environment: ["home"],
    equipment: [],
    sensory_load: "low",
    intent: "Start the day moving before the day starts asking things of you.",
    featured: true,
    blocks: [
      b("mv_shoulder_roll", "8 slow rolls back", 20),
      b("mv_side_bend", "4 each side, unhurried", 20),
      b("mv_ankle", "10 circles each way", 0),
    ],
  },
  {
    id: "w_desk_break",
    title: "Desk break",
    description: "For the middle of a working day, done beside your chair.",
    collection_ids: ["five-minutes", "desk-reset", "sensory-friendly", "no-floor"],
    duration_minutes: 5,
    intensity: "low",
    environment: ["desk", "home"],
    equipment: [],
    sensory_load: "low",
    intent: "Undo an hour of sitting without needing to change clothes.",
    blocks: [
      b("mv_neck_tilt", "Hold 20 seconds each side", 15),
      b("mv_thoracic", "5 turns each way", 15),
      b("mv_wrist", "10 circles each way", 0),
    ],
  },
  {
    id: "w_quiet_five",
    title: "Five quiet minutes",
    description: "Nothing that makes a sound. Suitable for a sleeping house.",
    collection_ids: ["five-minutes", "sensory-friendly", "quiet-movement", "recovery"],
    duration_minutes: 5,
    intensity: "low",
    environment: ["home", "travel"],
    equipment: [],
    sensory_load: "low",
    intent: "Move a little when the room has to stay still.",
    blocks: [
      b("mv_box_breath", "6 rounds", 15),
      b("mv_neck", "Slow, both directions", 15),
      b("mv_hum", "8 long exhales", 0),
    ],
  },

  /* ---------------- Low energy ---------------- */
  {
    id: "w_low_energy_flow",
    title: "Low energy flow",
    description: "Seated most of the way through. Built for the days you nearly skipped.",
    collection_ids: ["low-energy", "gentle-days", "sensory-friendly"],
    duration_minutes: 10,
    intensity: "low",
    environment: ["home"],
    equipment: [],
    sensory_load: "low",
    intent: "Keep the habit alive on a day with nothing spare.",
    featured: true,
    blocks: [
      b("mv_breath", "8 slow breaths", 20),
      b("mv_neck", "Both directions", 20),
      b("mv_hips", "Hold 45 seconds each side", 0),
    ],
  },
  {
    id: "w_gentle_mobility",
    title: "Gentle mobility",
    description: "Everything opens a little. Nothing gets pushed.",
    collection_ids: ["gentle-days", "mobility", "low-energy"],
    duration_minutes: 12,
    intensity: "low",
    environment: ["home"],
    equipment: ["mat"],
    sensory_load: "low",
    intent: "Move every joint once, gently.",
    blocks: [
      b("mv_cat_cow", "8 slow rounds", 20),
      b("mv_pelvic_tilt", "10 rocks", 20),
      b("mv_supine_twist", "1 minute each side", 20),
      b("mv_child", "Rest here", 0),
    ],
  },
  {
    id: "w_walk_in_place",
    title: "Easy walk in place",
    description: "Steady, conversational, no equipment and no coordination required.",
    collection_ids: ["low-energy", "gentle-days", "no-floor"],
    duration_minutes: 10,
    intensity: "low",
    environment: ["home", "travel"],
    equipment: [],
    sensory_load: "low",
    intent: "Get the blood moving with the lowest possible barrier.",
    blocks: [
      b("mv_walk", "5 minutes, easy pace", 30),
      b("mv_heel_raise", "12 slow raises", 20),
      b("mv_stretch", "Finish standing tall", 0),
    ],
  },

  /* ---------------- Recovery and evening ---------------- */
  {
    id: "w_evening_unwind",
    title: "Evening unwind",
    description: "The last thing before the day closes. Floor-based and slow.",
    collection_ids: ["recovery", "evening-unwind", "gentle-days", "quiet-movement"],
    duration_minutes: 10,
    intensity: "low",
    environment: ["home"],
    equipment: ["mat"],
    sensory_load: "low",
    intent: "Come down rather than wind up.",
    featured: true,
    blocks: [
      b("mv_legs_wall", "3 minutes", 20),
      b("mv_supine_twist", "1 minute each side", 20),
      b("mv_body_scan", "Finish lying still", 0),
    ],
  },
  {
    id: "w_quiet_recovery",
    title: "Quiet recovery",
    description: "Breathing and stillness, with just enough movement to count.",
    collection_ids: ["recovery", "sensory-friendly", "quiet-movement", "gentle-days"],
    duration_minutes: 8,
    intensity: "low",
    environment: ["home", "travel"],
    equipment: [],
    sensory_load: "low",
    intent: "Rest with a shape to it.",
    blocks: [
      b("mv_box_breath", "8 rounds", 20),
      b("mv_child", "2 minutes", 20),
      b("mv_body_scan", "Finish here", 0),
    ],
  },

  /* ---------------- Strength ---------------- */
  {
    id: "w_quiet_strength",
    title: "Quiet strength",
    description: "Real strength work with no jumping, no thudding and few transitions.",
    collection_ids: ["strength-home", "sensory-friendly", "no-equipment", "no-floor"],
    duration_minutes: 18,
    intensity: "moderate",
    environment: ["home", "travel"],
    equipment: [],
    sensory_load: "low",
    intent: "Build something without waking the flat downstairs.",
    featured: true,
    blocks: [
      b("mv_sit_stand", "10 reps", 45),
      b("mv_wall_push", "12 reps", 45),
      b("mv_wall_sit", "30 seconds", 45),
      b("mv_hip_hinge", "10 reps", 0),
    ],
  },
  {
    id: "w_lower_body",
    title: "Lower body strength",
    description: "Legs, properly. Dumbbells if you have them, bodyweight if not.",
    collection_ids: ["strength-home", "lower-body", "strong-day"],
    duration_minutes: 32,
    intensity: "moderate",
    environment: ["home", "gym"],
    equipment: ["dumbbells"],
    sensory_load: "moderate",
    intent: "A session that asks something of you.",
    blocks: [
      b("mv_march", "3 minutes to warm", 30),
      b("mv_squat", "12 reps", 60),
      b("mv_split_squat", "8 each side", 60),
      b("mv_deadlift", "10 reps", 60),
      b("mv_glute_bridge", "12 reps", 45),
      b("mv_calf_raise_w", "15 reps", 0),
    ],
  },
  {
    id: "w_upper_body",
    title: "Upper body strength",
    description: "Push, pull and press, with rest long enough to do them well.",
    collection_ids: ["strength-home", "upper-body", "strong-day"],
    duration_minutes: 28,
    intensity: "moderate",
    environment: ["home", "gym"],
    equipment: ["dumbbells", "bands"],
    sensory_load: "moderate",
    intent: "Strength above the waist.",
    blocks: [
      b("mv_shoulder_roll", "Warm up", 20),
      b("mv_wall_push", "12 reps", 60),
      b("mv_row", "12 reps", 60),
      b("mv_press", "10 reps", 60),
      b("mv_curl", "12 reps", 0),
    ],
  },
  {
    id: "w_full_body",
    title: "Strong day full body",
    description: "For the days there is plenty in the tank.",
    collection_ids: ["strong-day", "full-body", "strength-home"],
    duration_minutes: 30,
    intensity: "moderate",
    environment: ["home", "gym"],
    equipment: [],
    sensory_load: "moderate",
    intent: "Everything, once, with intent.",
    blocks: [
      b("mv_march", "3 minutes", 30),
      b("mv_squat", "12 reps", 45),
      b("mv_wall_push", "12 reps", 45),
      b("mv_step_up", "10 each side", 45),
      b("mv_dead_bug", "8 each side", 45),
      b("mv_core", "30 seconds", 0),
    ],
  },
  {
    id: "w_hotel_room",
    title: "Hotel room strength",
    description: "No equipment, small floor space, nothing that annoys the neighbours.",
    collection_ids: ["travel", "no-equipment", "strength-home", "sensory-friendly"],
    duration_minutes: 16,
    intensity: "moderate",
    environment: ["travel"],
    equipment: [],
    sensory_load: "low",
    intent: "Keep going while away from home.",
    blocks: [
      b("mv_sit_stand", "12 reps", 40),
      b("mv_wall_push", "12 reps", 40),
      b("mv_split_squat", "8 each side", 40),
      b("mv_bird_dog", "8 each side", 0),
    ],
  },
  {
    id: "w_core",
    title: "Core, without the crunches",
    description: "Slow, controlled, and nothing that strains the neck.",
    collection_ids: ["core", "strength-home", "mobility"],
    duration_minutes: 14,
    intensity: "moderate",
    environment: ["home"],
    equipment: ["mat"],
    sensory_load: "low",
    intent: "Steadiness through the middle.",
    blocks: [
      b("mv_dead_bug", "10 each side", 40),
      b("mv_bird_dog", "10 each side", 40),
      b("mv_side_plank", "20 seconds each side", 40),
      b("mv_glute_bridge", "12 reps", 0),
    ],
  },

  /* ---------------- Sensory friendly ---------------- */
  {
    id: "w_sensory_strength",
    title: "Sensory-friendly strength",
    description: "Three movements, long rests, and no switching between positions.",
    collection_ids: ["sensory-friendly", "strength-home", "quiet-movement"],
    duration_minutes: 15,
    intensity: "low",
    environment: ["home"],
    equipment: [],
    sensory_load: "low",
    intent: "Strength on a day when transitions are the hard part.",
    featured: true,
    blocks: [
      b("mv_sit_stand", "10 reps, slowly", 60),
      b("mv_wall_push", "10 reps", 60),
      b("mv_heel_raise", "12 reps", 0),
    ],
  },
  {
    id: "w_standing_stretch",
    title: "Standing stretch reset",
    description: "Everything done on your feet. Nothing to get down to or up from.",
    collection_ids: ["no-floor", "mobility", "gentle-days", "desk-reset"],
    duration_minutes: 9,
    intensity: "low",
    environment: ["home", "desk", "travel"],
    equipment: [],
    sensory_load: "low",
    intent: "Open up without touching the floor.",
    blocks: [
      b("mv_side_bend", "4 each side", 20),
      b("mv_chest_open", "45 seconds each side", 20),
      b("mv_calf", "45 seconds each side", 20),
      b("mv_hamstring", "45 seconds each side", 0),
    ],
  },

  /* ---------------- Mobility ---------------- */
  {
    id: "w_mobility_after_sitting",
    title: "Mobility after sitting",
    description: "Specifically for hips, back and shoulders after a long stretch in a chair.",
    collection_ids: ["mobility", "desk-reset", "gentle-days"],
    duration_minutes: 12,
    intensity: "low",
    environment: ["home", "desk"],
    equipment: ["mat"],
    sensory_load: "low",
    intent: "Undo the shape of the chair.",
    blocks: [
      b("mv_thoracic", "6 each way", 20),
      b("mv_hips", "1 minute each side", 20),
      b("mv_cat_cow", "8 rounds", 20),
      b("mv_chest_open", "45 seconds each side", 0),
    ],
  },
  {
    id: "w_full_mobility",
    title: "Full body mobility",
    description: "Every joint, once, in a sensible order.",
    collection_ids: ["mobility", "gentle-days", "recovery"],
    duration_minutes: 20,
    intensity: "low",
    environment: ["home"],
    equipment: ["mat"],
    sensory_load: "moderate",
    intent: "A proper mobility session rather than a warm-up.",
    blocks: [
      b("mv_shoulder_roll", "Warm", 20),
      b("mv_thoracic", "6 each way", 20),
      b("mv_cat_cow", "8 rounds", 20),
      b("mv_hips", "1 minute each side", 20),
      b("mv_hamstring", "45 seconds each side", 20),
      b("mv_supine_twist", "1 minute each side", 0),
    ],
  },

  /* ---------------- Higher intensity ---------------- */
  {
    id: "w_conditioning",
    title: "Short conditioning",
    description: "Gets the heart rate up. Includes impact, so it is not for every day.",
    collection_ids: ["strong-day", "full-body"],
    duration_minutes: 18,
    intensity: "high",
    environment: ["home", "gym"],
    equipment: [],
    sensory_load: "high",
    intent: "A hard twenty minutes when you want one.",
    blocks: [
      b("mv_march", "3 minutes", 30),
      b("mv_high_knee", "40 seconds", 40),
      b("mv_jack", "40 seconds", 40),
      b("mv_skater", "40 seconds", 40),
      b("mv_mountain", "40 seconds", 0),
    ],
  },
  {
    id: "w_low_impact_cardio",
    title: "Low impact cardio",
    description: "The same effect without anything leaving the ground.",
    collection_ids: ["no-floor", "full-body", "strength-home"],
    duration_minutes: 16,
    intensity: "moderate",
    environment: ["home"],
    equipment: [],
    sensory_load: "moderate",
    intent: "Work hard with quiet feet.",
    blocks: [
      b("mv_march", "4 minutes", 30),
      b("mv_lateral", "1 minute", 30),
      b("mv_squat_jump", "12 reps", 30),
      b("mv_step_up", "10 each side", 0),
    ],
  },

  /* ---------------- Gym ---------------- */
  {
    id: "w_gym_lower",
    title: "Gym lower body",
    description: "Built around what is usually free when the benches are busy.",
    collection_ids: ["gym", "lower-body", "strong-day"],
    duration_minutes: 35,
    intensity: "moderate",
    environment: ["gym"],
    equipment: ["dumbbells"],
    sensory_load: "high",
    intent: "A full gym session that does not need a rack.",
    blocks: [
      b("mv_march", "5 minutes to warm", 40),
      b("mv_deadlift", "10 reps", 75),
      b("mv_split_squat", "8 each side", 75),
      b("mv_glute_bridge", "12 reps", 60),
      b("mv_calf_raise_w", "15 reps", 0),
    ],
  },
  {
    id: "w_gym_upper",
    title: "Gym upper body",
    description: "Dumbbells and a band. Nothing that needs a queue.",
    collection_ids: ["gym", "upper-body", "strong-day"],
    duration_minutes: 30,
    intensity: "moderate",
    environment: ["gym"],
    equipment: ["dumbbells", "bands"],
    sensory_load: "high",
    intent: "Upper body without waiting for a machine.",
    blocks: [
      b("mv_shoulder_blade", "Warm", 30),
      b("mv_press", "10 reps", 75),
      b("mv_row", "12 reps", 75),
      b("mv_curl", "12 reps", 60),
      b("mv_side_plank", "20 seconds each side", 0),
    ],
  },
  {
    id: "w_breathing_mobility",
    title: "Breathing and mobility",
    description: "Half breath work, half slow movement.",
    collection_ids: ["recovery", "gentle-days", "sensory-friendly", "quiet-movement"],
    duration_minutes: 12,
    intensity: "low",
    environment: ["home"],
    equipment: [],
    sensory_load: "low",
    intent: "Settle the nervous system and the joints together.",
    blocks: [
      b("mv_box_breath", "6 rounds", 20),
      b("mv_neck_tilt", "30 seconds each side", 20),
      b("mv_thoracic", "6 each way", 20),
      b("mv_hum", "8 long exhales", 0),
    ],
  },
];

/* ------------------------------------------------------------------ *
 * Collections. Editorial groupings, each holding workouts.
 * ------------------------------------------------------------------ */

export type Collection = {
  id: string;
  title: string;
  blurb: string;
  accent: "moss" | "lavender" | "coral" | "slate";
};

export const COLLECTIONS: Collection[] = [
  { id: "five-minutes", title: "Five minutes", blurb: "Short enough that starting is the only hard part.", accent: "coral" },
  { id: "low-energy", title: "Low energy days", blurb: "For when the tank is empty and you still want to move.", accent: "moss" },
  { id: "gentle-days", title: "Gentle days", blurb: "Less load, on purpose, with nothing to prove.", accent: "lavender" },
  { id: "sensory-friendly", title: "Sensory friendly", blurb: "Quiet, still, few transitions, no surprises.", accent: "lavender" },
  { id: "quiet-movement", title: "Quiet movement", blurb: "Nothing that thuds. Suitable for a sleeping house.", accent: "slate" },
  { id: "no-floor", title: "Nothing on the floor", blurb: "Standing and seated only.", accent: "slate" },
  { id: "strength-home", title: "Strength at home", blurb: "Real strength work in a small space.", accent: "moss" },
  { id: "no-equipment", title: "No equipment", blurb: "Just you and the floor, or not even that.", accent: "moss" },
  { id: "mobility", title: "Mobility", blurb: "Move every joint once, properly.", accent: "lavender" },
  { id: "recovery", title: "Recovery", blurb: "Rest with a shape to it.", accent: "lavender" },
  { id: "strong-day", title: "Strong day", blurb: "For when there is plenty in the tank.", accent: "coral" },
  { id: "desk-reset", title: "Desk reset", blurb: "Done beside your chair, in what you are wearing.", accent: "slate" },
  { id: "slow-morning", title: "Slow morning", blurb: "Before the day starts asking things of you.", accent: "moss" },
  { id: "evening-unwind", title: "Evening unwind", blurb: "Come down rather than wind up.", accent: "lavender" },
  { id: "lower-body", title: "Lower body", blurb: "Legs, properly.", accent: "moss" },
  { id: "upper-body", title: "Upper body", blurb: "Push, pull, press.", accent: "moss" },
  { id: "full-body", title: "Full body", blurb: "Everything, once.", accent: "coral" },
  { id: "core", title: "Core", blurb: "Steadiness through the middle.", accent: "slate" },
  { id: "gym", title: "Gym", blurb: "Sessions that do not need a queue.", accent: "slate" },
  { id: "travel", title: "Travel", blurb: "A hotel room and no equipment.", accent: "moss" },
];

export function workoutById(id: string): Workout | undefined {
  return WORKOUTS.find((w) => w.id === id);
}

export function collectionById(id: string): Collection | undefined {
  return COLLECTIONS.find((c) => c.id === id);
}

export function workoutsInCollection(id: string): Workout[] {
  return WORKOUTS.filter((w) => w.collection_ids.includes(id));
}

/** The movements a workout is made of, resolved from the library. */
export function workoutMovements(w: Workout): Array<{ movement: Movement; block: WorkoutBlock }> {
  return w.blocks
    .map((block) => ({ movement: movementById(block.movement_id), block }))
    .filter((x): x is { movement: Movement; block: WorkoutBlock } => Boolean(x.movement));
}

/**
 * A chosen workout, as the plan the day is built from.
 *
 * The one bridge between the library and the adaptation. Both the minutes and
 * the intensity are read off the movements rather than off the workout's own
 * headline numbers, so the plan a person is shown is the plan the constraint
 * maths sees. Nothing here trusts a caller: the id is resolved against our own
 * catalogue, which is why the server takes a workout id and never a plan.
 */
export function workoutPlan(w: Workout): DailyPlan {
  const movements = workoutMovements(w).map(({ movement }) => movement);
  const rank = { low: 1, moderate: 2, high: 3 } as const;

  return {
    id: `plan-${w.id}`,
    title: w.title,
    total_minutes: movements.reduce((sum, m) => sum + m.minutes, 0),
    intensity: movements.reduce<Intensity>(
      (worst, m) => (rank[m.intensity] > rank[worst] ? m.intensity : worst),
      "low"
    ),
    movements,
  };
}

/** The same, from an id, or nothing if the id is not one of ours. */
export function planForWorkoutId(id: string | null | undefined): DailyPlan | null {
  if (!id) return null;
  const w = workoutById(id);
  return w ? workoutPlan(w) : null;
}

/**
 * What to offer someone, given what they have told us.
 *
 * Deterministic: this is filtering, and asking a model to do filtering would be
 * slower, less predictable, and no better.
 */
export function recommendWorkouts(opts: {
  avoidTags?: string[];
  preferredMinutes?: number;
  calm?: boolean;
  limit?: number;
}): Workout[] {
  const { avoidTags = [], preferredMinutes, calm, limit = 6 } = opts;

  const scored = WORKOUTS.map((w) => {
    let score = 0;
    const movements = workoutMovements(w).map((x) => x.movement);

    /* A workout containing something they avoid is not a recommendation. */
    if (movements.some((m) => m.tags.some((t) => avoidTags.includes(t)))) return null;

    if (preferredMinutes) {
      score -= Math.abs(w.duration_minutes - preferredMinutes) / 10;
    }
    if (calm) {
      if (w.sensory_load === "low") score += 2;
      if (w.blocks.length <= 3) score += 1;
    }
    if (w.featured) score += 0.5;

    return { w, score };
  }).filter((x): x is { w: Workout; score: number } => x !== null);

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.w);
}
