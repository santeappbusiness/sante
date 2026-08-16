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

/* The rest of the library.
 *
 * Each movement carries enough to be useful on its own: an instruction someone
 * can follow, tags the constraint engine understands, and a search term so the
 * question mark in the session leads somewhere real. Santé does not host video,
 * and pretending otherwise would be worse than linking out honestly.
 */
const LIBRARY: Movement[] = [
  { id: "mv_neck_tilt", name: "Neck tilts", intensity: "low", minutes: 3, tags: ["seated", "quiet", "mobility"], instructions: "Drop one ear toward your shoulder and wait. Swap sides." },
  { id: "mv_wrist", name: "Wrist circles", intensity: "low", minutes: 2, tags: ["seated", "quiet", "mobility"], instructions: "Slow circles both ways, then spread your fingers wide." },
  { id: "mv_thoracic", name: "Seated twist", intensity: "low", minutes: 4, tags: ["seated", "quiet", "mobility"], instructions: "Sit tall, turn gently to one side, hold, then the other." },
  { id: "mv_chest_open", name: "Doorway chest opener", intensity: "low", minutes: 3, tags: ["standing", "quiet", "mobility"], instructions: "Forearm on the door frame, turn away until you feel a stretch." },
  { id: "mv_calf", name: "Calf stretch", intensity: "low", minutes: 3, tags: ["standing", "quiet", "mobility"], instructions: "Step one foot back, heel down, lean into the front leg." },
  { id: "mv_hamstring", name: "Hamstring stretch", intensity: "low", minutes: 4, tags: ["standing", "quiet", "mobility"], instructions: "One heel forward, hinge at the hips until the back of the leg opens." },
  { id: "mv_child", name: "Child's pose", intensity: "low", minutes: 5, tags: ["floor_work", "quiet", "recovery"], instructions: "Knees wide, sit back toward your heels, let your arms rest forward." },
  { id: "mv_supine_twist", name: "Lying twist", intensity: "low", minutes: 5, tags: ["floor_work", "quiet", "recovery"], instructions: "On your back, drop both knees to one side and breathe." },
  { id: "mv_pelvic_tilt", name: "Pelvic tilts", intensity: "low", minutes: 4, tags: ["floor_work", "quiet", "mobility"], instructions: "On your back, knees bent, rock your pelvis slowly with your breath." },
  { id: "mv_box_breath", name: "Box breathing", intensity: "low", minutes: 4, tags: ["seated", "breathing", "quiet", "recovery"], instructions: "In for four, hold four, out for four, hold four." },
  { id: "mv_hum", name: "Long exhale", intensity: "low", minutes: 3, tags: ["seated", "breathing", "quiet", "recovery"], instructions: "Breathe in normally, then make the out-breath twice as long." },
  { id: "mv_shoulder_blade", name: "Shoulder blade squeeze", intensity: "low", minutes: 3, tags: ["seated", "quiet"], instructions: "Draw your shoulder blades together, hold a moment, release." },
  { id: "mv_heel_raise", name: "Heel raises", intensity: "low", minutes: 4, tags: ["standing"], instructions: "Rise onto your toes and lower slowly. Hold something if you need to." },
  { id: "mv_sit_stand", name: "Sit to stand", intensity: "low", minutes: 5, tags: ["standing", "strength"], instructions: "From a chair, stand and sit without using your hands if you can." },
  { id: "mv_wall_sit", name: "Wall sit", intensity: "moderate", minutes: 4, tags: ["standing", "strength"], instructions: "Back on the wall, slide down until your knees bend, hold." },
  { id: "mv_bird_dog", name: "Bird dog", intensity: "moderate", minutes: 5, tags: ["floor_work", "strength"], instructions: "On hands and knees, extend the opposite arm and leg, then swap." },
  { id: "mv_side_plank", name: "Side plank on knees", intensity: "moderate", minutes: 4, tags: ["floor_work", "strength"], instructions: "On your side, forearm down, knees bent, lift your hips." },
  { id: "mv_hip_hinge", name: "Hip hinge", intensity: "moderate", minutes: 5, tags: ["standing", "strength"], instructions: "Push your hips back with a long spine, then stand tall again." },
  { id: "mv_lateral", name: "Side steps", intensity: "moderate", minutes: 5, tags: ["standing"], instructions: "Step wide to one side and back, keeping your knees soft." },
  { id: "mv_press", name: "Overhead press", intensity: "moderate", minutes: 5, tags: ["standing", "strength", "equipment"], instructions: "Press weight overhead without arching your back, lower with control." },
  { id: "mv_curl", name: "Bicep curls", intensity: "moderate", minutes: 4, tags: ["standing", "strength", "equipment"], instructions: "Elbows at your sides, curl up, lower slowly." },
  { id: "mv_deadlift", name: "Romanian deadlift", intensity: "moderate", minutes: 6, tags: ["standing", "strength", "equipment"], instructions: "Hinge at the hips with a flat back, weight close to your legs." },
  { id: "mv_split_squat", name: "Split squat", intensity: "moderate", minutes: 6, tags: ["standing", "strength"], instructions: "One foot forward, lower the back knee toward the floor." },
  { id: "mv_calf_raise_w", name: "Weighted calf raise", intensity: "moderate", minutes: 4, tags: ["standing", "strength", "equipment"], instructions: "Rise onto your toes holding weight, pause at the top." },
  { id: "mv_plank_shoulder", name: "Plank shoulder taps", intensity: "high", minutes: 4, tags: ["floor_work", "strength"], instructions: "In a plank, tap the opposite shoulder without rocking your hips." },
  { id: "mv_squat_jump", name: "Squat to toe raise", intensity: "moderate", minutes: 5, tags: ["standing", "strength"], instructions: "Squat, then rise all the way onto your toes. No jump needed." },
  { id: "mv_high_knee", name: "High knees", intensity: "high", minutes: 4, tags: ["standing", "jumping"], instructions: "Drive your knees up at a pace you can sustain." },
  { id: "mv_jack", name: "Star jumps", intensity: "high", minutes: 4, tags: ["standing", "jumping"], instructions: "Jump your feet wide and arms overhead, then back." },
  { id: "mv_burpee_step", name: "Step-back burpee", intensity: "high", minutes: 6, tags: ["floor_work", "strength"], instructions: "Hands down, step back one foot at a time, step in, stand." },
  { id: "mv_sprint", name: "Fast marching", intensity: "high", minutes: 5, tags: ["standing"], instructions: "March hard on the spot, arms driving, for short bursts." },
];

MOVEMENTS.push(...LIBRARY);

/** What Maya's plan says before she checks in. */
/**
 * The session Maya intended to do today.
 *
 * Both numbers are computed from the movements rather than written down. They
 * used to be typed by hand and said 35 minutes at moderate over a list that
 * came to 29 and contained a high intensity movement, so every adaptation
 * reported a six minute reduction that had not happened, and the fallback
 * described easy sessions as high because it read the day's ceiling. A plan
 * that misreports itself makes the whole before and after untrustworthy, which
 * is the one thing this product is selling.
 *
 * Jump squats are gone as well. Maya's saved preferences say she avoids
 * jumping, so a baseline plan built around something she never does was a
 * contradiction sitting in the demo's first screen.
 */
const TODAYS_MOVEMENTS: Movement[] = [
  movementById("mv_walk")!,
  movementById("mv_lunge")!,
  movementById("mv_squat")!,
  movementById("mv_step_up")!,
  movementById("mv_stretch")!,
];

const INTENSITY_RANK = { low: 1, moderate: 2, high: 3 } as const;

export const TODAYS_PLAN: DailyPlan = {
  id: "plan-demo-today",
  title: "Today's session",
  total_minutes: TODAYS_MOVEMENTS.reduce((sum, m) => sum + m.minutes, 0),
  intensity: TODAYS_MOVEMENTS.reduce<Movement["intensity"]>(
    (worst, m) => (INTENSITY_RANK[m.intensity] > INTENSITY_RANK[worst] ? m.intensity : worst),
    "low"
  ),
  movements: TODAYS_MOVEMENTS,
};

/**
 * The only tags the "anything else going on today" answers can produce.
 *
 * Deliberately much narrower than the catalogue vocabulary. Symptoms map to
 * exactly these two, so accepting anything wider means accepting tags the
 * feature cannot generate, and ten of those in one request body exclude the
 * entire catalogue. Two tags cannot empty a pool, whatever is sent.
 */
export const CONTEXT_TAGS: readonly string[] = ["jumping", "floor_work"];

/** Where the question mark in a session goes. Santé does not host video, so it
 *  sends people somewhere they can actually watch the movement done properly. */
export function howToUrl(m: Movement): string {
  return `https://www.google.com/search?q=${encodeURIComponent("how to do " + m.name + " exercise form")}`;
}
