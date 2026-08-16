"use client";

import Link from "next/link";
import { COLLECTIONS, collectionMovements } from "@/lib/demo-data";
import AppNav from "@/components/AppNav";
import { Arch, Blob, Flower, Sprig, Waves, Asterisk } from "@/components/BrandShapes";

/**
 * Explore, organised by how a day feels rather than by muscle group.
 *
 * Collections are a point of view: "low energy days", "nothing on the floor".
 * That is the whole difference between a wellness product and a filter over a
 * database table.
 */

const ACCENT: Record<string, string> = {
  moss: "bg-moss/25",
  lavender: "bg-lavender/40",
  coral: "bg-coral/15",
  slate: "bg-surface ring-1 ring-ink/10",
};

/* A different shape per collection, so the grid does not read as six of the
   same tile with different words on them. */
const MOTIF = [Flower, Waves, Asterisk, Arch, Sprig, Blob];
const MOTIF_TONE = [
  "text-moss/45",
  "text-slate/30",
  "text-coral/30",
  "text-moss-deep/30",
  "text-moss/50",
  "text-lavender/70",
];

export default function Explore() {
  return (
    <>
      <main className="mx-auto max-w-3xl px-5 py-10 pb-28 lg:pb-10 lg:pl-56">
        <h1 className="font-display text-4xl leading-tight sm:text-5xl">Explore</h1>
        <p className="mt-2 max-w-md text-lg text-ink-soft">
          Grouped by how a day feels, not by what a muscle is called.
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {COLLECTIONS.map((c, i) => {
            const count = collectionMovements(c.id).length;
            const Motif = MOTIF[i % MOTIF.length];
            /* The first tile runs full width: a grid with no emphasis reads as
               a list of equals, and these are not equals. */
            const wide = i === 0;
            return (
              <Link
                key={c.id}
                href={`/explore/${c.id}`}
                className={
                  "group relative block overflow-hidden rounded-[24px] p-6 transition-transform " +
                  ACCENT[c.accent] +
                  (wide ? " sm:col-span-2 sm:p-8" : "")
                }
              >
                <div
                  aria-hidden="true"
                  className={
                    "pointer-events-none absolute " +
                    (wide ? "-right-6 -top-8" : "-bottom-6 -right-6") +
                    " " +
                    MOTIF_TONE[i % MOTIF_TONE.length]
                  }
                >
                  <Motif size={wide ? 150 : 110} id={c.id} />
                </div>

                <h2
                  className={
                    "relative font-display leading-tight " +
                    (wide ? "text-3xl sm:text-4xl" : "text-2xl")
                  }
                >
                  {c.title}
                </h2>
                <p className="relative mt-1.5 max-w-sm text-sm text-ink-soft">{c.blurb}</p>
                <p className="relative mt-4 font-mono text-xs text-slate">
                  {count} movements
                </p>
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
