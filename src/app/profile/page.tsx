"use client";

import { useEffect, useState } from "react";
import { MAYA } from "@/lib/demo-data";
import { getSupabase } from "@/lib/supabase/client";
import AppNav from "@/components/AppNav";
import { Blob, Flower, Sprig } from "@/components/BrandShapes";
import CalmModeToggle, { readCalm } from "@/components/CalmMode";

/**
 * Profile, and the part that matters most: what Santé remembers.
 *
 * Every remembered thing is shown with where it came from, and nothing here was
 * inferred about the person. If it is on this page, they told us or they agreed
 * to it.
 */

type Remembered = { label: string; value: string; source: string };

export default function Profile() {
  const [remembered, setRemembered] = useState<Remembered[]>([]);
  const [loading, setLoading] = useState(true);
  const [calm, setCalm] = useState(false);

  useEffect(() => setCalm(readCalm(false)), []);

  useEffect(() => {
    (async () => {
      const sb = getSupabase();
      if (!sb) {
        setLoading(false);
        return;
      }
      const { data } = await sb
        .from("profiles")
        .select("preferred_minutes, avoid_tags, nd_mode")
        .maybeSingle();

      const rows: Remembered[] = [];
      if (data?.preferred_minutes)
        rows.push({
          label: "Preferred session length",
          value: `${data.preferred_minutes} minutes`,
          source: "From onboarding, updated when you agreed to remember it",
        });
      if (data?.avoid_tags?.length)
        rows.push({
          label: "Movements to avoid",
          value: (data.avoid_tags as string[]).join(", "),
          source: "You told us during onboarding",
        });
      rows.push({
        label: "Calm mode",
        value: data?.nd_mode ? "On" : "Off",
        source: "Your accessibility choice",
      });
      setRemembered(rows);
      setLoading(false);
    })();
  }, []);

  return (
    <>
      <main className="pb-28 lg:pb-10 lg:pl-56">
        <section className="relative overflow-hidden bg-lavender/30 px-5 pb-10 pt-10">
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-14 text-lavender/60">
            <Blob size={280} />
          </div>
          <div className="relative mx-auto max-w-3xl">
            <img src="/brand/sante-logo.png" alt="Santé" className="-ml-3 w-32 sm:w-36 lg:hidden" />
            <h1 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">
              {MAYA.display_name}
            </h1>
            <p className="mt-2 max-w-md text-ink-soft">{MAYA.goal}</p>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-5">
        <section className="mt-9">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="text-moss">
              <Sprig size={30} />
            </span>
            <h2 className="font-display text-2xl">What Santé remembers</h2>
          </div>
          <p className="mt-1 max-w-lg text-sm text-ink-soft">
            Only things you told us or agreed to. Santé does not guess about you, and nothing
            here is a conclusion about your health.
          </p>

          {loading && <p className="mt-4 text-sm text-slate">Loading…</p>}

          {!loading && remembered.length === 0 && (
            <p className="mt-4 rounded-2xl bg-surface p-5 text-sm text-ink-soft ring-1 ring-ink/10">
              Nothing remembered yet. Santé will ask before saving anything.
            </p>
          )}

          <ul className="mt-4 grid gap-2">
            {remembered.map((r) => (
              <li
                key={r.label}
                className="rounded-[22px] bg-surface p-5 shadow-[0_1px_2px_rgba(47,58,51,0.04),0_14px_36px_-30px_rgba(47,58,51,0.3)]"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-bold">{r.label}</p>
                  <p className="font-mono text-sm">{r.value}</p>
                </div>
                <p className="mt-1 text-xs text-slate">{r.source}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl">In your own words</h2>
          <div className="relative mt-3 overflow-hidden rounded-[24px] bg-lavender/35 p-6">
            <div aria-hidden="true" className="absolute -bottom-4 -right-4 text-lavender/70">
              <Flower size={90} />
            </div>
            <p className="relative max-w-lg text-lg leading-relaxed text-ink-soft">
              {MAYA.context}
            </p>
          </div>
          <p className="mt-2 max-w-lg text-xs text-slate">
            This is yours to write and yours to change. Santé never treats it as medical
            information and never uses it to justify a recommendation.
          </p>
        </section>

        <section className="mt-10">
          <CalmModeToggle value={calm} onChange={setCalm} />
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl">Privacy</h2>
          <ul className="mt-3 grid gap-2 text-sm text-ink-soft">
            <li className="rounded-xl bg-surface p-4 ring-1 ring-ink/10">
              Your check-ins are readable only by you. That is enforced by the database, not
              just by the app.
            </li>
            <li className="rounded-xl bg-surface p-4 ring-1 ring-ink/10">
              Reset the demo from the Today page to start over with a fresh session.
            </li>
            <li className="rounded-xl bg-surface p-4 ring-1 ring-ink/10">
              Santé is a wellness tool. It does not diagnose, treat, or give medical advice.
            </li>
          </ul>
        </section>

        <section className="mt-10">
          <button
            onClick={async () => {
              const sb = getSupabase();
              await sb?.auth.signOut();
              window.location.replace("/");
            }}
            className="rounded-xl bg-surface px-5 py-3 font-bold ring-1 ring-ink/15"
          >
            Sign out
          </button>
        </section>
        </div>
      </main>
      <AppNav />
    </>
  );
}
