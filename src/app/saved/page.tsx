"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { movementById } from "@/lib/demo-data";
import { readSaved } from "@/components/SaveButton";
import SaveButton from "@/components/SaveButton";
import AppNav from "@/components/AppNav";
import type { Movement } from "@/types/domain";

export default function Saved() {
  const [items, setItems] = useState<Movement[] | null>(null);

  useEffect(() => {
    setItems(readSaved().map(movementById).filter((m): m is Movement => Boolean(m)));
  }, []);

  return (
    <>
      <main className="mx-auto max-w-3xl px-5 py-10 pb-28 lg:pb-10 lg:pl-56">
        <h1 className="text-3xl">Saved</h1>
        <p className="mt-1 text-ink-soft">Movements you wanted to come back to.</p>

        {items === null && <p className="mt-6 text-sm text-slate">Loading…</p>}

        {items !== null && items.length === 0 && (
          <div className="mt-6 rounded-2xl bg-surface p-6 text-center ring-1 ring-ink/10">
            <p className="text-ink-soft">Nothing saved yet.</p>
            <Link
              href="/explore"
              className="mt-4 inline-block rounded-xl bg-coral px-5 py-3 font-bold text-coral-on"
            >
              Browse Explore
            </Link>
          </div>
        )}

        {items !== null && items.length > 0 && (
          <div className="mt-6 grid gap-2">
            {items.map((m) => (
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
        )}
      </main>
      <AppNav />
    </>
  );
}
