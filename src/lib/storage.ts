import { supabaseConfigured } from "./supabase/client";
import { SupabaseStore } from "./supabase/store";
import type {
  AdaptationResult,
  DailyPlan,
  FeedbackVerdict,
  Movement,
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
  /** Movements the server permitted today. Used for mid-session swaps. */
  allowed_movements?: Movement[];
  /** Set once we have offered to remember something, so we ask only once. */
  memory_offered?: boolean;
  /**
   * Today only: show the least the result can be and still be useful.
   *
   * Separate from calm mode on purpose. Calm mode is a standing choice about
   * how the whole app behaves; this is one bad afternoon. Conflating them
   * would mean a person who wanted less on a Tuesday had to remember to undo
   * it, or that turning calm mode on for the interface quietly reduced what
   * she was told.
   */
  simplified?: boolean;
  /**
   * The workout this day is built from, when someone chose one.
   *
   * Held on the session rather than read from the URL each time, because the
   * choice has to survive a refresh and reach every path that adapts: the first
   * run, a retry, "still too much" and Make It Fit. Only ever an id. The plan
   * itself is resolved from our own catalogue, on the server, so choosing a
   * workout can never smuggle in movements or minutes we did not write.
   */
  workout_id?: string;
  /** Facts about the last run, shown under "How Santé did that". */
  receipt?: unknown;
  plan: DailyPlan;
  last_checkin: ReadinessCheckin | null;
  result: AdaptationResult | null;
  completed_movement_ids: string[];
  feedback: FeedbackVerdict[];
  stage: string;
};

export type HistoryEntry = {
  id: string;
  created_at: string;
  original_minutes: number;
  adapted_minutes: number;
  source: string;
  why: string[];
};

/**
 * What a write actually did.
 *
 * `void` was not enough to be honest with. Both writes below used to discard
 * their errors, so the interface could not tell "stored" from "silently lost",
 * and the app moved on either way. `durable` separates a row in the database
 * from state we are only holding in this browser, so nothing claims a
 * persistence that did not happen.
 */
export type PersistResult =
  | { ok: true; durable: boolean }
  | { ok: false; error: string };

/** What a caller should assume when a store does not implement the write at
 *  all. Not a failure: the browser-only store keeps this in the session and
 *  never pretended otherwise. */
export const NOT_PERSISTED: PersistResult = { ok: true, durable: false };

export interface Store {
  /** Records a verdict against the adaptation it belongs to. */
  saveFeedback?(
    adaptationId: string,
    verdict: FeedbackVerdict,
    completed: string[]
  ): Promise<PersistResult>;
  /** Saves a preference the person explicitly agreed to remember. */
  rememberPreferredMinutes?(minutes: number): Promise<PersistResult>;
  /** Everything this visitor has done, for Progress. */
  history?(): Promise<HistoryEntry[]>;
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

let instance: Store | null = null;

/**
 * The one place that decides where data lives.
 *
 * With Supabase configured, identity is an anonymous user and RLS keyed on
 * auth.uid() does the isolation. Without it, the app falls back to the browser
 * and still runs end to end, which is what lets the demo survive a database
 * outage rather than dying with one.
 */
export function getStore(): Store {
  if (!instance) {
    instance = supabaseConfigured ? new SupabaseStore() : new BrowserStore();
  }
  return instance;
}
