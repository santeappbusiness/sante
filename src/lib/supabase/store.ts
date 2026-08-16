import type { DailyPlan, FeedbackVerdict, Movement } from "@/types/domain";
import { movementById, TODAYS_PLAN } from "@/lib/demo-data";
import type { HistoryEntry, Store, StoredSession } from "@/lib/storage";
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

/* Everything about the session except what Postgres owns. Partial, because a
   fresh visitor has none of it yet. */
type LocalState = Partial<StoredSession> & {
  stage: string;
  completed_movement_ids: string[];
};

function readLocal(): LocalState {
  try {
    const raw = sessionStorage.getItem(LOCAL);
    if (raw) return JSON.parse(raw) as LocalState;
  } catch {}
  return {
    stage: "plan",
    completed_movement_ids: [],
    result: null,
    last_checkin: null,
  } as LocalState;
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
  private static bootstrapped = new Set<string>();
  private profileId: string | null = null;

  /* Pages like Progress and Profile construct their own store and never call
     createSession, so identity has to be resolvable on demand rather than only
     as a side effect of starting a session. */
  private async uid(): Promise<string | null> {
    if (this.profileId) return this.profileId;
    const sb = getSupabase();
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    this.profileId = data.session?.user?.id ?? null;
    return this.profileId;
  }

  async createSession(seedPlan: DailyPlan): Promise<StoredSession> {
    const sb = getSupabase();
    const uid = await ensureAnonymousSession();
    if (!sb || !uid) return this.offline(seedPlan);

    this.profileId = uid;

    /* Seeds Maya's profile and baseline plan against this identity. Safe to call
       again: it inserts on conflict do nothing. */
    const { error } = await sb.rpc("start_demo_session");
    if (error) return this.offline(seedPlan);

    /* Give the demo its history. Server-side, because the client cannot write
       check-ins or adaptations and should not be able to. Once per tab: React
       runs effects twice in development and both would fire this. */
    if (SupabaseStore.bootstrapped.has(uid)) {
      return this.hydrate(seedPlan, {
        stage: "plan",
        completed_movement_ids: [],
        result: null,
        last_checkin: null,
      });
    }
    SupabaseStore.bootstrapped.add(uid);

    try {
      const { data } = await sb.auth.getSession();
      if (data.session) {
        await fetch("/api/bootstrap", {
          method: "POST",
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        });
      }
    } catch {}

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
    /* Merge rather than pick field by field: every new piece of session state
       was silently dropped here, and a swap pool that vanishes takes the
       mid-session swap with it. */
    writeLocal({ ...local, ...patch } as LocalState);

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
    const id = await this.uid();
    if (!sb || !id) return;
    await sb.from("feedback").insert({
      profile_id: id,
      adaptation_id: adaptationId,
      verdict,
      completed_movements: completed,
    });
  }

  /* Written only when the person taps Remember. The column is in Serene's
     column-level UPDATE grant, so this is the client's to write. */
  async rememberPreferredMinutes(minutes: number): Promise<void> {
    const sb = getSupabase();
    const id = await this.uid();
    if (!sb || !id) return;
    await sb.from("profiles").update({ preferred_minutes: minutes }).eq("id", id);
  }

  async history(): Promise<HistoryEntry[]> {
    const sb = getSupabase();
    const id = await this.uid();
    if (!sb || !id) return [];
    const { data } = await sb
      .from("adaptations")
      .select("id, created_at, original_plan, adapted_plan, source, why_this_changed")
      .order("created_at", { ascending: false })
      .limit(20);

    return (data ?? []).map((row: any) => ({
      id: row.id,
      created_at: row.created_at,
      original_minutes: Number(row.original_plan?.total_minutes ?? 0),
      adapted_minutes: Number(row.adapted_plan?.total_minutes ?? 0),
      source: row.source ?? "llm",
      why: String(row.why_this_changed ?? "").split("\n").filter(Boolean),
    }));
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
      ...local,
      session_id: this.profileId,
      /* An in-progress session keeps the plan it started, including any swap. */
      plan: local.plan ?? (planRow ? toDailyPlan(planRow) : fallbackPlan),
      last_checkin: local.last_checkin ?? null,
      result: local.result ?? null,
      stage: local.stage,
      completed_movement_ids: local.completed_movement_ids,
      feedback: (feedbackRows ?? []).map((r: any) => r.verdict as FeedbackVerdict),
    };
  }

  /** If Supabase is unreachable the app still runs, on the local plan. Losing
   *  the database should degrade the demo, never end it. */
  private offline(seedPlan: DailyPlan): StoredSession {
    const local = readLocal();
    return {
      ...local,
      session_id: "offline",
      plan: local.plan ?? seedPlan,
      last_checkin: local.last_checkin ?? null,
      result: local.result ?? null,
      feedback: [],
    };
  }
}
