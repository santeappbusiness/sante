"use client";

import { useEffect, useState } from "react";
import { MAYA } from "@/lib/demo-data";
import { getSupabase } from "@/lib/supabase/client";
import AppNav from "@/components/AppNav";
import CalmModeToggle, { readCalm } from "@/components/CalmMode";
import { Blob, Flower, Sprig } from "@/components/BrandShapes";

/**
 * Profile: the settings that actually change what Santé does.
 *
 * Everything here is editable and everything here is used. Preferred length
 * caps today's target, avoided movements are excluded before the model is
 * reached, and calm mode changes both the interface and how a session is built.
 * A settings page full of switches that go nowhere is worse than no settings
 * page at all.
 *
 * "What Santé remembers" shows where each thing came from, because a product
 * that learns about someone owes them a way to see it and change it.
 */

const GOALS = [
  "Stay consistent without forcing myself through bad days",
  "Build strength gently",
  "Move more easily day to day",
  "Reduce how overwhelming exercise feels",
];

const DURATIONS = [5, 10, 15, 20, 30, 45];

const RESTRICTIONS = [
  { tag: "jumping", label: "No jumping or impact" },
  { tag: "floor_work", label: "Nothing on the floor" },
  { tag: "strength", label: "Nothing against resistance" },
  { tag: "standing", label: "Prefer to stay seated" },
];

const EQUIPMENT = ["mat", "dumbbells", "bands", "bench"];

type Profile = {
  display_name: string;
  goal: string;
  preferred_minutes: number;
  avoid_tags: string[];
  nd_mode: boolean;
  context: string | null;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [equipment, setEquipment] = useState<string[]>(["mat"]);
  const [calm, setCalm] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(true);

  useEffect(() => {
    (async () => {
      setCalm(readCalm(false));
      try {
        const raw = localStorage.getItem("sante-equipment");
        if (raw) setEquipment(JSON.parse(raw));
      } catch {}

      const fallback = {
        display_name: MAYA.display_name,
        goal: MAYA.goal,
        preferred_minutes: MAYA.preferred_minutes,
        avoid_tags: MAYA.avoid_tags,
        nd_mode: MAYA.neurodivergent_mode,
        context: MAYA.context,
      } as Profile;

      const sb = getSupabase();
      if (!sb) {
        setProfile(fallback);
        return;
      }

      const { data: session } = await sb.auth.getSession();
      setEmail(session.session?.user?.email ?? null);
      setIsDemo(Boolean(session.session?.user?.is_anonymous));

      const { data } = await sb
        .from("profiles")
        .select("display_name, goal, preferred_minutes, avoid_tags, nd_mode, context")
        .maybeSingle();

      setProfile(data ? (data as Profile) : fallback);
    })();
  }, []);

  async function patch(next: Partial<Profile>, label: string) {
    setProfile((p) => (p ? { ...p, ...next } : p));
    setSaved(label);
    setTimeout(() => setSaved(null), 2200);

    const sb = getSupabase();
    if (!sb) return;
    const { data } = await sb.auth.getSession();
    const id = data.session?.user?.id;
    if (!id) return;
    await sb.from("profiles").update(next).eq("id", id);
  }

  function toggleEquipment(item: string) {
    const next = equipment.includes(item)
      ? equipment.filter((e) => e !== item)
      : [...equipment, item];
    setEquipment(next);
    try {
      localStorage.setItem("sante-equipment", JSON.stringify(next));
    } catch {}
  }

  if (!profile) {
    return (
      <>
        <main className="mx-auto max-w-3xl px-5 py-10 lg:pl-56">
          <p className="text-ink-soft">Loading your profile…</p>
        </main>
        <AppNav />
      </>
    );
  }

  return (
    <>
      <main className="pb-28 lg:pb-10 lg:pl-56">
        <section className="relative overflow-hidden bg-lavender/30 px-5 pb-14 pt-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-14 text-lavender/60"
          >
            <Blob size={280} />
          </div>
          <div className="relative mx-auto max-w-3xl">
            <img
              src="/brand/sante-mark.png"
              alt="Santé"
              className="-ml-3 w-32 sm:w-36 lg:hidden"
            />
            <h1 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">
              {profile.display_name}
            </h1>
            <p className="mt-1 font-mono text-sm text-slate">
              {email ?? (isDemo ? "Demo account · nothing to sign up for" : "")}
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-5">
          {saved && (
            <p role="status" className="-mt-4 rounded-2xl bg-moss/30 px-5 py-3 text-sm font-bold">
              {saved} saved
            </p>
          )}

          <section className="mt-9">
            <h2 className="font-display text-2xl">What you want from this</h2>
            <div className="mt-3 grid gap-2">
              {GOALS.map((g) => (
                <button
                  key={g}
                  aria-pressed={profile.goal === g}
                  onClick={() => patch({ goal: g }, "Goal")}
                  className={
                    "rounded-2xl px-5 py-4 text-left ring-1 " +
                    (profile.goal === g
                      ? "bg-moss/30 font-bold ring-transparent"
                      : "bg-surface ring-ink/10 hover:ring-ink/25")
                  }
                >
                  {profile.goal === g && <span aria-hidden="true">✓ </span>}
                  {g}
                </button>
              ))}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="font-display text-2xl">How long a session usually is</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Santé never plans longer than this, and shortens it further on a hard day.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  aria-pressed={profile.preferred_minutes === d}
                  onClick={() => patch({ preferred_minutes: d }, "Session length")}
                  className={
                    "rounded-2xl px-5 py-3 font-display text-xl tabular-nums ring-1 " +
                    (profile.preferred_minutes === d
                      ? "bg-moss/30 ring-transparent"
                      : "bg-surface ring-ink/10")
                  }
                >
                  {d} min
                </button>
              ))}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="font-display text-2xl">Movements to keep out</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Excluded by Santé&rsquo;s own code before the assistant sees anything, so nothing
              can talk past them.
            </p>
            <div className="mt-3 grid gap-2">
              {RESTRICTIONS.map((r) => {
                const on = profile.avoid_tags?.includes(r.tag);
                return (
                  <button
                    key={r.tag}
                    aria-pressed={on}
                    onClick={() =>
                      patch(
                        {
                          avoid_tags: on
                            ? profile.avoid_tags.filter((t) => t !== r.tag)
                            : [...(profile.avoid_tags ?? []), r.tag],
                        },
                        "Movement preferences"
                      )
                    }
                    className={
                      "rounded-2xl px-5 py-4 text-left ring-1 " +
                      (on ? "bg-moss/30 font-bold ring-transparent" : "bg-surface ring-ink/10")
                    }
                  >
                    {on && <span aria-hidden="true">✓ </span>}
                    {r.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="font-display text-2xl">What you have</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {EQUIPMENT.map((item) => (
                <button
                  key={item}
                  aria-pressed={equipment.includes(item)}
                  onClick={() => toggleEquipment(item)}
                  className={
                    "rounded-full px-4 py-2.5 text-sm capitalize ring-1 " +
                    (equipment.includes(item)
                      ? "bg-moss/30 font-bold ring-transparent"
                      : "bg-surface ring-ink/15")
                  }
                >
                  {equipment.includes(item) && <span aria-hidden="true">✓ </span>}
                  {item}
                </button>
              ))}
            </div>
          </section>

          <section className="mt-10">
            <CalmModeToggle
              value={calm}
              onChange={(v) => {
                setCalm(v);
                patch({ nd_mode: v }, "Calm mode");
              }}
            />
          </section>

          <section className="mt-10">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="text-moss">
                <Sprig size={30} />
              </span>
              <h2 className="font-display text-2xl">What Santé remembers</h2>
            </div>
            <p className="mt-1 max-w-lg text-sm text-ink-soft">
              Only what you told us or agreed to. Santé does not guess about you, and nothing
              here is a conclusion about your health.
            </p>

            <ul className="mt-4 grid gap-2">
              {[
                {
                  label: "Preferred session length",
                  value: `${profile.preferred_minutes} minutes`,
                  source: "Set by you, and updated when you agree to remember a shorter one",
                },
                {
                  label: "Movements to avoid",
                  value: profile.avoid_tags?.length ? profile.avoid_tags.join(", ") : "None",
                  source: "Set by you",
                },
                {
                  label: "Calm mode",
                  value: calm ? "On" : "Off",
                  source: "Your accessibility choice",
                },
                {
                  label: "Equipment",
                  value: equipment.length ? equipment.join(", ") : "None",
                  source: "Set by you",
                },
              ].map((r) => (
                <li
                  key={r.label}
                  className="rounded-[22px] bg-surface p-5 shadow-[0_1px_2px_rgba(47,58,51,0.04),0_14px_36px_-30px_rgba(47,58,51,0.3)]"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-bold">{r.label}</p>
                    <p className="font-mono text-sm capitalize">{r.value}</p>
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
                <Flower size={90} id="profile" />
              </div>
              <textarea
                defaultValue={profile.context ?? ""}
                onBlur={(e) => {
                  if (e.target.value !== profile.context)
                    patch({ context: e.target.value || null }, "Your note");
                }}
                rows={4}
                placeholder="Some days I have plenty in the tank and some days I do not."
                className="relative w-full resize-y rounded-2xl bg-surface/80 px-4 py-3 text-lg leading-relaxed ring-1 ring-ink/10"
              />
            </div>
            <p className="mt-2 max-w-lg text-xs text-slate">
              Yours to write and yours to change. Santé never treats it as medical information
              and never uses it to justify a recommendation.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="font-display text-2xl">Privacy</h2>
            <ul className="mt-3 grid gap-2 text-sm text-ink-soft">
              <li className="rounded-xl bg-surface p-4 ring-1 ring-ink/10">
                Your check-ins are readable only by you. That is enforced by the database, not
                just by the app.
              </li>
              <li className="rounded-xl bg-surface p-4 ring-1 ring-ink/10">
                The safety verdict on a check-in can only be written by the server. The app in
                your browser has no permission to write it.
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
              className="rounded-2xl bg-surface px-6 py-3.5 font-bold ring-1 ring-ink/15"
            >
              {isDemo ? "Leave the demo" : "Sign out"}
            </button>
          </section>
        </div>
      </main>
      <AppNav />
    </>
  );
}
