"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadWeek, planMinutes, saveWeek, todayName, type DayKind, type PlannedDay } from "@/lib/week";
import { movementById } from "@/lib/demo-data";
import AppNav from "@/components/AppNav";
import { Waves } from "@/components/BrandShapes";

/**
 * The week.
 *
 * Something to adapt from, and somewhere the effect of adapting is visible.
 * Rest days are days, not gaps: they are typed the same as sessions and shown
 * with the same weight.
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
  const today = todayName();

  useEffect(() => setWeek(loadWeek()), []);

  function cycle(index: number) {
    if (!week) return;
    const order: DayKind[] = ["session", "recovery", "rest"];
    const next = [...week];
    const current = order.indexOf(next[index].kind);
    const kind = order[(current + 1) % order.length];
    next[index] = {
      ...next[index],
      kind,
      title: kind === "rest" ? "Rest" : kind === "recovery" ? "Recovery" : next[index].title,
      movement_ids: kind === "rest" ? [] : next[index].movement_ids,
    };
    setWeek(next);
    saveWeek(next);
  }

  const total = week?.reduce((s, d) => s + planMinutes(d), 0) ?? 0;
  const restDays = week?.filter((d) => d.kind === "rest").length ?? 0;

  return (
    <>
      <main className="mx-auto max-w-3xl px-5 py-10 pb-28 lg:pb-10 lg:pl-56">
        <div className="relative overflow-hidden rounded-[24px] bg-moss/20 p-6">
          <div aria-hidden="true" className="absolute -bottom-2 -right-4 text-moss/40">
            <Waves size={180} />
          </div>
          <h1 className="relative font-display text-3xl">Your week</h1>
          <p className="relative mt-1 max-w-md text-ink-soft">
            A shape to start from. Every day of it can change on the day.
          </p>
          <p className="relative mt-4 font-mono text-sm text-slate">
            {total} minutes planned · {restDays} rest day{restDays === 1 ? "" : "s"}
          </p>
        </div>

        <div className="mt-5 grid gap-2">
          {week?.map((d, i) => {
            const isToday = d.day === today;
            return (
              <div
                key={d.day}
                className={"rounded-[20px] p-5 " + KIND_STYLE[d.kind] + (isToday ? " ring-2 ring-coral" : "")}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <p className="font-display text-xl">
                      {d.day}
                      {isToday && <span className="ml-2 text-sm text-coral">today</span>}
                    </p>
                    <p className="mt-0.5 text-sm text-ink-soft">{d.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm tabular-nums">
                      {d.kind === "rest" ? "—" : `${planMinutes(d)} min`}
                    </p>
                    <button
                      onClick={() => cycle(i)}
                      className="mt-1 rounded-full bg-canvas px-3 py-1 text-xs font-bold ring-1 ring-ink/10"
                    >
                      {KIND_LABEL[d.kind]}
                    </button>
                  </div>
                </div>

                {d.movement_ids.length > 0 && (
                  <p className="mt-3 text-sm text-slate">
                    {d.movement_ids
                      .map((id) => movementById(id)?.name)
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}

                {d.kind === "rest" && (
                  <p className="mt-3 text-sm text-slate">
                    Rest is planned here on purpose, and it counts in Progress.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-[24px] bg-coral/15 p-5">
          <p className="font-bold">Today might not match the plan.</p>
          <p className="mt-1 text-sm text-ink-soft">
            Check in and Santé will build today around how you actually are. If today comes out
            much lighter, it will offer to move the heavier session rather than dropping it.
          </p>
          <Link
            href="/today"
            className="mt-4 inline-block rounded-xl bg-coral px-5 py-3 font-bold text-coral-on"
          >
            Check in
          </Link>
        </div>
      </main>
      <AppNav />
    </>
  );
}
