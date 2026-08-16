"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { collectionById, workoutsInCollection } from "@/lib/workouts";
import { WorkoutCard } from "@/components/WorkoutCard";
import AppNav from "@/components/AppNav";
import { Blob } from "@/components/BrandShapes";

/** A collection: the sessions inside it, largest first. */
export default function CollectionPage() {
  const params = useParams<{ id: string }>();
  const collection = collectionById(params.id);
  const workouts = workoutsInCollection(params.id);

  if (!collection) {
    return (
      <>
        <main className="mx-auto max-w-3xl px-5 py-10 lg:pl-56">
          <p className="text-ink-soft">That collection does not exist.</p>
          <Link href="/explore" className="mt-4 inline-block underline">
            Back to Explore
          </Link>
        </main>
        <AppNav />
      </>
    );
  }

  return (
    <>
      <main className="pb-28 lg:pb-10 lg:pl-56">
        <section className="relative overflow-hidden bg-lavender/30 px-5 pb-14 pt-10">
          <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-14 text-lavender/60">
            <Blob size={280} />
          </div>
          <div className="relative mx-auto max-w-4xl">
            <Link href="/explore" className="text-sm text-slate underline">
              Explore
            </Link>
            <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
              {collection.title}
            </h1>
            <p className="mt-2 max-w-lg text-lg text-ink-soft">{collection.blurb}</p>
            <p className="mt-3 font-mono text-sm text-slate">
              {workouts.length} session{workouts.length === 1 ? "" : "s"}
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-5">
          <div className="relative z-10 -mt-8 grid gap-3 sm:grid-cols-2">
            {workouts.map((w, i) => (
              <WorkoutCard key={w.id} workout={w} size={i === 0 ? "featured" : "default"} index={i} />
            ))}
          </div>

          <div className="mt-8 rounded-[24px] bg-coral/15 p-6">
            <p className="font-display text-2xl">Feeling different today?</p>
            <p className="mt-1.5 text-ink-soft">
              Check in and Santé will build today around how you actually are.
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
