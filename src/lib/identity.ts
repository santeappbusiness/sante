"use client";

import { useEffect, useState } from "react";
import { ensureAnonymousSession, getSupabase } from "./supabase/client";

/**
 * Who this browser currently belongs to, and where her local state lives.
 *
 * Everything Santé kept in the browser used to sit under one global key each:
 * one week, one saved list, one equipment list, one calm mode, one "you have
 * seen the welcome". So a real account opened Maya's week and read it as her
 * own, and signing out and back in as somebody else inherited whatever the
 * last person left behind. The screenshot of a brand new account being shown a
 * full week it never planned is exactly that.
 *
 * Two rules fix it, and both are enforced here rather than remembered at every
 * call site:
 *
 *   1. Every key is namespaced by the identity that wrote it.
 *   2. On arrival, anything belonging to a different identity is deleted, along
 *      with the old global keys, which were the leak itself.
 *
 * This is per-browser storage and it stays per-browser. Nothing here syncs, and
 * nothing in the product should say it does.
 */

export type Identity = {
  id: string;
  /** An anonymous Supabase user. The demo, and the only place Maya exists. */
  isDemo: boolean;
};

const PREFIX = "sante:";

/** The unscoped keys this app used to write. Removed on sight: they are shared
 *  between every account that ever opens this browser. */
const LEGACY_KEYS = [
  "sante-week",
  "sante-saved-workouts",
  "sante-equipment",
  "sante-calm",
  "sante-demo-welcome",
  "sante-session",
  "sante-ui-state",
  "sante-pending-checkin",
];

/** Base key for the check-in handed from Home to Today. Lives here because
 *  this module owns the namespace and the purge that this key has to survive. */
export const PENDING_CHECKIN = "pending-checkin";

export function scopedKey(base: string, id: string): string {
  return `${PREFIX}${id}:${base}`;
}

function purgeForeign(store: Storage, keepId: string) {
  const doomed: string[] = [];
  for (let i = 0; i < store.length; i++) {
    const k = store.key(i);
    if (!k) continue;
    if (LEGACY_KEYS.includes(k)) {
      doomed.push(k);
      continue;
    }
    if (k.startsWith(PREFIX) && !k.startsWith(`${PREFIX}${keepId}:`)) doomed.push(k);
  }
  doomed.forEach((k) => store.removeItem(k));
}

/**
 * Drop everything this browser is holding for anyone who is not `keepId`.
 *
 * Called once per identity resolution, which covers the cases that matter:
 * demo then sign in, one account then another, and signing out back into a
 * fresh anonymous demo.
 */
export function isolateTo(keepId: string) {
  try {
    purgeForeign(localStorage, keepId);
  } catch {}
  try {
    purgeForeign(sessionStorage, keepId);
  } catch {}
}

/* One resolution shared by every page, so six components do not each make their
   own auth round trip and disagree about the answer for a few hundred
   milliseconds. */
let cached: Promise<Identity | null> | null = null;

export function resolveIdentity(): Promise<Identity | null> {
  if (cached) return cached;
  const attempt = (async () => {
    const sb = getSupabase();
    if (!sb) return null;

    let { data } = await sb.auth.getSession();
    /* A first-ever visitor has no session yet: the store is about to create an
       anonymous one. Waiting for it here rather than answering "nobody" is the
       difference between scoped storage working and silently doing nothing,
       because every scoped write no-ops without an identity. */
    if (!data.session?.user) {
      await ensureAnonymousSession();
      ({ data } = await sb.auth.getSession());
    }

    const user = data.session?.user;
    if (!user) return null;
    const identity: Identity = { id: user.id, isDemo: Boolean(user.is_anonymous) };
    isolateTo(identity.id);
    return identity;
  })();

  /* Only a real answer is worth remembering. Caching a null would make one
     unlucky moment during sign-in permanent for the rest of the page's life. */
  cached = attempt.then((identity) => {
    if (!identity) cached = null;
    return identity;
  });
  return cached;
}

/** After signing out or starting a new demo session, the next read must not
 *  hand back the identity that just left. */
export function forgetIdentity() {
  cached = null;
}

/**
 * The identity, and whether we know it yet.
 *
 * `loading` is the point of this. Pages used to default to "this is Maya, this
 * is the demo" and correct themselves a tick later, so a real account saw a
 * flash of a fictional person's name and a Reset demo link that did not belong
 * to her. Anything that differs between demo and account waits for `loading`
 * to be false rather than guessing.
 */
export function useIdentity(): { identity: Identity | null; loading: boolean } {
  const [state, setState] = useState<{ identity: Identity | null; loading: boolean }>({
    identity: null,
    loading: true,
  });

  useEffect(() => {
    let alive = true;
    resolveIdentity().then((identity) => {
      if (alive) setState({ identity, loading: false });
    });
    return () => {
      alive = false;
    };
  }, []);

  return state;
}

/* ------------------------------------------------------------------ *
 * Scoped browser storage.
 *
 * Reads before the identity is known return nothing rather than someone
 * else's data, which is the honest answer to "whose week is this?" when we do
 * not yet know whose browser this is.
 * ------------------------------------------------------------------ */

export function readScoped<T>(base: string, id: string | null, fallback: T): T {
  if (!id) return fallback;
  try {
    const raw = localStorage.getItem(scopedKey(base, id));
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeScoped(base: string, id: string | null, value: unknown) {
  if (!id) return;
  try {
    localStorage.setItem(scopedKey(base, id), JSON.stringify(value));
  } catch {}
}

/* ------------------------------------------------------------------ *
 * The same, in sessionStorage, for state that should not outlive the tab.
 *
 * These exist because a hand-off between two pages has to survive the purge
 * that happens when the second page resolves its identity. An unscoped key
 * looks exactly like the old global leak and gets deleted on arrival, which is
 * how a check-in answered on Home reached Today as nothing at all.
 * ------------------------------------------------------------------ */

export function readScopedSession<T>(base: string, id: string | null): T | null {
  if (!id) return null;
  try {
    const raw = sessionStorage.getItem(scopedKey(base, id));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeScopedSession(base: string, id: string | null, value: unknown) {
  if (!id) return;
  try {
    sessionStorage.setItem(scopedKey(base, id), JSON.stringify(value));
  } catch {}
}

export function clearScopedSession(base: string, id: string | null) {
  if (!id) return;
  try {
    sessionStorage.removeItem(scopedKey(base, id));
  } catch {}
}
