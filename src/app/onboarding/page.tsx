"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase/client";

/**
 * Onboarding.
 *
 * Six questions, one per screen, every one skippable. Santé asks what it will
 * actually use and nothing else: there is no point collecting a birthday to
 * make a form feel thorough.
 *
 * Nothing here asks about diagnoses. The one free-text box is explicitly the
 * person's own words, and it is never treated as clinical information.
 */

type Answers = {
  goal: string;
  preferred_minutes: number;
  avoid_tags: string[];
  nd_mode: boolean;
  context: string;
};

const GOALS = [
  "Stay consistent without forcing myself through bad days",
  "Build strength gently",
  "Move more easily day to day",
  "Reduce how overwhelming exercise feels",
];

const DURATIONS = [5, 15, 30, 45];

const RESTRICTIONS = [
  { tag: "jumping", label: "No jumping or impact" },
  { tag: "floor_work", label: "Nothing on the floor" },
  { tag: "strength", label: "Nothing that needs effort against resistance" },
  { tag: "standing", label: "Prefer to stay seated" },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [a, setA] = useState<Answers>({
    goal: GOALS[0],
    preferred_minutes: 30,
    avoid_tags: [],
    nd_mode: false,
    context: "",
  });

  const steps = 5;

  async function finish() {
    setSaving(true);
    const sb = getSupabase();
    if (sb) {
      const { data } = await sb.auth.getSession();
      if (data.session?.user) {
        await sb
          .from("profiles")
          .update({
            goal: a.goal,
            preferred_minutes: a.preferred_minutes,
            avoid_tags: a.avoid_tags,
            nd_mode: a.nd_mode,
            context: a.context || null,
          })
          .eq("id", data.session.user.id);
      }
    }
    window.location.replace("/home");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-12">
      <div className="mb-8 flex gap-1.5" aria-hidden="true">
        {Array.from({ length: steps }).map((_, i) => (
          <span
            key={i}
            className={"h-1.5 flex-1 rounded-full " + (i <= step ? "bg-moss-deep" : "bg-ink/10")}
          />
        ))}
      </div>

      {step === 0 && (
        <div>
          <img src="/brand/sante-logo.png" alt="Santé" className="-ml-4 mb-5 w-40" />
          <h1 className="text-4xl leading-tight">What would you like from this?</h1>
          <div className="mt-6 grid gap-2">
            {GOALS.map((g) => (
              <button
                key={g}
                onClick={() => {
                  setA({ ...a, goal: g });
                  setStep(1);
                }}
                className={
                  "rounded-xl px-5 py-4 text-left ring-1 " +
                  (a.goal === g ? "bg-moss/25 ring-transparent" : "bg-surface ring-ink/10")
                }
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <h1 className="text-4xl leading-tight">How long is a good session?</h1>
          <p className="mt-2 text-ink-soft">On an ordinary day. Santé will shorten it when it needs to.</p>
          <div className="mt-6 grid grid-cols-2 gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => {
                  setA({ ...a, preferred_minutes: d });
                  setStep(2);
                }}
                className={
                  "rounded-xl py-6 font-display text-2xl ring-1 " +
                  (a.preferred_minutes === d
                    ? "bg-moss/25 ring-transparent"
                    : "bg-surface ring-ink/10")
                }
              >
                {d} min
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h1 className="text-4xl leading-tight">Anything you would rather avoid?</h1>
          <p className="mt-2 text-ink-soft">
            Santé will keep these out of every plan. You can change them later.
          </p>
          <div className="mt-6 grid gap-2">
            {RESTRICTIONS.map((r) => {
              const on = a.avoid_tags.includes(r.tag);
              return (
                <button
                  key={r.tag}
                  aria-pressed={on}
                  onClick={() =>
                    setA({
                      ...a,
                      avoid_tags: on
                        ? a.avoid_tags.filter((t) => t !== r.tag)
                        : [...a.avoid_tags, r.tag],
                    })
                  }
                  className={
                    "rounded-xl px-5 py-4 text-left ring-1 " +
                    (on ? "bg-moss/25 ring-transparent" : "bg-surface ring-ink/10")
                  }
                >
                  {on && <span aria-hidden="true">✓ </span>}
                  {r.label}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setStep(3)}
            className="mt-6 w-full rounded-xl bg-coral px-5 py-3.5 font-bold text-coral-on"
          >
            {a.avoid_tags.length ? "Continue" : "Nothing to avoid"}
          </button>
        </div>
      )}

      {step === 3 && (
        <div>
          <h1 className="text-4xl leading-tight">How should Santé feel?</h1>
          <div className="mt-6 grid gap-2">
            <button
              onClick={() => {
                setA({ ...a, nd_mode: false });
                setStep(4);
              }}
              className="rounded-xl bg-surface px-5 py-4 text-left ring-1 ring-ink/10"
            >
              <span className="font-bold">The usual</span>
              <span className="mt-0.5 block text-sm text-ink-soft">
                Full instructions and the details behind each choice.
              </span>
            </button>
            <button
              onClick={() => {
                setA({ ...a, nd_mode: true });
                setStep(4);
              }}
              className="rounded-xl bg-lavender/35 px-5 py-4 text-left"
            >
              <span className="font-bold">Simplified</span>
              <span className="mt-0.5 block text-sm text-ink-soft">
                Fewer choices, shorter instructions, one thing at a time, no motion.
              </span>
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <h1 className="text-4xl leading-tight">Anything you want Santé to know?</h1>
          <p className="mt-2 text-ink-soft">
            In your own words, and entirely optional. This is context for you, not information
            Santé treats as medical.
          </p>
          <textarea
            value={a.context}
            onChange={(e) => setA({ ...a, context: e.target.value })}
            rows={4}
            placeholder="Some days I have plenty in the tank and some days I do not."
            className="mt-5 w-full rounded-xl bg-surface px-4 py-3 ring-1 ring-ink/15 placeholder:text-slate/70"
          />
          <button
            onClick={finish}
            disabled={saving}
            className="mt-6 w-full rounded-xl bg-coral px-5 py-3.5 font-bold text-coral-on disabled:opacity-60"
          >
            {saving ? "Setting up" : "Your Santé is ready"}
          </button>
        </div>
      )}

      {step > 0 && step < 4 && (
        <button onClick={() => setStep(step - 1)} className="mt-6 text-sm text-slate underline">
          Back
        </button>
      )}
    </main>
  );
}
