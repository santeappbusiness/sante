import type {
  AdaptationResult,
  DailyPlan,
  FeedbackVerdict,
  ReadinessCheckin,
} from "@/types/domain";

/**
 * The persistence seam.
 *
 * Everything in the app reads and writes through this interface and never
 * touches storage directly. Today it is backed by the browser so the whole
 * product could be built without waiting on the database. When Serene's schema
 * lands, `supabaseStore` gets written against the same interface and the only
 * change anywhere else is which store `getStore()` returns.
 *
 * This is what keeps "wire the backend later" a scheduled task rather than a
 * rewrite threaded through every component.
 */

export type StoredSession = {
  session_id: string;
  plan: DailyPlan;
  last_checkin: ReadinessCheckin | null;
  result: AdaptationResult | null;
  completed_movement_ids: string[];
  feedback: FeedbackVerdict[];
  stage: string;
};

export interface Store {
  /** Starts a fresh demo session. One per visitor, so two judges never share Maya. */
  createSession(seedPlan: DailyPlan): Promise<StoredSession>;
  load(): Promise<StoredSession | null>;
  save(patch: Partial<StoredSession>): Promise<void>;
  /** Wipes this visitor's session and starts over. */
  reset(seedPlan: DailyPlan): Promise<StoredSession>;
}

const KEY = "sante-session";

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : String(Date.now());
}

/** Browser-backed store. Survives refresh, dies with the tab, which is exactly
 *  the lifetime an ephemeral demo session should have. */
class BrowserStore implements Store {
  async createSession(seedPlan: DailyPlan): Promise<StoredSession> {
    const session: StoredSession = {
      session_id: newId(),
      plan: seedPlan,
      last_checkin: null,
      result: null,
      completed_movement_ids: [],
      feedback: [],
      stage: "plan",
    };
    this.write(session);
    return session;
  }

  async load(): Promise<StoredSession | null> {
    if (typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as StoredSession) : null;
    } catch {
      return null;
    }
  }

  async save(patch: Partial<StoredSession>): Promise<void> {
    const current = await this.load();
    if (!current) return;
    this.write({ ...current, ...patch });
  }

  async reset(seedPlan: DailyPlan): Promise<StoredSession> {
    try {
      sessionStorage.removeItem(KEY);
    } catch {}
    return this.createSession(seedPlan);
  }

  private write(session: StoredSession) {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(session));
    } catch {}
  }
}

/* When the schema is confirmed, add:
 *
 *   class SupabaseStore implements Store { ... }
 *
 * createSession inserts a row in demo_sessions and copies Maya's profile and
 * plan against that id. Writes go through our own API routes with the
 * service-role key, so the browser never holds a key that can write. Then
 * getStore() returns it, and nothing else in the app changes. */

let instance: Store | null = null;

export function getStore(): Store {
  if (!instance) instance = new BrowserStore();
  return instance;
}
