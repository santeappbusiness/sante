import type { DailyPlan } from "@/types/domain";
import { MOVEMENTS, movementById } from "./demo-data";

/**
 * The week.
 *
 * Kept in the browser rather than the database: a weekly plan is scaffolding
 * for adaptation, and giving it a table mid-sprint would buy nothing the demo
 * can show. The shape here is the shape a table would take, so moving it later
 * is mechanical.
 */

export type DayKind = "session" | "recovery" | "rest";

export type PlannedDay = {
  day: string;
  kind: DayKind;
  title: string;
  minutes: number;
  intensity: DailyPlan["intensity"];
  movement_ids: string[];
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const KEY = "sante-week";

export function defaultWeek(): PlannedDay[] {
  return [
    { day: "Monday", kind: "session", title: "Lower body strength", minutes: 35, intensity: "moderate", movement_ids: ["mv_walk", "mv_squat", "mv_lunge", "mv_core", "mv_jumps"] },
    { day: "Tuesday", kind: "recovery", title: "Mobility and unwind", minutes: 15, intensity: "low", movement_ids: ["mv_cat_cow", "mv_side_bend", "mv_breath"] },
    { day: "Wednesday", kind: "session", title: "Full body", minutes: 30, intensity: "moderate", movement_ids: ["mv_march", "mv_glute_bridge", "mv_row", "mv_dead_bug"] },
    { day: "Thursday", kind: "rest", title: "Rest", minutes: 0, intensity: "low", movement_ids: [] },
    { day: "Friday", kind: "session", title: "Strength again", minutes: 30, intensity: "moderate", movement_ids: ["mv_step_up", "mv_wall_push", "mv_glute_bridge"] },
    { day: "Saturday", kind: "recovery", title: "Slow morning", minutes: 20, intensity: "low", movement_ids: ["mv_stretch", "mv_hips", "mv_legs_wall"] },
    { day: "Sunday", kind: "rest", title: "Rest", minutes: 0, intensity: "low", movement_ids: [] },
  ];
}

export function loadWeek(): PlannedDay[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return defaultWeek();
}

export function saveWeek(week: PlannedDay[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(week));
  } catch {}
}

export function todayName(): string {
  return DAYS[(new Date().getDay() + 6) % 7];
}

export function planMinutes(day: PlannedDay): number {
  return day.movement_ids.reduce((s, id) => s + (movementById(id)?.minutes ?? 0), 0) || day.minutes;
}

/**
 * A rebalance proposal, worked out in ordinary code.
 *
 * When today turns out much lighter than planned, the load has to go somewhere
 * or quietly vanish. This suggests where, and the user decides: nothing is
 * moved until they say so, because a calendar that rewrites itself is not a
 * helpful calendar.
 */
export type Rebalance = {
  from: string;
  to: string;
  movedMinutes: number;
  before: PlannedDay[];
  after: PlannedDay[];
};

export function proposeRebalance(
  week: PlannedDay[],
  today: string,
  actualMinutes: number
): Rebalance | null {
  const idx = week.findIndex((d) => d.day === today);
  if (idx === -1) return null;

  const planned = planMinutes(week[idx]);
  const shortfall = planned - actualMinutes;
  /* Not worth asking about a ten minute difference. */
  if (shortfall < 15) return null;

  /* The next rest or recovery day is where a heavier session can go without
     displacing something the person already committed to. */
  const targetIdx = week.findIndex(
    (d, i) => i > idx && (d.kind === "rest" || d.kind === "recovery")
  );
  if (targetIdx === -1) return null;

  const after = week.map((d) => ({ ...d }));
  after[idx] = { ...after[idx], title: "Adapted", minutes: actualMinutes, kind: "session" };
  after[targetIdx] = {
    ...after[targetIdx],
    kind: "session",
    title: week[idx].title,
    minutes: planned,
    intensity: week[idx].intensity,
    movement_ids: week[idx].movement_ids,
  };

  return {
    from: today,
    to: week[targetIdx].day,
    movedMinutes: planned,
    before: week,
    after,
  };
}

export const ALL_MOVEMENTS = MOVEMENTS;
