import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { resolveUserRecord } from "@/lib/persist";
import { TODAYS_PLAN } from "@/lib/demo-data";

export const runtime = "nodejs";

/**
 * Gives a newly signed-in account a profile and a baseline plan.
 *
 * Without this a real user lands on an app with nothing to adapt. Runs
 * server-side because it writes a plan row, and it is safe to call repeatedly:
 * everything here is "only if missing".
 */
export async function POST(req: NextRequest) {
  const admin = getSupabaseAdmin();
  const user = await resolveUserRecord(req.headers.get("authorization"));
  if (!admin || !user) {
    return Response.json({ error: "Not signed in." }, { status: 401 });
  }

  const profileId = user.id;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const name =
    (typeof meta.full_name === "string" && meta.full_name.split(" ")[0]) ||
    (typeof meta.name === "string" && meta.name.split(" ")[0]) ||
    "there";

  await admin.from("profiles").upsert(
    {
      id: profileId,
      display_name: name,
      goal: "Stay consistent without forcing myself through bad days",
      preferred_minutes: 30,
      avoid_tags: [],
      nd_mode: false,
      is_demo: false,
    },
    { onConflict: "id", ignoreDuplicates: true }
  );

  const { data: existing } = await admin
    .from("plans")
    .select("id")
    .eq("profile_id", profileId)
    .eq("is_baseline", true)
    .maybeSingle();

  if (!existing) {
    await admin.from("plans").insert({
      profile_id: profileId,
      title: TODAYS_PLAN.title,
      items: TODAYS_PLAN.movements.map((m) => ({
        id: m.id,
        name: m.name,
        minutes: m.minutes,
        intensity: m.intensity,
      })),
      total_minutes: TODAYS_PLAN.total_minutes,
      intensity: TODAYS_PLAN.intensity,
      is_baseline: true,
    });
  }

  return Response.json({ ok: true });
}
