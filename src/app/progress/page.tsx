"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStore, type HistoryEntry } from "@/lib/storage";
import { derivePatterns, minutesByDay } from "@/lib/patterns";
import AppNav from "@/components/AppNav";
import { Arch, Blob, Sprig, Waves } from "@/components/BrandShapes";

/**
 * Progress, without the guilt.
 *
 * The headline counts every day someone honoured their capacity, and that
 * includes days they adapted and days they chose rest. A streak that breaks
 * when someone rests is measuring compliance, not wellbeing.
 *
 * Everything here is the visitor's own rows, read under RLS, and every pattern
 * is arithmetic rather than a model's guess.
 */
export default function Progress() {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);

  useEffect(() => {
    (async () => {
      const store = getStore();
      setEntries((await store.history?.()) ?? []);
    })();
  }, []);

  const list = entries ?? [];
  const honoured = list.length;
  const adapted = list.filter((e) => e.adapted_minutes < e.original_minutes).length;
  const minutes = list.reduce((sum, e) => sum + e.adapted_minutes, 0);
  const patterns = derivePatterns(list);
  const chart = minutesByDay(list);
  const peak = Math.max(1, ...chart.map((d) => d.minutes));
  const empty = entries !== null && list.length === 0;

  return (
    <>
      <main className="pb-28 lg:pb-10 lg:pl-56">
        <section className="relative overflow-hidden bg-moss/25 px-5 pb-12 pt-10">
          <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-16 text-moss/40">
            <Blob size={300} />
          </div>
          <div className="relative mx-auto max-w-3xl">
            <h1 className="font-display text-4xl leading-tight sm:text-5xl">Progress</h1>
            <p className="mt-2 text-lg text-ink-soft">
              Showing up counts, whatever shape it took.
            </p>

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
          {empty ? (
            <div className="-mt-6 rounded-[26px] bg-surface p-8 text-center shadow-[0_1px_2px_rgba(47,58,51,0.04),0_20px_50px_-32px_rgba(47,58,51,0.35)]">
              <span aria-hidden="true" className="mx-auto block w-fit text-moss">
                <Sprig size={44} />
              </span>
              <p className="mt-3 font-display text-2xl">Your rhythm starts here</p>
              <p className="mx-auto mt-2 max-w-sm text-ink-soft">
                After your first check-in this page fills with what you actually did, not what
                you were supposed to do.
              </p>
              <Link
                href="/home"
                className="mt-5 inline-block rounded-2xl bg-coral px-6 py-3.5 font-bold text-coral-on"
              >
                Check in
              </Link>
            </div>
          ) : (
            <>
              <div className="-mt-6 grid gap-3 sm:grid-cols-2">
                <div className="relative overflow-hidden rounded-[24px] bg-surface p-6 shadow-[0_1px_2px_rgba(47,58,51,0.04),0_18px_44px_-30px_rgba(47,58,51,0.3)]">
                  <div aria-hidden="true" className="absolute -right-4 -top-4 text-coral/25">
                    <Arch size={110} />
                  </div>
                  <p className="relative text-xs font-bold uppercase tracking-[0.13em] text-slate">
                    Plans adapted
                  </p>
                  <p className="relative mt-1 font-display text-4xl tabular-nums">{adapted}</p>
                  <p className="relative mt-1 text-sm text-slate">
                    of {honoured} check-in{honoured === 1 ? "" : "s"}
                  </p>
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

              {/* Fortnight rhythm. Bars, because a line chart of six points
                  pretends to a trend that is not there. */}
              <section className="mt-10">
                <h2 className="font-display text-2xl">Your last two weeks</h2>
                <div className="mt-4 rounded-[24px] bg-surface p-6 ring-1 ring-ink/10">
                  <div className="flex items-end gap-1.5" style={{ height: 120 }}>
                    {chart.map((d, i) => (
                      <div key={i} className="flex flex-1 flex-col items-center justify-end gap-2">
                        <div
                          className={
                            "w-full rounded-full " +
                            (d.minutes > 0 ? "bg-moss-deep" : "bg-ink/10")
                          }
                          style={{
                            height: d.minutes > 0 ? `${(d.minutes / peak) * 96}px` : "6px",
                          }}
                          title={`${d.minutes} min`}
                        />
                        <span className="text-[10px] text-slate">{d.label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 border-t border-ink/10 pt-3 text-sm text-slate">
                    Empty days are days. Nothing here is a streak to protect.
                  </p>
                </div>
              </section>

              {patterns.length > 0 && (
                <section className="mt-10">
                  <h2 className="font-display text-2xl">What Santé has noticed</h2>
                  <p className="mt-1 text-sm text-ink-soft">
                    Worked out from your own history. Descriptions of what you did, never claims
                    about what it means.
                  </p>
                  <div className="mt-4 grid gap-2">
                    {patterns.map((p) => (
                      <div key={p.text} className="rounded-[20px] bg-lavender/30 p-5">
                        <p>{p.text}</p>
                        <p className="mt-1.5 font-mono text-xs text-slate">Based on {p.evidence}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="mt-10">
                <h2 className="font-display text-2xl">Recent days</h2>
                <ul className="mt-4 grid gap-2">
                  {list.map((e) => (
                    <li key={e.id} className="rounded-[20px] bg-surface p-5 ring-1 ring-ink/10">
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
                          {e.source === "fallback" && " · Santé's own rules"}
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
              </section>
            </>
          )}
        </div>
      </main>
      <AppNav />
    </>
  );
}
