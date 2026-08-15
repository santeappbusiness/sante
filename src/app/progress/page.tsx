"use client";

import { useEffect, useState } from "react";
import { getStore, type HistoryEntry } from "@/lib/storage";
import AppNav from "@/components/AppNav";

/**
 * Progress, without the guilt.
 *
 * The headline number counts every day someone honoured their capacity, and
 * that deliberately includes days they adapted and days they chose rest. A
 * streak that breaks when someone rests would be measuring compliance, not
 * wellbeing.
 *
 * Everything here is the visitor's own rows, read under RLS.
 */
export default function Progress() {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);

  useEffect(() => {
    (async () => {
      const store = getStore();
      setEntries((await store.history?.()) ?? []);
    })();
  }, []);

  const honoured = entries?.length ?? 0;
  const adapted = entries?.filter((e) => e.adapted_minutes < e.original_minutes).length ?? 0;
  const minutes = entries?.reduce((sum, e) => sum + e.adapted_minutes, 0) ?? 0;

  return (
    <>
      <main className="mx-auto max-w-3xl px-5 py-10 pb-28 sm:pb-10">
        <h1 className="text-3xl">Progress</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Showing up counts, whatever shape it took.
        </p>

        <div className="mt-7 rounded-2xl bg-moss/20 p-6">
          <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate">
            Days you honoured your capacity
          </p>
          <p className="mt-1 font-display text-5xl tabular-nums">{honoured}</p>
          <p className="mt-2 max-w-md text-sm text-ink-soft">
            Every check-in counts here: sessions you completed, sessions you made lighter, and
            days you chose rest.
          </p>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-surface p-5 ring-1 ring-ink/10">
            <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate">
              Plans adapted
            </p>
            <p className="mt-1 font-display text-3xl tabular-nums">{adapted}</p>
          </div>
          <div className="rounded-2xl bg-surface p-5 ring-1 ring-ink/10">
            <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate">
              Minutes moved
            </p>
            <p className="mt-1 font-display text-3xl tabular-nums">{minutes}</p>
          </div>
        </div>

        <h2 className="mt-10 text-2xl">Recent days</h2>

        {entries === null && <p className="mt-3 text-sm text-slate">Loading your history…</p>}

        {entries !== null && entries.length === 0 && (
          <div className="mt-3 rounded-2xl bg-surface p-6 text-center ring-1 ring-ink/10">
            <p className="text-ink-soft">
              Your rhythm will show up here after your first check-in.
            </p>
            <a
              href="/today"
              className="mt-4 inline-block rounded-xl bg-coral px-5 py-3 font-bold text-coral-on"
            >
              Check in
            </a>
          </div>
        )}

        {entries !== null && entries.length > 0 && (
          <ul className="mt-3 grid gap-2">
            {entries.map((e) => (
              <li key={e.id} className="rounded-2xl bg-surface p-5 ring-1 ring-ink/10">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-display text-xl tabular-nums">
                    {e.original_minutes} min{" "}
                    <span className="text-coral" aria-label="became">
                      →
                    </span>{" "}
                    <span className="text-moss-deep">{e.adapted_minutes} min</span>
                  </p>
                  <p className="font-mono text-xs text-slate">
                    {new Date(e.created_at).toLocaleString(undefined, {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {e.source === "fallback" && " · built from Santé's own rules"}
                  </p>
                </div>
                {e.why.length > 0 && (
                  <ul className="mt-2 space-y-1 text-sm text-ink-soft">
                    {e.why.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
      <AppNav />
    </>
  );
}
