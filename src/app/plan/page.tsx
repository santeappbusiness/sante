"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  clearDay,
  loadWeek,
  moveDay,
  planMinutes,
  setDayKind,
  todayName,
  type DayKind,
  type PlannedDay,
} from "@/lib/week";
import { workoutById } from "@/lib/workouts";
import { movementById } from "@/lib/demo-data";
import AppNav from "@/components/AppNav";
import { Blob, Waves } from "@/components/BrandShapes";

/**
 * The week, as something you can actually change.
 *
 * Every day is typed rather than being either "a workout" or "nothing", so rest
 * is a decision with a place on the page rather than a gap between real days.
 *
 * Editing is explicit: pick a day, then say what to do with it. No drag and
 * drop, which is unreliable on touch and unusable with a keyboard.
 */

const KIND_STYLE: Record<DayKind, string> = {
  session: "bg-surface ring-1 ring-ink/10",
  recovery: "bg-lavender/35",
  rest: "bg-moss/20",
};

const KIND_LABEL: Record<DayKind, string> = {
  session: "Session",
  recovery: "Recovery",
  rest: "Rest",
};

export default function Plan() {
  const [week, setWeek] = useState<PlannedDay[] | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const today = todayName();

  useEffect(() => setWeek(loadWeek()), []);

  const total = week?.reduce((s, d) => s + planMinutes(d), 0) ?? 0;
  const restDays = week?.filter((d) => d.kind === "rest").length ?? 0;
  const sessions = week?.filter((d) => d.kind !== "rest").length ?? 0;

  return (
    <>
      <main className="pb-28 lg:pb-10 lg:pl-56">
        <section className="relative overflow-hidden bg-moss/25 px-5 pb-14 pt-10">
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-4 -right-8 text-moss/40">
            <Waves size={230} />
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute -left-20 -top-16 text-moss/25">
            <Blob size={240} />
          </div>

          <div className="relative mx-auto max-w-3xl">
            <h1 className="font-display text-4xl leading-tight sm:text-5xl">Your week</h1>
            <p className="mt-2 max-w-md text-lg text-ink-soft">
              A shape to start from. Every day of it can still change on the day.
            </p>

            <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
              {[
                ["Sessions", String(sessions)],
                ["Rest days", String(restDays)],
                ["Planned", `${total} min`],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-bold uppercase tracking-[0.13em] text-slate">
                    {label}
                  </dt>
                  <dd className="mt-0.5 font-display text-2xl tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-5">
          <div className="relative z-10 -mt-8 grid gap-2">
            {week?.map((d) => {
              const isToday = d.day === today;
              const isEditing = editing === d.day;
              const workout = d.workout_id ? workoutById(d.workout_id) : undefined;

              return (
                <div
                  key={d.day}
                  className={
                    "rounded-[22px] p-5 transition-shadow " +
                    KIND_STYLE[d.kind] +
                    (isToday ? " ring-2 ring-coral" : "")
                  }
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-xl">
                        {d.day}
                        {isToday && <span className="ml-2 text-sm text-coral">today</span>}
                      </p>
                      <p className="mt-0.5 text-sm text-ink-soft">{d.title}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm tabular-nums text-slate">
                        {d.kind === "rest" ? "—" : `${planMinutes(d)} min`}
                      </span>
                      <button
                        onClick={() => setEditing(isEditing ? null : d.day)}
                        aria-expanded={isEditing}
                        className="rounded-full bg-canvas px-3.5 py-1.5 text-xs font-bold ring-1 ring-ink/10"
                      >
                        {isEditing ? "Done" : "Edit"}
                      </button>
                    </div>
                  </div>

                  {d.movement_ids.length > 0 && !isEditing && (
                    <p className="mt-3 text-sm text-slate">
                      {d.movement_ids
                        .map((id) => movementById(id)?.name)
                        .filter(Boolean)
                        .slice(0, 4)
                        .join(" · ")}
                      {d.movement_ids.length > 4 && ` +${d.movement_ids.length - 4}`}
                    </p>
                  )}

                  {d.kind === "rest" && !isEditing && (
                    <p className="mt-3 text-sm text-slate">
                      Rest is planned here on purpose, and it counts in Progress.
                    </p>
                  )}

                  {isEditing && (
                    <div className="mt-4 border-t border-ink/10 pt-4">
                      <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate">
                        What is this day?
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(["session", "recovery", "rest"] as DayKind[]).map((k) => (
                          <button
                            key={k}
                            onClick={() => setWeek(setDayKind(d.day, k))}
                            aria-pressed={d.kind === k}
                            className={
                              "rounded-full px-4 py-2 text-sm ring-1 " +
                              (d.kind === k
                                ? "bg-moss/40 font-bold ring-transparent"
                                : "bg-surface ring-ink/15")
                            }
                          >
                            {KIND_LABEL[k]}
                          </button>
                        ))}
                      </div>

                      <p className="mt-4 text-xs font-bold uppercase tracking-[0.13em] text-slate">
                        Move it to
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {week
                          .filter((other) => other.day !== d.day)
                          .map((other) => (
                            <button
                              key={other.day}
                              onClick={() => {
                                setWeek(moveDay(d.day, other.day));
                                setEditing(null);
                              }}
                              className="rounded-full bg-surface px-3.5 py-2 text-sm ring-1 ring-ink/15 hover:ring-ink/30"
                            >
                              {other.day.slice(0, 3)}
                            </button>
                          ))}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          href="/explore"
                          className="rounded-xl bg-coral px-4 py-2.5 text-sm font-bold text-coral-on"
                        >
                          Choose a session
                        </Link>
                        {workout && (
                          <Link
                            href={`/workout/${workout.id}`}
                            className="rounded-xl bg-surface px-4 py-2.5 text-sm font-bold ring-1 ring-ink/15"
                          >
                            Open session
                          </Link>
                        )}
                        {d.kind !== "rest" && (
                          <button
                            onClick={() => {
                              setWeek(clearDay(d.day));
                              setEditing(null);
                            }}
                            className="rounded-xl px-4 py-2.5 text-sm text-ink-soft underline"
                          >
                            Clear the day
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {isToday && !isEditing && d.kind !== "rest" && (
                    <Link
                      href="/today"
                      className="mt-4 inline-block rounded-xl bg-coral px-5 py-2.5 text-sm font-bold text-coral-on"
                    >
                      Open today
                    </Link>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-[24px] bg-lavender/30 p-6">
            <p className="font-display text-2xl">Today might not match the plan.</p>
            <p className="mt-1.5 max-w-md text-ink-soft">
              Check in and Santé builds today around how you actually are. If today comes out
              much lighter, it offers to move the heavier session rather than dropping it.
            </p>
            <Link
              href="/today"
              className="mt-4 inline-block rounded-2xl bg-coral px-6 py-3.5 font-bold text-coral-on"
            >
              Check in
            </Link>
          </div>
        </div>
      </main>
      <AppNav />
    </>
  );
}
