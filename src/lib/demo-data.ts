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
