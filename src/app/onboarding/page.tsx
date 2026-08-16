"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { computeReadiness } from "@/lib/readiness";
import { TODAYS_PLAN } from "@/lib/demo-data";
import { writeCalm } from "@/components/CalmMode";
import { Asterisk, Blob, Flower, Sprig } from "@/components/BrandShapes";
import type { UserProfile } from "@/types/domain";

/**
 * Onboarding.
 *
 * Seven screens, every one skippable, and only questions Santé actually uses.
 * Nothing here asks about a diagnosis, and the single free text box is
 * explicitly the person's own words rather than clinical information.
 *
 * Two things it deliberately does that a settings form would not:
 *
 * Calm mode gets a screen of its own with a side by side preview, because it is
 * the strongest accessibility idea in the product and it was previously buried
 * as one of five equally weighted questions. A person should be able to see
 * what changes before choosing it, not read a promise about it.
 *
 * The last screen builds a real plan from the answers just given, using the
 * same deterministic code the product uses. Ending on "your Santé is ready" and
 * a redirect asks someone to take our word for it at the exact moment we could
 * simply show them.
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

const DURATIONS = [5, 10, 15, 20, 30, 45];

const RESTRICTIONS = [
  { tag: "jumping", label: "No jumping or impact" },
  { tag: "floor_work", label: "Nothing on the floor" },
  { tag: "strength", label: "Nothing that needs effort against resistance" },
  { tag: "standing", label: "Prefer to stay seated" },
];

const STEPS = 7;

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

  /* Applied as they choose it rather than on save, so the rest of onboarding is
     already in calm mode if that is what they picked. Choosing it and then
     watching nothing change is not a preview. */
  useEffect(() => {
    document.documentElement.setAttribute("data-nd", a.nd_mode ? "on" : "off");
    writeCalm(a.nd_mode);
  }, [a.nd_mode]);

  /* A real preview, from the real constraint code, on an ordinary middling day.
     If this ever disagrees with what the product does, the product changed and
     this will change with it. */
  const preview = useMemo(() => {
    const profile: UserProfile = {
      id: "preview",
      display_name: "",
      goal: a.goal,
      preferred_minutes: a.preferred_minutes,
      avoid_tags: a.avoid_tags,
      neurodivergent_mode: a.nd_mode,
      context: null,
      is_demo: false,
    };
    return computeReadiness(
      { energy: 3, discomfort: 3, mood: 3, sensory_load: 3, unsure: [], red_flags: [] },
      profile,
      TODAYS_PLAN
    );
  }, [a.goal, a.preferred_minutes, a.avoid_tags, a.nd_mode]);

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

  const next = () => setStep((s) => Math.min(STEPS - 1, s + 1));

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute -right-28 -top-28 text-moss/20">
        <Blob size={420} />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-12">
        {step > 0 && (
          <div className="mb-8 flex gap-1.5" aria-hidden="true">
            {Array.from({ length: STEPS - 1 }).map((_, i) => (
              <span
                key={i}
                className={
                  "h-1.5 flex-1 rounded-full transition-colors duration-300 " +
                  (i < step ? "bg-moss-deep" : "bg-ink/10")
                }
              />
            ))}
          </div>
        )}

        {/* 0. Welcome. Says what is about to happen before asking for anything. */}
        {step === 0 && (
          <div key="welcome" className="rise">
            <img src="/brand/sante-mark.png" alt="Santé" className="-ml-4 w-48" />
            <h1 className="mt-6 font-display text-4xl leading-[1.1] sm:text-5xl">
              Welcome. Let&rsquo;s make this yours.
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">
              Santé is a wellness app for women, and it changes today&rsquo;s session to fit the day
              you are actually having. Six short questions and it knows where to start from.
              You can skip any of them, and change all of them later.
            </p>

            <ul className="mt-7 grid gap-2.5">
              {[
                ["No wearable", "Four questions on a slider, about twenty seconds."],
                ["Nothing fixed", "Every answer here is editable from your profile."],
                ["No diagnoses", "Santé never asks what is wrong with you, and never guesses."],
              ].map(([title, body], i) => (
                <li
                  key={title}
                  className={"rise rise-" + (i + 1) + " flex gap-3 rounded-2xl bg-surface p-4 ring-1 ring-ink/10"}
                >
                  <span aria-hidden="true" className="mt-0.5 shrink-0 text-moss">
                    <Sprig size={22} />
                  </span>
                  <span>
                    <span className="block font-bold">{title}</span>
                    <span className="block text-sm text-ink-soft">{body}</span>
                  </span>
                </li>
              ))}
            </ul>

            <button
              onClick={next}
              className="mt-8 w-full rounded-2xl bg-coral px-6 py-4 text-lg font-bold text-coral-on"
            >
              Start
            </button>
          </div>
        )}

        {step === 1 && (
          <div key="goal" className="rise">
            <h1 className="font-display text-4xl leading-tight">What would you like from this?</h1>
            <div className="mt-6 grid gap-2">
              {GOALS.map((g) => (
                <button
                  key={g}
                  aria-pressed={a.goal === g}
                  onClick={() => {
                    setA({ ...a, goal: g });
                    next();
                  }}
                  className={
                    "rounded-2xl px-5 py-4 text-left ring-1 " +
                    (a.goal === g
                      ? "bg-moss/30 font-bold ring-transparent"
                      : "bg-surface ring-ink/10 hover:ring-ink/25")
                  }
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div key="minutes" className="rise">
            <h1 className="font-display text-4xl leading-tight">How long is a good session?</h1>
            <p className="mt-2 text-ink-soft">
              On an ordinary day. Santé never plans longer than this, and shortens it further
              when a day needs it.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  aria-pressed={a.preferred_minutes === d}
                  onClick={() => {
                    setA({ ...a, preferred_minutes: d });
                    next();
                  }}
                  className={
                    "rounded-2xl py-6 font-display text-2xl tabular-nums ring-1 " +
                    (a.preferred_minutes === d
                      ? "bg-moss/30 ring-transparent"
                      : "bg-surface ring-ink/10")
                  }
                >
                  {d}
                  <span className="block text-xs font-normal tracking-wide text-slate">min</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div key="avoid" className="rise">
            <h1 className="font-display text-4xl leading-tight">
              Anything you would rather avoid?
            </h1>
            <p className="mt-2 text-ink-soft">
              Santé keeps these out of every plan in its own code, before the assistant sees
              anything, so nothing can talk past them.
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
            <button
              onClick={next}
              className="mt-6 w-full rounded-2xl bg-coral px-5 py-4 font-bold text-coral-on"
            >
              {a.avoid_tags.length ? "Continue" : "Nothing to avoid"}
            </button>
          </div>
        )}

        {/* 4. Calm mode, with its own screen and a real preview. */}
        {step === 4 && (
          <div key="calm" className="rise">
            <span aria-hidden="true" className="text-lavender">
              <Flower size={44} id="onboarding-calm" />
            </span>
            <h1 className="mt-4 font-display text-4xl leading-tight">
              Some days an ordinary app is the thing that is too much.
            </h1>
            <p className="mt-3 text-ink-soft">
              Calm mode is built for those days. It changes the interface and the session, not
              just the animations. Try it here and keep whichever you prefer.
            </p>

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {[
                {
                  on: false,
                  title: "The usual",
                  lines: [
                    "Full instructions",
                    "The reasoning behind each choice",
                    "Motion and ambient colour",
                    `Up to ${preview.max_movements > 3 ? preview.max_movements : 4} movements a session`,
                  ],
                },
                {
                  on: true,
                  title: "Calm mode",
                  lines: [
                    "Larger text, more space",
                    "Shorter instructions, fewer choices",
                    "Nothing moves at all",
                    "Three movements at most, quietest first",
                  ],
                },
              ].map((opt) => (
                <button
                  key={opt.title}
                  aria-pressed={a.nd_mode === opt.on}
                  onClick={() => setA({ ...a, nd_mode: opt.on })}
                  className={
                    "rounded-[22px] p-5 text-left ring-1 " +
                    (a.nd_mode === opt.on
                      ? "bg-lavender/45 ring-transparent"
                      : "bg-surface ring-ink/10 hover:ring-ink/25")
                  }
                >
                  <span className="flex items-center gap-2 font-bold">
                    <span
                      aria-hidden="true"
                      className={
                        "block h-2.5 w-2.5 rounded-full " +
                        (a.nd_mode === opt.on ? "bg-moss-deep" : "bg-ink/20")
                      }
                    />
                    {opt.title}
                  </span>
                  <ul className="mt-2.5 grid gap-1 text-sm text-ink-soft">
                    {opt.lines.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>

            <p className="mt-4 rounded-2xl bg-canvas px-4 py-3 text-sm text-ink-soft ring-1 ring-ink/10">
              {a.nd_mode
                ? "Calm mode is on, and this screen already looks different. It is a switch on your profile, so it follows you everywhere and you can turn it off any time."
                : "Turning it on changes this screen straight away, so you can see what it does before you commit to it."}
            </p>

            <button
              onClick={next}
              className="mt-6 w-full rounded-2xl bg-coral px-5 py-4 font-bold text-coral-on"
            >
              Continue
            </button>
          </div>
        )}

        {step === 5 && (
          <div key="context" className="rise">
            <h1 className="font-display text-4xl leading-tight">
              Anything you want Santé to know?
            </h1>
            <p className="mt-2 text-ink-soft">
              In your own words, and entirely optional. This is context for you, not information
              Santé treats as medical, and it is never used to justify a recommendation.
            </p>
            <textarea
              value={a.context}
              onChange={(e) => setA({ ...a, context: e.target.value })}
              rows={4}
              maxLength={1000}
              placeholder="Some days I have plenty in the tank and some days I do not."
              className="mt-5 w-full resize-y rounded-2xl bg-surface px-4 py-3 text-lg leading-relaxed ring-1 ring-ink/15 placeholder:text-slate/70"
            />
            <button
              onClick={next}
              className="mt-6 w-full rounded-2xl bg-coral px-5 py-4 font-bold text-coral-on"
            >
              {a.context.trim() ? "Continue" : "Skip this"}
            </button>
          </div>
        )}

        {/* 6. Show, do not promise. Built by the same code the product uses. */}
        {step === 6 && (
          <div key="ready" className="rise">
            <span aria-hidden="true" className="text-coral">
              <Asterisk size={38} />
            </span>
            <h1 className="mt-4 font-display text-4xl leading-tight">
              Here is what that means on an ordinary day.
            </h1>
            <p className="mt-3 text-ink-soft">
              Worked out from what you just told us, by the same code that runs every time you
              check in.
            </p>

            <div className="mt-6 rounded-[24px] bg-moss/25 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate">
                A middling day
              </p>
              <p className="figure-in mt-2 font-display text-4xl leading-tight tabular-nums text-moss-deep">
                {preview.target_minutes} min
                <br />
                <span className="text-2xl">{preview.max_intensity} intensity</span>
                <br />
                <span className="text-2xl">up to {preview.max_movements} movements</span>
              </p>
              <ul className="mt-4 grid gap-1.5 border-t border-moss-deep/20 pt-3 text-sm text-ink-soft">
                {preview.drivers.map((d) => (
                  <li key={d}>{d.charAt(0).toUpperCase() + d.slice(1)}.</li>
                ))}
                {a.avoid_tags.length > 0 && (
                  <li>Nothing tagged {a.avoid_tags.join(" or ")}, on any day.</li>
                )}
              </ul>
            </div>

            <p className="mt-4 text-sm text-slate">
              A harder day comes back shorter than this. A better one comes back closer to your
              full {a.preferred_minutes} minutes.
            </p>

            <button
              onClick={finish}
              disabled={saving}
              className="mt-7 w-full rounded-2xl bg-coral px-5 py-4 text-lg font-bold text-coral-on disabled:opacity-60"
            >
              {saving ? "Setting up" : "Open Santé"}
            </button>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          {step > 0 && step < STEPS - 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="text-sm text-slate underline underline-offset-4"
            >
              Back
            </button>
          ) : (
            <span />
          )}
          {step > 0 && step < STEPS - 1 && (
            <button
              onClick={next}
              className="nd-secondary text-sm text-slate underline underline-offset-4"
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
