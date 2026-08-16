import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { resolveUserRecord } from "@/lib/persist";
import { TODAYS_PLAN } from "@/lib/demo-data";
import { seedDemoHistory } from "@/lib/seed-demo";

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
  /* Empty rather than "there" when we were not given a name. "there" is a piece
     of greeting copy, and stored as a display_name it came back out as "there,
     this is what you planned", which reads like a bug because it is one. The
     screens that greet someone now drop the name when there is not one. */
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const name =
    (typeof meta.full_name === "string" && meta.full_name.trim().split(" ")[0]) ||
    (typeof meta.name === "string" && meta.name.trim().split(" ")[0]) ||
    "";

  const { data: before } = await admin
    .from("profiles")
    .select("id")
    .eq("id", profileId)
    .maybeSingle();
  const created = !before;

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

  /* Anonymous visitors are the demo, and the demo should not look like an
     account nobody has used. Real signed-up accounts start empty, which is
     honest: we never invent history for a person. */
  if (user.is_anonymous) {
    await seedDemoHistory(profileId);
  }

  return Response.json({ ok: true, created });
}
