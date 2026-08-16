"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TODAYS_PLAN, MAYA } from "@/lib/demo-data";
import { getStore, type HistoryEntry } from "@/lib/storage";
import { getSupabase } from "@/lib/supabase/client";
import { isWeekEmpty, loadWeek, planMinutes, todayName, type PlannedDay } from "@/lib/week";
import CapacityBloom, { capacityLabel, toBloom } from "@/components/CapacityBloom";
import CheckInSheet from "@/components/CheckInSheet";
import CheckInPrompt from "@/components/CheckInPrompt";
import Orientation, { hasSeenOrientation } from "@/components/Orientation";
import { PENDING_CHECKIN, useIdentity, writeScopedSession } from "@/lib/identity";
import { readCalm, useCalmSync } from "@/components/CalmMode";
import { recommendWorkouts } from "@/lib/workouts";
import { WorkoutCard } from "@/components/WorkoutCard";
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
  const [name, setName] = useState("");
  const [prefs, setPrefs] = useState<{ avoidTags: string[]; preferredMinutes: number }>({
    avoidTags: [],
    preferredMinutes: MAYA.preferred_minutes,
  });
  const [checkin, setCheckin] = useState<ReadinessCheckin | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [week, setWeek] = useState<PlannedDay[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [calm, setCalm] = useState(false);
  useCalmSync(setCalm);
  const { identity, loading: identityLoading } = useIdentity();
  const [orientation, setOrientation] = useState(false);

  /* Nothing that differs between the demo and a real account renders until the
     identity is known, so a signed-in person never sees a flash of Maya. */
  useEffect(() => {
    if (identityLoading) return;
    const id = identity?.id ?? null;
    setWeek(loadWeek(id, Boolean(identity?.isDemo)));
    setCalm(readCalm(id));
    if (identity && !hasSeenOrientation(id)) setOrientation(true);
  }, [identityLoading, identity]);

  useEffect(() => {
    (async () => {
      const store = getStore();
      /* Home is the front door, so identity gets established here rather than
         only on Today. Without it a demo visitor who never opens Today has no
         session, and therefore no seeded history to look at. */
      const session = (await store.load()) ?? (await store.createSession(TODAYS_PLAN));
      if (session?.last_checkin) setCheckin(session.last_checkin);
      setHistory((await store.history?.()) ?? []);

      const sb = getSupabase();
      if (!sb) return;
      /* A row with no name still replaces Maya's. Keeping her name because
         someone left theirs blank greets a real person as a fictional one. */
      const { data } = await sb
        .from("profiles")
        .select("display_name, avoid_tags, preferred_minutes")
        .maybeSingle();
      if (data) {
        setName(data.display_name ?? "");
        /* Her own preferences, not the demo persona's. Recommending from
           MAYA's constants meant every account was offered Maya's shortlist. */
        setPrefs({
          avoidTags: data.avoid_tags ?? [],
          preferredMinutes: data.preferred_minutes ?? MAYA.preferred_minutes,
        });
      }
    })();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = todayName();
  const todayPlanned = week.find((d) => d.day === today);
  const isRestDay = todayPlanned?.kind === "rest";
  const peak = Math.max(1, ...week.map(planMinutes));
  const emptyWeek = week.length > 0 && isWeekEmpty(week);

  return (
    <>
      <main className="pb-28 lg:pb-10 lg:pl-56">
        {/* Greeting and capacity, as one editorial block on a tinted ground. */}
        <section className="relative overflow-hidden bg-lavender/30 px-5 pb-16 pt-10">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 text-lavender/60">
            <Blob size={320} />
          </div>

          <div className="relative mx-auto max-w-3xl lg:max-w-5xl">
            <img src="/brand/sante-mark.png" alt="Santé" className="-ml-3 w-32 sm:w-36 lg:hidden" />
            <h1 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">
              {name ? `${greeting}, ${name}` : greeting}
            </h1>

            <div className="mt-8 sm:flex sm:items-center sm:gap-10">
              {checkin ? (
                <>
                  <CapacityBloom values={toBloom(checkin)} size={168} />
                  <div className="mt-6 flex-1 sm:mt-0">
                    <p className="max-w-sm text-ink-soft">
                      That is today as you described it. Your plan already reflects it.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link
                        href="/today"
                        className="rounded-2xl bg-coral px-6 py-3.5 font-bold text-coral-on"
                      >
                        See today&rsquo;s plan
                      </Link>
                      <button
                        onClick={() => setSheetOpen(true)}
                        className="rounded-2xl bg-surface px-5 py-3.5 font-bold ring-1 ring-ink/15"
                      >
                        Update check-in
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* The Bloom's empty seat. A dashed ring reads as something
                      waiting to be filled in, where a large flat flower just
                      read as a smudge next to the text. */}
                  <div
                    aria-hidden="true"
                    className="flex h-[168px] w-[168px] shrink-0 items-center justify-center rounded-full border-2 border-dashed border-lavender text-lavender"
                  >
                    <Flower size={72} id="empty" />
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
                    <button
                      onClick={() => setSheetOpen(true)}
                      className="mt-5 rounded-2xl bg-coral px-6 py-3.5 font-bold text-coral-on"
                    >
                      Check in · 20 sec
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-5 lg:max-w-5xl">
          {/* Today, as a feature panel rather than a card in a stack. */}
          <section className="rise relative z-10 -mt-10 rounded-[26px] bg-surface p-6 shadow-[0_1px_2px_rgba(47,58,51,0.04),0_20px_50px_-30px_rgba(47,58,51,0.3)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                {/* Only "as planned" when there is a week she actually has. A
                    generated baseline described as her plan is a small lie on
                    the first screen of a brand new account, and a rest day in a
                    real week is planned even though it holds no movements. */}
                <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate">
                  {!emptyWeek && todayPlanned && (isRestDay || todayPlanned.movement_ids.length > 0)
                    ? `${today}, as planned`
                    : "Your starter session"}
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
              {/* A rest day in a week she has is a decision worth defending. In
                  a week that does not exist yet it is just an empty day, and
                  calling it deliberate would be inventing an intention. */}
              {isRestDay
                ? emptyWeek
                  ? "Nothing is planned for this week yet. Rest still counts in Progress."
                  : "Rest was planned here on purpose, and it counts in Progress."
                : "None of this is fixed. Check in and it becomes today's session."}
            </p>
          </section>

          {/* On a wide screen the offers and the week sit side by side, so the
              page stops being one narrow column with dead space either side. */}
          <div className="lg:grid lg:grid-cols-[1.55fr_1fr] lg:items-start lg:gap-8">
            {/* Collections. Full-bleed feeling row, different shape to everything else. */}
            <section className="rise rise-1 mt-10">
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-2xl">For a day like this</h2>
                <Link href="/explore" className="text-sm text-slate underline">
                  All collections
                </Link>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {recommendWorkouts({
                  avoidTags: prefs.avoidTags,
                  preferredMinutes: prefs.preferredMinutes,
                  calm,
                  limit: 3,
                }).map((w, i) => (
                  <WorkoutCard key={w.id} workout={w} index={i} />
                ))}
              </div>
            </section>

            {/* The week, as rhythm rather than a table. */}
            {week.length > 0 && (
              <section className="rise rise-2 relative mt-10 overflow-hidden rounded-[26px] bg-moss/20 p-6">
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
                    /* Scaled against the week's own busiest day, so the shape of
                       the week reads even when every session is short. */
                    const height =
                      d.kind === "rest" ? 8 : Math.max(16, Math.round((planMinutes(d) / peak) * 56));
                    return (
                      <div key={d.day} className="flex flex-1 flex-col items-center gap-1.5">
                        {/* w-full matters: without it this column collapses to zero
                            width and the bar inside it disappears entirely. */}
                        <div className="flex h-14 w-full items-end">
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
                  {emptyWeek
                    ? "Nothing planned yet. Choose a session and put it on a day."
                    : "Rest days are days, not gaps."}
                </p>

                {emptyWeek && (
                  <Link
                    href="/explore"
                    className="relative mt-4 inline-flex min-h-[44px] items-center rounded-2xl bg-surface px-5 py-3 font-bold ring-1 ring-ink/15"
                  >
                    Find sessions
                  </Link>
                )}
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
        </div>
      </main>

      {orientation && identity && (
        <Orientation identity={identity} quiet={calm} onClose={() => setOrientation(false)} />
      )}

      <CheckInPrompt
        capacity={checkin ? capacityLabel(toBloom(checkin)) : null}
        onOpen={() => setSheetOpen(true)}
      />

      <CheckInSheet
        open={sheetOpen}
        quiet={calm}
        onClose={() => setSheetOpen(false)}
        onSubmit={(c) => {
          /* Hand the answers to Today, which owns the adaptation. The sheet's
             job is collecting them without making anyone leave Home.

             Scoped to this identity, and not because two people share a tab:
             an unscoped key is indistinguishable from the old global leak, so
             Today deletes it while resolving who this is, and the check-in
             arrives as nothing. */
          writeScopedSession(PENDING_CHECKIN, identity?.id ?? null, c);
          window.location.assign("/today?adapt=1");
        }}
      />

      <AppNav />
    </>
  );
}
