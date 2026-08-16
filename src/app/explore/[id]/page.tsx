"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { COLLECTIONS, collectionMovements } from "@/lib/demo-data";
import AppNav from "@/components/AppNav";
import SaveButton from "@/components/SaveButton";

/** A collection, with everything in it and a way to start from here. */
export default function CollectionPage() {
  const params = useParams<{ id: string }>();
  const collection = COLLECTIONS.find((c) => c.id === params.id);
  const movements = collectionMovements(params.id);

  if (!collection) {
    return (
      <>
        <main className="mx-auto max-w-3xl px-5 py-10">
          <p className="text-ink-soft">That collection does not exist.</p>
          <Link href="/explore" className="mt-4 inline-block underline">
            Back to Explore
          </Link>
        </main>
        <AppNav />
      </>
    );
  }

  const total = movements.reduce((s, m) => s + m.minutes, 0);

  return (
    <>
      <main className="mx-auto max-w-3xl px-5 py-10 pb-28 lg:pb-10 lg:pl-56">
        <Link href="/explore" className="text-sm text-slate underline">
          Explore
        </Link>

        <h1 className="mt-3 text-4xl leading-tight">{collection.title}</h1>
        <p className="mt-2 max-w-lg text-ink-soft">{collection.blurb}</p>
        <p className="mt-3 font-mono text-sm text-slate">
          {movements.length} movements · {total} min if you did all of them
        </p>

        <div className="mt-7 grid gap-2">
          {movements.map((m) => (
            <div key={m.id} className="rounded-2xl bg-surface p-5 ring-1 ring-ink/10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl">{m.name}</h2>
                  <p className="mt-0.5 font-mono text-xs text-slate">
                    {m.minutes} min · {m.intensity}
                  </p>
                </div>
                <SaveButton movementId={m.id} />
              </div>
              <p className="mt-2 text-sm text-ink-soft">{m.instructions}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl bg-coral/15 p-5">
          <p className="font-bold">Feeling different today?</p>
          <p className="mt-1 text-sm text-ink-soft">
            Check in and Santé will build today&rsquo;s session around how you actually are.
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
