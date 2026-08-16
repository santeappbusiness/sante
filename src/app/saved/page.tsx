"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { workoutById, type Workout } from "@/lib/workouts";
import { readSaved } from "@/components/SaveButton";
import { WorkoutCard } from "@/components/WorkoutCard";
import AppNav from "@/components/AppNav";
import { Blob } from "@/components/BrandShapes";

export default function Saved() {
  const [items, setItems] = useState<Workout[] | null>(null);

  useEffect(() => {
    setItems(readSaved().map(workoutById).filter((w): w is Workout => Boolean(w)));
  }, []);

  return (
    <>
      <main className="pb-28 lg:pb-10 lg:pl-56">
        <section className="relative overflow-hidden bg-lavender/30 px-5 pb-14 pt-10">
          <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-14 text-lavender/60">
            <Blob size={260} />
          </div>
          <div className="relative mx-auto max-w-3xl">
            <h1 className="font-display text-4xl leading-tight sm:text-5xl">Saved</h1>
            <p className="mt-2 text-lg text-ink-soft">Sessions you wanted to come back to.</p>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-5">
          {items === null && <p className="mt-8 text-sm text-slate">Loading…</p>}

          {items !== null && items.length === 0 && (
            <div className="relative z-10 -mt-8 rounded-[24px] bg-surface p-8 text-center shadow-[0_1px_2px_rgba(47,58,51,0.04),0_20px_50px_-32px_rgba(47,58,51,0.35)]">
              <p className="font-display text-2xl">Nothing saved yet</p>
              <p className="mx-auto mt-2 max-w-sm text-ink-soft">
                Save a session you want to return to and it will wait here.
              </p>
              <Link
                href="/explore"
                className="mt-5 inline-block rounded-2xl bg-coral px-6 py-3.5 font-bold text-coral-on"
              >
                Browse sessions
              </Link>
            </div>
          )}

          {items !== null && items.length > 0 && (
            <div className="relative z-10 -mt-8 grid gap-3 sm:grid-cols-2">
              {items.map((w, i) => (
                <WorkoutCard key={w.id} workout={w} index={i} />
              ))}
            </div>
          )}
        </div>
      </main>
      <AppNav />
    </>
  );
}
