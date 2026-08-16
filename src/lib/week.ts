import type { DailyPlan } from "@/types/domain";
import { movementById } from "./demo-data";
import { readScoped, writeScoped } from "./identity";
import type { Workout } from "./workouts";

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
  /** Set when the day came from a workout in the library. */
  workout_id?: string;
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const KEY = "week";

export function defaultWeek(): PlannedDay[] {
  return [
    { day: "Monday", kind: "session", title: "Lower body strength", minutes: 30, intensity: "moderate", movement_ids: ["mv_walk", "mv_lunge", "mv_squat", "mv_step_up", "mv_stretch"] },
    { day: "Tuesday", kind: "recovery", title: "Mobility and unwind", minutes: 15, intensity: "low", movement_ids: ["mv_cat_cow", "mv_side_bend", "mv_breath"] },
    { day: "Wednesday", kind: "session", title: "Full body", minutes: 30, intensity: "moderate", movement_ids: ["mv_march", "mv_glute_bridge", "mv_row", "mv_dead_bug"] },
    { day: "Thursday", kind: "rest", title: "Rest", minutes: 0, intensity: "low", movement_ids: [] },
    { day: "Friday", kind: "session", title: "Strength again", minutes: 30, intensity: "moderate", movement_ids: ["mv_step_up", "mv_wall_push", "mv_glute_bridge"] },
    { day: "Saturday", kind: "recovery", title: "Slow morning", minutes: 20, intensity: "low", movement_ids: ["mv_stretch", "mv_hips", "mv_legs_wall"] },
    { day: "Sunday", kind: "rest", title: "Rest", minutes: 0, intensity: "low", movement_ids: [] },
  ];
}

/**
 * A week nobody has planned yet.
 *
 * What a new account should see. Maya's `defaultWeek` used to be the fallback
 * for everyone, so a person who signed up an hour ago opened a full week of
 * sessions she had never chosen, attributed to her. Seven rest days is not a
 * placeholder: it is the truthful answer, and Progress already treats rest as
 * a day rather than a gap.
 */
export function emptyWeek(): PlannedDay[] {
  return DAYS.map((day) => ({
    day,
    kind: "rest" as DayKind,
    title: "Nothing planned",
    minutes: 0,
    intensity: "low" as DailyPlan["intensity"],
    movement_ids: [],
  }));
}

/** True when not one day has anything on it. */
export function isWeekEmpty(week: PlannedDay[]): boolean {
  return week.every((d) => d.movement_ids.length === 0 && d.kind === "rest");
}

/**
 * This identity's week.
 *
 * The demo falls back to Maya's, because the demo is Maya and her story needs
 * a past. Everyone else falls back to nothing, because they have not planned
 * anything and the app should not pretend otherwise.
 */
export function loadWeek(identityId: string | null, isDemo = false): PlannedDay[] {
  return readScoped<PlannedDay[] | null>(KEY, identityId, null) ?? (isDemo ? defaultWeek() : emptyWeek());
}

export function saveWeek(week: PlannedDay[], identityId: string | null) {
  writeScoped(KEY, identityId, week);
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

/** Clear a day back to rest. */
export function clearDay(day: string, identityId: string | null, isDemo = false): PlannedDay[] {
  const week = loadWeek(identityId, isDemo).map((d) =>
    d.day === day
      ? { ...d, kind: "rest" as DayKind, title: "Rest", minutes: 0, movement_ids: [], workout_id: undefined }
      : d
  );
  saveWeek(week, identityId);
  return week;
}

/** Move whatever is on one day to another, swapping if the target is taken. */
export function moveDay(
  from: string,
  to: string,
  identityId: string | null,
  isDemo = false
): PlannedDay[] {
  const week = loadWeek(identityId, isDemo);
  const a = week.findIndex((d) => d.day === from);
  const b = week.findIndex((d) => d.day === to);
  if (a === -1 || b === -1) return week;

  const next = week.map((d) => ({ ...d }));
  const carried = { ...next[a], day: next[b].day };
  const displaced = { ...next[b], day: next[a].day };
  next[b] = carried;
  next[a] = displaced;
  saveWeek(next, identityId);
  return next;
}

/** Set a day's type without changing what is on it. */
export function setDayKind(
  day: string,
  kind: DayKind,
  identityId: string | null,
  isDemo = false
): PlannedDay[] {
  const week = loadWeek(identityId, isDemo).map((d) =>
    d.day === day
      ? {
          ...d,
          kind,
          title: kind === "rest" ? "Rest" : kind === "recovery" ? "Recovery" : d.title,
          movement_ids: kind === "rest" ? [] : d.movement_ids,
          minutes: kind === "rest" ? 0 : d.minutes,
        }
      : d
  );
  saveWeek(week, identityId);
  return week;
}

/** Schedule a workout onto a day. Returns the updated week. */
export function addToDay(
  day: string,
  workout: Workout,
  identityId: string | null,
  isDemo = false
): PlannedDay[] {
  const week = loadWeek(identityId, isDemo).map((d) =>
    d.day === day
      ? {
          ...d,
          kind: "session" as DayKind,
          title: workout.title,
          minutes: workout.duration_minutes,
          intensity: workout.intensity,
          workout_id: workout.id,
          movement_ids: workout.blocks.map((b) => b.movement_id),
        }
      : d
  );
  saveWeek(week, identityId);
  return week;
}

