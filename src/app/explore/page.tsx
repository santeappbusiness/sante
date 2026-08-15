"use client";

import Link from "next/link";
import { COLLECTIONS, collectionMovements } from "@/lib/demo-data";
import AppNav from "@/components/AppNav";

/**
 * Explore, organised by how a day feels rather than by muscle group.
 *
 * Collections are a point of view: "low energy days", "nothing on the floor".
 * That is the whole difference between a wellness product and a filter over a
 * database table.
 */

const ACCENT: Record<string, string> = {
  moss: "bg-moss/25",
  lavender: "bg-lavender/35",
  coral: "bg-coral/15",
  slate: "bg-surface ring-1 ring-ink/10",
};

export default function Explore() {
  return (
    <>
      <main className="mx-auto max-w-3xl px-5 py-10 pb-28 sm:pb-10">
        <h1 className="text-3xl">Explore</h1>
        <p className="mt-1 max-w-md text-ink-soft">
          Grouped by how a day feels, not by what a muscle is called.
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {COLLECTIONS.map((c) => {
            const count = collectionMovements(c.id).length;
            return (
              <Link
                key={c.id}
                href={`/explore/${c.id}`}
                className={"block rounded-2xl p-5 " + ACCENT[c.accent]}
              >
                <h2 className="font-display text-2xl leading-tight">{c.title}</h2>
                <p className="mt-1.5 text-sm text-ink-soft">{c.blurb}</p>
                <p className="mt-3 font-mono text-xs text-slate">{count} movements</p>
              </Link>
            );
          })}
        </div>

        <p className="mt-8 max-w-lg text-xs leading-relaxed text-slate">
          Anything here can be adapted to today. Nothing in Santé assumes you should be able to
          do a session just because it is listed.
        </p>
      </main>
      <AppNav />
    </>
  );
}
