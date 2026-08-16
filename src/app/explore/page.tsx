"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { COLLECTIONS, WORKOUTS, workoutsInCollection } from "@/lib/workouts";
import { WorkoutCard } from "@/components/WorkoutCard";
import AppNav from "@/components/AppNav";
import { Blob } from "@/components/BrandShapes";

/**
 * Explore.
 *
 * Workouts first, collections as the way through them. Previously a collection
 * opened onto a list of individual movements, which made a five minute
 * collection contain eighty minutes of exercises and made the whole app read as
 * a database with a nice font.
 */
export default function Explore() {
  const [query, setQuery] = useState("");

  const featured = useMemo(() => WORKOUTS.filter((w) => w.featured), []);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return WORKOUTS.filter((w) =>
      (w.title + " " + w.description + " " + w.intent).toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <>
      <main className="pb-28 lg:pb-10 lg:pl-56">
        <section className="relative overflow-hidden bg-moss/20 px-5 pb-14 pt-10">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 text-moss/40">
            <Blob size={300} />
          </div>
          <div className="relative mx-auto max-w-4xl">
            <h1 className="font-display text-4xl leading-tight sm:text-5xl">Explore</h1>
            <p className="mt-2 max-w-md text-lg text-ink-soft">
              Sessions grouped by how a day feels, not by what a muscle is called.
            </p>

            <label className="sr-only" htmlFor="explore-search">
              Search workouts
            </label>
            <input
              id="explore-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sessions"
              className="mt-6 w-full max-w-md rounded-2xl bg-surface px-5 py-3.5 ring-1 ring-ink/10 placeholder:text-slate/70"
            />
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-5">
          {results ? (
            <section className="mt-8">
              <h2 className="font-display text-2xl">
                {results.length} session{results.length === 1 ? "" : "s"}
              </h2>
              {results.length === 0 ? (
                <p className="mt-3 rounded-2xl bg-surface p-6 text-ink-soft ring-1 ring-ink/10">
                  Nothing matches that. Try a feeling rather than a body part: quiet, gentle,
                  five minutes.
                </p>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {results.map((w, i) => (
                    <WorkoutCard key={w.id} workout={w} index={i} />
                  ))}
                </div>
              )}
            </section>
          ) : (
            <>
              <section className="relative z-10 -mt-8">
                <div className="grid gap-3 sm:grid-cols-2">
                  {featured.slice(0, 2).map((w, i) => (
                    <WorkoutCard key={w.id} workout={w} size="featured" index={i} />
                  ))}
                </div>
              </section>

              <section className="mt-10">
                <h2 className="font-display text-2xl">Collections</h2>
                <p className="mt-1 text-ink-soft">Every one holds sessions, not exercises.</p>

                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {COLLECTIONS.map((c) => {
                    const count = workoutsInCollection(c.id).length;
                    if (count === 0) return null;
                    return (
                      <Link
                        key={c.id}
                        href={`/explore/${c.id}`}
                        className="rounded-2xl bg-surface px-5 py-4 ring-1 ring-ink/10 hover:ring-ink/25"
                      >
                        <p className="font-display text-lg leading-tight">{c.title}</p>
                        <p className="mt-1 text-sm text-ink-soft">{c.blurb}</p>
                        <p className="mt-2 font-mono text-xs text-slate">
                          {count} session{count === 1 ? "" : "s"}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </section>

              <section className="mt-10">
                <h2 className="font-display text-2xl">Everything</h2>
                <div className="mt-4 grid gap-2">
                  {WORKOUTS.map((w, i) => (
                    <WorkoutCard key={w.id} workout={w} size="row" index={i} />
                  ))}
                </div>
              </section>
            </>
          )}

          <p className="mt-10 max-w-lg text-xs leading-relaxed text-slate">
            Any session here can be adapted to today. Nothing in Santé assumes you should be
            able to do something just because it is listed.
          </p>
        </div>
      </main>
      <AppNav />
    </>
  );
}
