import type { DailyPlan, FeedbackVerdict, Movement } from "@/types/domain";
import { movementById, TODAYS_PLAN } from "@/lib/demo-data";
import type { Store, StoredSession } from "@/lib/storage";
import { ensureAnonymousSession, getSupabase, newAnonymousSession } from "./client";

/**
 * Supabase-backed store.
 *
 * Identity is an anonymous Supabase user, so RLS keyed on auth.uid() gives each
 * visitor real isolation: two judges on the link at once cannot see each
 * other's rows, and that is enforced by the database rather than by us being
 * careful.
 *
 * What lives where, and why:
 *   profiles, plans   read from Postgres, seeded by start_demo_session()
 *   feedback          written by the client, which has an insert policy for it
 *   checkins,
 *   adaptations       written server-side only. The client has SELECT and no
 *                     INSERT, so a client can never write the safety verdict.
 *   stage, completed  transient UI state, kept locally. Nothing is gained by a
 *                     round trip to record which movement someone just tapped.
 */

const LOCAL = "sante-ui-state";

type LocalState = Pick<
  StoredSession,
  "stage" | "completed_movement_ids" | "result" | "last_checkin"
>;

function readLocal(): LocalState {
  try {
    const raw = sessionStorage.getItem(LOCAL);
    if (raw) return JSON.parse(raw) as LocalState;
  } catch {}
  return { stage: "plan", completed_movement_ids: [], result: null, last_checkin: null };
}

function writeLocal(state: LocalState) {
  try {
    sessionStorage.setItem(LOCAL, JSON.stringify(state));
  } catch {}
}

/** Turn a stored plan row into the shape the app renders. Movements are resolved
 *  from our own catalogue by id, so the database never dictates instructions. */
function toDailyPlan(row: any): DailyPlan {
  const items: any[] = Array.isArray(row?.items) ? row.items : [];
  const movements = items
    .map((item) => movementById(String(item.id)))
    .filter((m): m is Movement => Boolean(m));

  return {
    id: String(row?.id ?? "plan"),
    title: String(row?.title ?? "Today's session"),
    total_minutes: Number(row?.total_minutes ?? movements.reduce((s, m) => s + m.minutes, 0)),
    intensity: (row?.intensity ?? "moderate") as DailyPlan["intensity"],
    movements,
  };
}

export class SupabaseStore implements Store {
  private profileId: string | null = null;

  async createSession(seedPlan: DailyPlan): Promise<StoredSession> {
    const sb = getSupabase();
    const uid = await ensureAnonymousSession();
    if (!sb || !uid) return this.offline(seedPlan);

    this.profileId = uid;

    /* Seeds Maya's profile and baseline plan against this identity. Safe to call
       again: it inserts on conflict do nothing. */
    const { error } = await sb.rpc("start_demo_session");
    if (error) return this.offline(seedPlan);

    return this.hydrate(seedPlan, { stage: "plan", completed_movement_ids: [], result: null, last_checkin: null });
  }

  async load(): Promise<StoredSession | null> {
    const sb = getSupabase();
    if (!sb) return null;

    const { data } = await sb.auth.getSession();
    const uid = data.session?.user?.id;
    if (!uid) return null;

    this.profileId = uid;
    return this.hydrate(TODAYS_PLAN, readLocal());
  }

  async save(patch: Partial<StoredSession>): Promise<void> {
    const local = readLocal();
    writeLocal({
      stage: patch.stage ?? local.stage,
      completed_movement_ids: patch.completed_movement_ids ?? local.completed_movement_ids,
      result: patch.result ?? local.result,
      last_checkin: patch.last_checkin ?? local.last_checkin,
    });

  }

  /* Feedback is the one row the client may write, and the one that has to
     outlive the tab because it feeds the next adaptation. It hangs off the
     adaptation it is about, which the server created. */
  async saveFeedback(
    adaptationId: string,
    verdict: FeedbackVerdict,
    completed: string[]
  ): Promise<void> {
    const sb = getSupabase();
    if (!sb || !this.profileId) return;
    await sb.from("feedback").insert({
      profile_id: this.profileId,
      adaptation_id: adaptationId,
      verdict,
      completed_movements: completed,
    });
  }

  async reset(seedPlan: DailyPlan): Promise<StoredSession> {
    try {
      sessionStorage.removeItem(LOCAL);
    } catch {}
    /* A new identity rather than a delete, which is why having no DELETE policy
       costs us nothing. */
    await newAnonymousSession();
    return this.createSession(seedPlan);
  }

  private async hydrate(fallbackPlan: DailyPlan, local: LocalState): Promise<StoredSession> {
    const sb = getSupabase();
    if (!sb || !this.profileId) return this.offline(fallbackPlan);

    const [{ data: planRow }, { data: feedbackRows }] = await Promise.all([
      sb.from("plans").select("*").eq("is_baseline", true).limit(1).maybeSingle(),
      sb
        .from("feedback")
        .select("verdict, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    return {
      session_id: this.profileId,
      plan: planRow ? toDailyPlan(planRow) : fallbackPlan,
      last_checkin: local.last_checkin,
      result: local.result,
      completed_movement_ids: local.completed_movement_ids,
      feedback: (feedbackRows ?? []).map((r: any) => r.verdict as FeedbackVerdict),
      stage: local.stage,
    };
  }

  /** If Supabase is unreachable the app still runs, on the local plan. Losing
   *  the database should degrade the demo, never end it. */
  private offline(seedPlan: DailyPlan): StoredSession {
    const local = readLocal();
    return {
      session_id: "offline",
      plan: seedPlan,
      last_checkin: local.last_checkin,
      result: local.result,
      completed_movement_ids: local.completed_movement_ids,
      feedback: [],
      stage: local.stage,
    };
  }
}
