"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { COLLECTIONS, MAYA, TODAYS_PLAN } from "@/lib/demo-data";
import { getStore, type HistoryEntry } from "@/lib/storage";
import { getSupabase } from "@/lib/supabase/client";
import CapacityBloom, { toBloom } from "@/components/CapacityBloom";
import AppNav from "@/components/AppNav";
import type { ReadinessCheckin } from "@/types/domain";

/**
 * Home.
 *
 * The first thing is the Bloom, because the question Santé asks is how you are,
 * not what you achieved. Everything below it is an offer, never an instruction.
 */
export default function Home() {
  const [name, setName] = useState(MAYA.display_name);
  const [checkin, setCheckin] = useState<ReadinessCheckin | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    (async () => {
      const store = getStore();
      const session = await store.load();
      if (session?.last_checkin) setCheckin(session.last_checkin);
      setHistory((await store.history?.()) ?? []);

      const sb = getSupabase();
      if (!sb) return;
      const { data } = await sb.from("profiles").select("display_name").maybeSingle();
      if (data?.display_name) setName(data.display_name);
    })();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <>
      <main className="mx-auto max-w-3xl px-5 py-10 pb-28 sm:pb-10">
        <img src="/brand/sante-logo.png" alt="Santé" className="-ml-3 h-14 w-auto" />
        <h1 className="mt-2 text-4xl leading-tight">
          {greeting}, {name}
        </h1>

        {/* Capacity first. */}
        <section className="mt-7 rounded-2xl bg-lavender/25 px-5 py-7">
          {checkin ? (
            <>
              <CapacityBloom values={toBloom(checkin)} size={150} />
              <Link
                href="/today"
                className="mx-auto mt-6 block w-full max-w-xs rounded-xl bg-coral px-5 py-3.5 text-center font-bold text-coral-on"
              >
                Go to today
              </Link>
            </>
          ) : (
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate">
                Today&rsquo;s capacity
              </p>
              <p className="mt-1 font-display text-3xl">Not checked in yet</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">
                Twenty seconds, four questions, and today&rsquo;s plan fits the day you are
                actually having.
              </p>
              <Link
                href="/today"
                className="mx-auto mt-6 block w-full max-w-xs rounded-xl bg-coral px-5 py-3.5 font-bold text-coral-on"
              >
                Check in
              </Link>
            </div>
          )}
        </section>

        {/* Today's plan, as a feature card. */}
        <section className="mt-4 rounded-2xl bg-surface p-5 ring-1 ring-ink/10">
          <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate">Today</p>
          <p className="mt-1.5 font-display text-2xl tabular-nums">
            {TODAYS_PLAN.total_minutes} min · {TODAYS_PLAN.intensity} ·{" "}
            {TODAYS_PLAN.movements.length} movements
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {TODAYS_PLAN.movements.map((m) => m.name).join(" · ")}
          </p>
        </section>

        {/* For you. Deterministic, because a recommendation carousel does not
            need a model to pick six things from a list. */}
        <section className="mt-8">
          <h2 className="text-2xl">For you</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {COLLECTIONS.slice(0, 3).map((c) => (
              <Link
                key={c.id}
                href={`/explore/${c.id}`}
                className="rounded-2xl bg-moss/20 p-4"
              >
                <p className="font-display text-lg leading-tight">{c.title}</p>
                <p className="mt-1 text-xs text-ink-soft">{c.blurb}</p>
              </Link>
            ))}
          </div>
        </section>

        {history.length > 0 && (
          <section className="mt-8">
            <h2 className="text-2xl">Your rhythm</h2>
            <p className="mt-1 text-sm text-ink-soft">
              {history.length} day{history.length === 1 ? "" : "s"} where you checked in and
              adjusted rather than pushing through.
            </p>
            <Link href="/progress" className="mt-3 inline-block text-sm underline">
              See progress
            </Link>
          </section>
        )}
      </main>
      <AppNav />
    </>
  );
}
