import { getSupabaseAdmin } from "./supabase/server";
import type { DailyPlan, ReadinessCheckin, ReadinessResult } from "@/types/domain";

/**
 * Server-side persistence.
 *
 * The client has SELECT on checkins and adaptations and no INSERT, so these two
 * rows can only be written here, with the service-role key. That is what makes
 * "the client cannot write the safety verdict" true by construction rather than
 * by convention.
 *
 * The caller's identity is taken from their access token, never from a uid in
 * the request body: with the service-role key we could write a row against any
 * profile, so the token is what stops one visitor writing rows as another.
 */

export async function resolveUser(authHeader: string | null): Promise<string | null> {
  const admin = getSupabaseAdmin();
  if (!admin || !authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

export async function saveCheckin(
  profileId: string,
  checkin: ReadinessCheckin,
  result: ReadinessResult
): Promise<string | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const { data, error } = await admin
    .from("checkins")
    .insert({
      profile_id: profileId,
      energy: checkin.energy,
      discomfort: checkin.discomfort,
      mood: checkin.mood,
      sensory_load: checkin.sensory_load,
      selected_flags: checkin.red_flags,
      /* The gate's verdict, written only here. */
      red_flag: result.blocked,
      red_flag_reasons: result.blocked ? checkin.red_flags : [],
    })
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("checkin insert failed:", error.message);
    return null;
  }
  return data?.id ?? null;
}

export async function saveAdaptation(args: {
  profileId: string;
  /* Required: an adaptation without the check-in that caused it is a record
     with no explanation, and the table enforces that. */
  checkinId: string;
  original: DailyPlan;
  adapted: DailyPlan;
  reasons: string[];
  usedFallback: boolean;
  result: ReadinessResult;
}): Promise<string | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const { data, error } = await admin
    .from("adaptations")
    .insert({
      profile_id: args.profileId,
      checkin_id: args.checkinId,
      /* Snapshot, not a reference: an adaptation is a historical record, and a
         foreign key would make old diffs re-render against a new baseline. */
      original_plan: args.original,
      adapted_plan: args.adapted,
      /* The lines shown under "Why this changed". The column is text, so store
         them as readable prose rather than letting the array stringify itself
         into JSON: anyone browsing the table should be able to read why a plan
         changed without parsing anything. Split on newline to get them back. */
      why_this_changed: args.reasons.join("\n"),
      source: args.usedFallback ? "fallback" : "llm",
      /* Evidence the model worked inside a box it could not widen. */
      constraints_applied: {
        max_intensity: args.result.max_intensity,
        target_minutes: args.result.target_minutes,
        max_movements: args.result.max_movements,
        excluded_tags: args.result.excluded_tags,
      },
    })
    .select("id")
    .maybeSingle();

  if (error) {
    /* Worth seeing in the server log: a silent failure here means feedback
       cannot be written either, because it references this row. */
    console.error("adaptation insert failed:", error.message);
    return null;
  }
  return data?.id ?? null;
}
