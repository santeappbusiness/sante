import { getSupabaseAdmin } from "./supabase/server";
import { TODAYS_PLAN, movementById } from "./demo-data";
import { workoutById } from "./workouts";

/**
 * Give the demo a past.
 *
 * An empty account is an honest place for a real new user to start, and a
 * terrible place for a judge to land. Maya arrives with a fortnight behind her:
 * check-ins, adaptations she accepted, one day she rested, and feedback that
 * explains why her remembered session length is what it is.
 *
 * All of it is written server-side with the service-role key, because the
 * client has no permission to write check-ins or adaptations and should not.
 * Nothing here is invented for a real signed-up account.
 */

type SeedDay = {
  daysAgo: number;
  energy: number;
  discomfort: number;
  mood: number;
  sensory: number;
  workoutId: string;
  adaptedMinutes: number;
  reasons: string[];
  verdict?: "too_much" | "just_right" | "could_do_more";
  source?: "llm" | "fallback";
};

/* A fortnight that tells a story: a couple of good days, a rough stretch in the
   middle where sessions got shorter, and feedback that led somewhere. */
const STORY: SeedDay[] = [
  {
    daysAgo: 12, energy: 4, discomfort: 2, mood: 4, sensory: 2,
    workoutId: "w_lower_body", adaptedMinutes: 28,
    reasons: ["You reported good energy, so this stayed close to the full session."],
    verdict: "just_right",
  },
  {
    daysAgo: 10, energy: 3, discomfort: 3, mood: 3, sensory: 3,
    workoutId: "w_full_body", adaptedMinutes: 22,
    reasons: ["You reported a steady day, so we trimmed the session slightly."],
    verdict: "just_right",
  },
  {
    daysAgo: 8, energy: 2, discomfort: 4, mood: 2, sensory: 4,
    workoutId: "w_quiet_strength", adaptedMinutes: 12,
    reasons: [
      "You reported low energy and high discomfort, so the session is shorter and low intensity.",
      "You reported high sensory load, so you have mostly seated, quiet options.",
    ],
    verdict: "too_much",
  },
  {
    daysAgo: 6, energy: 2, discomfort: 4, mood: 3, sensory: 4,
    workoutId: "w_low_energy_flow", adaptedMinutes: 10,
    reasons: [
      "You reported low energy again, so we started shorter than last time.",
      "You said the last one was still too much, so this one asks less.",
    ],
    verdict: "too_much",
  },
  {
    daysAgo: 5, energy: 1, discomfort: 4, mood: 2, sensory: 5,
    workoutId: "w_quiet_recovery", adaptedMinutes: 8,
    reasons: ["You reported very little energy, so today is recovery rather than training."],
    source: "fallback",
    verdict: "just_right",
  },
  {
    daysAgo: 3, energy: 3, discomfort: 2, mood: 4, sensory: 2,
    workoutId: "w_gentle_mobility", adaptedMinutes: 12,
    reasons: ["You reported feeling steadier, so this opens things up gently."],
    verdict: "just_right",
  },
  {
    daysAgo: 1, energy: 4, discomfort: 1, mood: 4, sensory: 2,
    workoutId: "w_upper_body", adaptedMinutes: 24,
    reasons: [
      "You reported good energy and little discomfort, so we kept most of the session.",
      "We start closer to your remembered length rather than the original plan.",
    ],
    verdict: "could_do_more",
  },
];

function at(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(8 + (daysAgo % 6), 15, 0, 0);
  return d.toISOString();
}

/* Two requests can arrive close enough together that both see an empty history
   and both seed it, which is how the demo ended up with a fortnight twice over.
   The counting check still runs; this stops the pair that race past it. */
const seeding = new Set<string>();

export async function seedDemoHistory(profileId: string): Promise<boolean> {
  const admin = getSupabaseAdmin();
  if (!admin) return false;
  if (seeding.has(profileId)) return false;
  seeding.add(profileId);

  try {
    return await seed(admin, profileId);
  } finally {
    seeding.delete(profileId);
  }
}

async function seed(
  admin: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  profileId: string
): Promise<boolean> {
  /* Only ever once per demo identity. */
  const { count } = await admin
    .from("adaptations")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profileId);
  if ((count ?? 0) > 0) return false;

  for (const day of STORY) {
    const workout = workoutById(day.workoutId);
    if (!workout) continue;

    const { data: checkin } = await admin
      .from("checkins")
      .insert({
        profile_id: profileId,
        energy: day.energy,
        discomfort: day.discomfort,
        mood: day.mood,
        sensory_load: day.sensory,
        selected_flags: [],
        red_flag: false,
        red_flag_reasons: [],
        created_at: at(day.daysAgo),
      })
      .select("id")
      .maybeSingle();

    if (!checkin) continue;

    const movements = workout.blocks
      .map((b) => movementById(b.movement_id))
      .filter(Boolean)
      .slice(0, 3);

    const { data: adaptation } = await admin
      .from("adaptations")
      .insert({
        profile_id: profileId,
        checkin_id: checkin.id,
        original_plan: {
          ...TODAYS_PLAN,
          title: workout.title,
          total_minutes: workout.duration_minutes,
        },
        adapted_plan: {
          id: "adapted",
          title: "Adapted for today",
          total_minutes: day.adaptedMinutes,
          intensity: "low",
          movements,
        },
        why_this_changed: day.reasons.join("\n"),
        source: day.source ?? "llm",
        constraints_applied: {
          max_intensity: "low",
          target_minutes: day.adaptedMinutes,
          max_movements: movements.length,
          excluded_tags: ["jumping"],
        },
        created_at: at(day.daysAgo),
      })
      .select("id")
      .maybeSingle();

    if (adaptation && day.verdict) {
      await admin.from("feedback").insert({
        profile_id: profileId,
        adaptation_id: adaptation.id,
        verdict: day.verdict,
        completed_movements: movements.map((m) => m!.id),
        created_at: at(day.daysAgo),
      });
    }
  }

  /* The history above is why this number is what it is. */
  await admin.from("profiles").update({ preferred_minutes: 15 }).eq("id", profileId);

  return true;
}
