"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  COLLECTIONS,
  INTENTS,
  WORKOUTS,
  workoutById,
  workoutsForIntent,
  workoutsInCollection,
  type Workout,
} from "@/lib/workouts";
import { loadWeek } from "@/lib/week";
import { readSaved } from "@/components/SaveButton";
import { WorkoutCard } from "@/components/WorkoutCard";
import AppNav from "@/components/AppNav";
import { Blob } from "@/components/BrandShapes";
import { SwapIcon } from "@/components/ControlIcons";

/**
 * Explore, organised by why someone came rather than by what we happen to have.
 *
 * It used to open on two featured sessions, then every collection, then the
 * whole catalogue in one list. That is browsable on a good day and a wall of
 * decisions on a bad one, which is the wrong shape for this product in
 * particular.
 *
 * Now the first question is what she needs, in her words. Choosing an answer
 * shows a few sessions rather than a category to go and read. The collections
 * and the full catalogue are still here, folded away, because someone who
 * wants to browse should be able to and should not have to by default.
 *
 * Search stays at the top, because knowing what you want is its own intent.
 */

const PREVIEW = 4;

export default function Explore() {
  const [query, setQuery] = useState("");
  const [intent, setIntent] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [planned, setPlanned] = useState<string[]>([]);
  const [surprise, setSurprise] = useState<Workout | null>(null);

  useEffect(() => {
    setSaved(readSaved());
    setPlanned(
      loadWeek()
        .map((d) => d.workout_id)
        .filter((id): id is string => Boolean(id))
    );
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return WORKOUTS.filter((w) =>
      (w.title + " " + w.description + " " + w.intent).toLowerCase().includes(q)
    );
  }, [query]);

  /* What she saved or put in her week, most recent first, with no duplicates.
     If there is nothing yet we say so rather than quietly showing something
     else and calling it familiar. */
  const familiar = useMemo(() => {
    const ids = [...saved, ...planned];
    return [...new Set(ids)]
      .map(workoutById)
      .filter((w): w is Workout => Boolean(w));
  }, [saved, planned]);

  const pickSurprise = useCallback(() => {
    const pool = WORKOUTS.filter((w) => w.id !== surprise?.id);
    setSurprise(pool[Math.floor(Math.random() * pool.length)] ?? null);
  }, [surprise]);

  function chooseIntent(id: string) {
    const next = intent === id ? null : id;
    setIntent(next);
    setShowAll(false);
    if (next === "surprise") pickSurprise();
  }

  const chosen = INTENTS.find((i) => i.id === intent) ?? null;
  const matches =
    intent === "familiar"
      ? familiar
      : intent === "surprise"
      ? surprise
        ? [surprise]
        : []
      : intent
      ? workoutsForIntent(intent)
      : [];
  const shown = showAll ? matches : matches.slice(0, PREVIEW);

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
              Sessions for women, grouped by how a day feels rather than by what a muscle is called.
            </p>

            <label className="sr-only" htmlFor="explore-search">
              Search sessions
            </label>
            <input
              id="explore-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sessions"
              className="mt-6 min-h-[48px] w-full max-w-md rounded-2xl bg-surface px-5 py-3.5 ring-1 ring-ink/10 placeholder:text-slate/70"
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
              {/* The first question, and the only one that has to be answered. */}
              <section className="relative z-10 -mt-8 rounded-[26px] bg-surface p-6 shadow-[0_1px_2px_rgba(47,58,51,0.04),0_20px_50px_-32px_rgba(47,58,51,0.35)]">
                <h2 className="font-display text-2xl">What do you need today?</h2>
                <p className="mt-1 text-ink-soft">Pick one. Nothing here is a commitment.</p>

                <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="What do you need today?">
                  {INTENTS.map((i) => {
                    const on = intent === i.id;
                    return (
                      <button
                        key={i.id}
                        aria-pressed={on}
                        onClick={() => chooseIntent(i.id)}
                        className={
                          "inline-flex min-h-[44px] items-center rounded-full px-4 py-2.5 text-sm ring-1 " +
                          (on
                            ? "bg-moss/40 font-bold ring-transparent"
                            : "bg-canvas ring-ink/10 hover:ring-ink/30")
                        }
                      >
                        {on && <span aria-hidden="true">✓&nbsp;</span>}
                        {i.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              {chosen && (
                <section className="mt-8" aria-live="polite">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <div>
                      <h2 className="font-display text-2xl">{chosen.label}</h2>
                      <p className="mt-1 text-ink-soft">{chosen.blurb}</p>
                    </div>
                    {intent === "surprise" && (
                      <button
                        onClick={pickSurprise}
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm ring-1 ring-ink/15"
                      >
                        <span aria-hidden="true">
                          <SwapIcon size={16} />
                        </span>
                        Something else
                      </button>
                    )}
                  </div>

                  {matches.length === 0 ? (
                    <p className="mt-4 rounded-2xl bg-surface p-6 text-ink-soft ring-1 ring-ink/10">
                      {intent === "familiar"
                        ? "Nothing saved or planned yet. Save a session from its page, or put one in your week, and it will show up here."
                        : "Nothing in the library matches that yet."}
                    </p>
                  ) : (
                    <>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {shown.map((w, i) => (
                          <WorkoutCard
                            key={w.id}
                            workout={w}
                            size={intent === "surprise" ? "featured" : "default"}
                            index={i}
                          />
                        ))}
                      </div>

                      {matches.length > PREVIEW && !showAll && (
                        <button
                          onClick={() => setShowAll(true)}
                          className="mt-4 min-h-[44px] w-full rounded-2xl bg-surface px-5 py-3 font-bold ring-1 ring-ink/15"
                        >
                          Show all {matches.length}
                        </button>
                      )}
                    </>
                  )}
                </section>
              )}

              {/* Everything else, present and out of the way. */}
              <details className="mt-8 rounded-[24px] bg-surface p-6 ring-1 ring-ink/10">
                <summary className="cursor-pointer font-display text-2xl">
                  Browse by collection
                </summary>
                <p className="mt-2 text-ink-soft">Every one holds sessions, not exercises.</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {COLLECTIONS.map((c) => {
                    const count = workoutsInCollection(c.id).length;
                    if (count === 0) return null;
                    return (
                      <Link
                        key={c.id}
                        href={`/explore/${c.id}`}
                        className="rounded-2xl bg-canvas px-5 py-4 ring-1 ring-ink/10 hover:ring-ink/25"
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
              </details>

              <details className="mt-2 rounded-[24px] bg-surface p-6 ring-1 ring-ink/10">
                <summary className="cursor-pointer font-display text-2xl">
                  All {WORKOUTS.length} sessions
                </summary>
                <div className="mt-4 grid gap-2">
                  {WORKOUTS.map((w, i) => (
                    <WorkoutCard key={w.id} workout={w} size="row" index={i} />
                  ))}
                </div>
              </details>
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
