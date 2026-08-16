"use client";

import { useEffect, useState } from "react";
import { getStore, type HistoryEntry } from "@/lib/storage";
import AppNav from "@/components/AppNav";
import { Arch, Blob, Waves } from "@/components/BrandShapes";

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
      <main className="pb-28 lg:pb-10 lg:pl-56">
        <section className="relative overflow-hidden bg-moss/25 px-5 pb-12 pt-10">
          <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-16 text-moss/40">
            <Blob size={300} />
          </div>
          <div className="relative mx-auto max-w-3xl">
            <h1 className="font-display text-4xl leading-tight sm:text-5xl">Progress</h1>
            <p className="mt-2 text-ink-soft">Showing up counts, whatever shape it took.</p>

            <div className="mt-8 flex items-end gap-5">
              <p className="font-display text-7xl leading-none tabular-nums text-moss-deep sm:text-8xl">
                {honoured}
              </p>
              <div className="pb-2">
                <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate">
                  Days you honoured
                </p>
                <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate">
                  your capacity
                </p>
              </div>
            </div>

            <p className="mt-4 max-w-md text-sm text-ink-soft">
              Sessions you completed, sessions you made lighter, and days you chose rest. All of
              it counts here.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-5">

        <div className="-mt-6 grid gap-3 sm:grid-cols-2">
          <div className="relative overflow-hidden rounded-[24px] bg-surface p-6 shadow-[0_1px_2px_rgba(47,58,51,0.04),0_18px_44px_-30px_rgba(47,58,51,0.3)]">
            <div aria-hidden="true" className="absolute -right-4 -top-4 text-coral/25">
              <Arch size={110} />
            </div>
            <p className="relative text-xs font-bold uppercase tracking-[0.13em] text-slate">
              Plans adapted
            </p>
            <p className="relative mt-1 font-display text-4xl tabular-nums">{adapted}</p>
          </div>
          <div className="relative overflow-hidden rounded-[24px] bg-surface p-6 shadow-[0_1px_2px_rgba(47,58,51,0.04),0_18px_44px_-30px_rgba(47,58,51,0.3)]">
            <div aria-hidden="true" className="absolute -bottom-3 -right-3 text-slate/25">
              <Waves size={130} />
            </div>
            <p className="relative text-xs font-bold uppercase tracking-[0.13em] text-slate">
              Minutes moved
            </p>
            <p className="relative mt-1 font-display text-4xl tabular-nums">{minutes}</p>
          </div>
        </div>

        <h2 className="mt-10 font-display text-2xl">Recent days</h2>

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
        </div>
      </main>
      <AppNav />
    </>
  );
}
