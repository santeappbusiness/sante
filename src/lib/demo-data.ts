import type { DailyPlan, Movement, UserProfile } from "@/types/domain";

/**
 * Maya. Entirely fictional, and the only person a judge meets.
 *
 * Her self-reported context exists to make the story real. It is never used as
 * a clinical input and never referenced causally in generated copy: adaptations
 * talk about reported readiness, never about a condition.
 */
export const MAYA: UserProfile = {
  id: "demo-maya",
  display_name: "Maya",
  goal: "Stay consistent without forcing myself through bad days",
  preferred_minutes: 30,
  avoid_tags: ["jumping"],
  neurodivergent_mode: true,
  context:
    "Some days I have plenty in the tank and some days I do not. I want a plan that meets me where I am instead of one I keep failing.",
  is_demo: true,
};

/** The movement catalogue. The server filters this by the computed constraints
 *  and the model may only ever choose from what it is handed. */
export const MOVEMENTS: Movement[] = [
  {
    id: "mv_breath",
    name: "Slow breathing",
    intensity: "low",
    minutes: 3,
    tags: ["seated", "breathing", "quiet"],
    instructions: "Sit comfortably. Breathe in for four, out for six. Let your shoulders drop.",
  },
  {
    id: "mv_neck",
    name: "Neck and shoulder release",
    intensity: "low",
    minutes: 4,
    tags: ["seated", "quiet"],
    instructions: "Slowly tilt your head side to side. Roll your shoulders back a few times.",
  },
  {
    id: "mv_hips",
    name: "Seated hip opener",
    intensity: "low",
    minutes: 5,
    tags: ["seated", "floor_work"],
    instructions: "Cross one ankle over the opposite knee and lean forward gently.",
  },
  {
    id: "mv_walk",
    name: "Gentle walk in place",
    intensity: "low",
    minutes: 5,
    tags: ["standing"],
    instructions: "Walk on the spot at a pace where you could still hold a conversation.",
  },
  {
    id: "mv_stretch",
    name: "Full body stretch",
    intensity: "low",
    minutes: 6,
    tags: ["standing", "quiet"],
    instructions: "Reach up, then fold forward slowly. Stop wherever it stops feeling easy.",
  },
  {
    id: "mv_squat",
    name: "Bodyweight squats",
    intensity: "moderate",
    minutes: 6,
    tags: ["standing", "strength"],
    instructions: "Feet hip width apart. Sit back as if into a chair, then stand.",
  },
  {
    id: "mv_lunge",
    name: "Walking lunges",
    intensity: "moderate",
    minutes: 7,
    tags: ["standing", "strength"],
    instructions: "Step forward and lower your back knee towards the floor. Alternate sides.",
  },
  {
    id: "mv_core",
    name: "Core hold",
    intensity: "moderate",
    minutes: 5,
    tags: ["floor_work", "strength"],
    instructions: "Forearms and toes on the floor, body in a straight line. Breathe.",
  },
  {
    id: "mv_jumps",
    name: "Jump squats",
    intensity: "high",
    minutes: 6,
    tags: ["standing", "jumping", "strength"],
    instructions: "Squat, then jump. Land softly through the whole foot.",
  },
  {
    id: "mv_burpee",
    name: "Burpees",
    intensity: "high",
    minutes: 6,
    tags: ["standing", "jumping", "strength"],
    instructions: "Squat, hands down, step or jump back, stand up.",
  },
];

export function movementById(id: string): Movement | undefined {
  return MOVEMENTS.find((m) => m.id === id);
}

/** What Maya's plan says before she checks in. */
export const TODAYS_PLAN: DailyPlan = {
  id: "plan-demo-today",
  title: "Today's session",
  total_minutes: 35,
  intensity: "moderate",
  movements: [
    movementById("mv_walk")!,
    movementById("mv_squat")!,
    movementById("mv_lunge")!,
    movementById("mv_core")!,
    movementById("mv_jumps")!,
  ],
};

/* A deeper catalogue, so Explore has something real to show and the agent has
   genuine choices rather than the same five options every time. */
const MORE: Movement[] = [
  { id: "mv_cat_cow", name: "Cat cow", intensity: "low", minutes: 4, tags: ["floor_work", "quiet", "mobility"], instructions: "On hands and knees, arch and round your back slowly with your breath." },
  { id: "mv_ankle", name: "Ankle circles", intensity: "low", minutes: 3, tags: ["seated", "quiet", "mobility"], instructions: "Lift one foot and draw slow circles. Swap after a few." },
  { id: "mv_shoulder_roll", name: "Shoulder rolls", intensity: "low", minutes: 3, tags: ["standing", "quiet", "mobility"], instructions: "Roll your shoulders back, slow and wide. Let your arms hang." },
  { id: "mv_wall_push", name: "Wall push-ups", intensity: "low", minutes: 5, tags: ["standing", "strength"], instructions: "Hands on the wall, step back, bend and straighten your arms." },
  { id: "mv_side_bend", name: "Standing side bend", intensity: "low", minutes: 4, tags: ["standing", "quiet", "mobility"], instructions: "Reach one arm overhead and lean gently to the opposite side." },
  { id: "mv_legs_wall", name: "Legs up the wall", intensity: "low", minutes: 6, tags: ["floor_work", "quiet", "recovery"], instructions: "Lie down with your legs resting up a wall. Stay as long as it feels good." },
  { id: "mv_body_scan", name: "Body scan", intensity: "low", minutes: 5, tags: ["seated", "quiet", "breathing", "recovery"], instructions: "Move your attention slowly from your feet upward, without changing anything." },
  { id: "mv_glute_bridge", name: "Glute bridge", intensity: "moderate", minutes: 5, tags: ["floor_work", "strength"], instructions: "On your back, knees bent, lift your hips and lower slowly." },
  { id: "mv_row", name: "Band rows", intensity: "moderate", minutes: 6, tags: ["standing", "strength", "equipment"], instructions: "Anchor a band, pull your elbows back, squeeze between the shoulder blades." },
  { id: "mv_step_up", name: "Step ups", intensity: "moderate", minutes: 6, tags: ["standing", "strength"], instructions: "Step up onto a low step, one leg at a time, and back down." },
  { id: "mv_dead_bug", name: "Dead bug", intensity: "moderate", minutes: 5, tags: ["floor_work", "strength"], instructions: "On your back, extend the opposite arm and leg slowly, then swap." },
  { id: "mv_march", name: "Marching in place", intensity: "moderate", minutes: 5, tags: ["standing"], instructions: "Lift your knees at a pace you could still talk through." },
  { id: "mv_mountain", name: "Mountain climbers", intensity: "high", minutes: 5, tags: ["floor_work", "strength"], instructions: "In a plank, drive your knees toward your chest one at a time." },
  { id: "mv_skater", name: "Skater hops", intensity: "high", minutes: 5, tags: ["standing", "jumping"], instructions: "Bound side to side, landing softly on one leg." },
];

MOVEMENTS.push(...MORE);

/* Editorial collections. These are how Explore is organised: a point of view,
   not a filter dropdown pointed at the database. */
export type Collection = {
  id: string;
  title: string;
  blurb: string;
  accent: "moss" | "lavender" | "coral" | "slate";
  match: (m: Movement) => boolean;
};

export const COLLECTIONS: Collection[] = [
  {
    id: "low-energy",
    title: "Low energy days",
    blurb: "For when the tank is empty and you still want to move a little.",
    accent: "moss",
    match: (m) => m.intensity === "low" && m.minutes <= 5,
  },
  {
    id: "sensory-friendly",
    title: "Sensory friendly",
    blurb: "Quiet, still, and slow. Nothing that clatters or rushes.",
    accent: "lavender",
    match: (m) => m.tags.includes("quiet"),
  },
  {
    id: "five-minutes",
    title: "Five minutes",
    blurb: "Short enough that starting is the only hard part.",
    accent: "coral",
    match: (m) => m.minutes <= 4,
  },
  {
    id: "no-floor",
    title: "Nothing on the floor",
    blurb: "Standing and seated only, for days when getting down is not happening.",
    accent: "slate",
    match: (m) => !m.tags.includes("floor_work"),
  },
  {
    id: "gentle-strength",
    title: "Gentle strength",
    blurb: "Building something, without wringing yourself out.",
    accent: "moss",
    match: (m) => m.tags.includes("strength") && m.intensity !== "high",
  },
  {
    id: "recovery",
    title: "Recovery",
    blurb: "Rest with a shape to it.",
    accent: "lavender",
    match: (m) => m.tags.includes("recovery") || m.tags.includes("breathing"),
  },
];

export function collectionMovements(id: string): Movement[] {
  const c = COLLECTIONS.find((x) => x.id === id);
  return c ? MOVEMENTS.filter(c.match) : [];
}
