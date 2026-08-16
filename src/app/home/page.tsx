"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { COLLECTIONS, TODAYS_PLAN, MAYA } from "@/lib/demo-data";
import { getStore, type HistoryEntry } from "@/lib/storage";
import { getSupabase } from "@/lib/supabase/client";
import { loadWeek, planMinutes, todayName, type PlannedDay } from "@/lib/week";
import CapacityBloom, { toBloom } from "@/components/CapacityBloom";
import AppNav from "@/components/AppNav";
import { Blob, Flower, Sprig, Waves } from "@/components/BrandShapes";
import type { ReadinessCheckin } from "@/types/domain";

/**
 * Home.
 *
 * The Bloom sits first and largest, because the question Santé asks is how you
 * are, not what you achieved. Everything under it is an offer.
 *
 * Deliberately not a dashboard: no rings, no streak, no percentage of a goal.
 * The one number on the page counts days someone honoured their capacity, and
 * resting counts toward it.
 */
export default function Home() {
  const [name, setName] = useState(MAYA.display_name);
  const [checkin, setCheckin] = useState<ReadinessCheckin | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [week, setWeek] = useState<PlannedDay[]>([]);

  useEffect(() => {
    (async () => {
      setWeek(loadWeek());
      const store = getStore();
      const session = await store.load();
      if (session?.last_checkin) setCheckin(session.last_checkin);
      setHistory((await store.history?.()) ?? []);

      const sb = getSupabase();
      if (!sb) return;
      const { data } = await sb.from("profiles").select("display_name").maybeSingle();
      if (data?.display_name) setName(data.display_name);
    })();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = todayName();
  const todayPlanned = week.find((d) => d.day === today);
  const isRestDay = todayPlanned?.kind === "rest";

  return (
    <>
      <main className="pb-28 lg:pb-10 lg:pl-56">
        {/* Greeting and capacity, as one editorial block on a tinted ground. */}
        <section className="relative overflow-hidden bg-lavender/30 px-5 pb-10 pt-10">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 text-lavender/60">
            <Blob size={320} />
          </div>

          <div className="relative mx-auto max-w-3xl">
            <img src="/brand/sante-logo.png" alt="Santé" className="-ml-3 w-32 sm:w-36 lg:hidden" />
            <h1 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">
              {greeting}, {name}
            </h1>

            <div className="mt-8 sm:flex sm:items-center sm:gap-10">
              {checkin ? (
                <>
                  <CapacityBloom values={toBloom(checkin)} size={168} />
                  <div className="mt-6 flex-1 sm:mt-0">
                    <p className="max-w-sm text-ink-soft">
                      That is today as you described it. Your plan already reflects it.
                    </p>
                    <Link
                      href="/today"
                      className="mt-5 inline-block rounded-2xl bg-coral px-6 py-3.5 font-bold text-coral-on"
                    >
                      Go to today
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div aria-hidden="true" className="text-lavender">
                    <Flower size={140} />
                  </div>
                  <div className="mt-6 flex-1 sm:mt-0">
                    <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate">
                      Today&rsquo;s capacity
                    </p>
                    <p className="mt-1 font-display text-3xl">Not checked in yet</p>
                    <p className="mt-2 max-w-sm text-ink-soft">
                      Four questions, about twenty seconds, and today&rsquo;s session fits the
                      day you are actually having.
                    </p>
                    <Link
                      href="/today"
                      className="mt-5 inline-block rounded-2xl bg-coral px-6 py-3.5 font-bold text-coral-on"
                    >
                      Check in
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-5">
          {/* Today, as a feature panel rather than a card in a stack. */}
          <section className="-mt-6 rounded-[26px] bg-surface p-6 shadow-[0_1px_2px_rgba(47,58,51,0.04),0_20px_50px_-30px_rgba(47,58,51,0.3)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate">
                  {todayPlanned ? `${today}, as planned` : "Today, as planned"}
                </p>
                <p className="mt-1.5 font-display text-3xl leading-tight tabular-nums">
                  {todayPlanned && todayPlanned.kind === "rest"
                    ? "Rest day"
                    : `${TODAYS_PLAN.total_minutes} min · ${TODAYS_PLAN.intensity}`}
                </p>
              </div>
              <span aria-hidden="true" className="text-moss">
                <Sprig size={40} />
              </span>
            </div>

            {isRestDay ? (
              <p className="mt-4 max-w-md text-ink-soft">
                Nothing scheduled. If you want to move anyway, check in and Santé will find
                something that fits.
              </p>
            ) : (
              <ul className="mt-4 grid gap-1.5 text-sm text-ink-soft sm:grid-cols-2">
                {TODAYS_PLAN.movements.map((m) => (
                  <li key={m.id}>{m.name}</li>
                ))}
              </ul>
            )}

            <p className="mt-4 border-t border-ink/10 pt-3 text-sm text-slate">
              {isRestDay
                ? "Rest was planned here on purpose, and it counts in Progress."
                : "None of this is fixed. Check in and it becomes today's session."}
            </p>
          </section>

          {/* Collections. Full-bleed feeling row, different shape to everything else. */}
          <section className="mt-10">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-2xl">For a day like this</h2>
              <Link href="/explore" className="text-sm text-slate underline">
                All collections
              </Link>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {COLLECTIONS.slice(0, 3).map((c, i) => (
                <Link
                  key={c.id}
                  href={`/explore/${c.id}`}
                  className={
                    "relative overflow-hidden rounded-[22px] p-5 " +
                    (i === 0
                      ? "bg-moss/25"
                      : i === 1
                      ? "bg-surface ring-1 ring-ink/10"
                      : "bg-coral/15")
                  }
                >
                  <p className="relative font-display text-xl leading-tight">{c.title}</p>
                  <p className="relative mt-1.5 text-sm text-ink-soft">{c.blurb}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* The week, as rhythm rather than a table. */}
          {week.length > 0 && (
            <section className="relative mt-10 overflow-hidden rounded-[26px] bg-moss/20 p-6">
              <div aria-hidden="true" className="absolute -bottom-3 -right-6 text-moss/40">
                <Waves size={190} />
              </div>
              <div className="relative flex items-baseline justify-between">
                <h2 className="font-display text-2xl">Your week</h2>
                <Link href="/plan" className="text-sm text-slate underline">
                  Open
                </Link>
              </div>

              <div className="relative mt-5 flex gap-1.5">
                {week.map((d) => {
                  const isToday = d.day === today;
                  const height =
                    d.kind === "rest" ? 8 : Math.max(14, Math.min(52, planMinutes(d)));
                  return (
                    <div key={d.day} className="flex flex-1 flex-col items-center gap-1.5">
                      <div className="flex h-14 items-end">
                        <div
                          className={
                            "w-full rounded-full " +
                            (d.kind === "rest"
                              ? "bg-ink/15"
                              : isToday
                              ? "bg-coral"
                              : "bg-moss-deep/70")
                          }
                          style={{ height }}
                        />
                      </div>
                      <span
                        className={
                          "text-[10px] " + (isToday ? "font-bold text-ink" : "text-slate")
                        }
                      >
                        {d.day.slice(0, 1)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <p className="relative mt-3 text-sm text-ink-soft">
                Rest days are days, not gaps.
              </p>
            </section>
          )}

          {history.length > 0 && (
            <section className="mt-10">
              <h2 className="font-display text-2xl">Your rhythm so far</h2>
              <p className="mt-1 text-ink-soft">
                {history.length} day{history.length === 1 ? "" : "s"} where you checked in and
                adjusted rather than pushing through.
              </p>
              <Link href="/progress" className="mt-3 inline-block text-sm underline">
                See progress
              </Link>
            </section>
          )}
        </div>
      </main>
      <AppNav />
    </>
  );
}
