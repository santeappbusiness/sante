"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  AgentEvent,
  DailyPlan,
  FeedbackVerdict,
  ReadinessCheckin,
} from "@/types/domain";
import { MAYA, TODAYS_PLAN } from "@/lib/demo-data";
import ReadinessCheck from "@/components/ReadinessCheck";
import PlanDiff from "@/components/PlanDiff";

type Stage = "plan" | "working" | "result" | "blocked" | "session" | "done";

type Result = {
  adaptation_id: string;
  original: DailyPlan;
  adapted: DailyPlan;
  reasons: string[];
  used_fallback: boolean;
};

/* Session storage stands in for the database until Serene's schema lands.
   Same shape, one seam to swap. */
const KEY = "sante-demo-state";

export default function Today() {
  const [stage, setStage] = useState<Stage>("plan");
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const [plan, setPlan] = useState<DailyPlan>(TODAYS_PLAN);
  const [completed, setCompleted] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<FeedbackVerdict[]>([]);
  const [lastCheckin, setLastCheckin] = useState<ReadinessCheckin | null>(null);
  const [nd, setNd] = useState(MAYA.neurodivergent_mode);

  /* Restore, so a refresh in front of a judge does not lose the session. */
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.result) setResult(saved.result);
      if (saved.stage) setStage(saved.stage);
      if (saved.feedback) setFeedback(saved.feedback);
      if (saved.completed) setCompleted(saved.completed);
      if (saved.plan) setPlan(saved.plan);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ stage, result, feedback, completed, plan }));
    } catch {}
  }, [stage, result, feedback, completed, plan]);

  useEffect(() => {
    document.documentElement.setAttribute("data-nd", nd ? "on" : "off");
  }, [nd]);

  const adapt = useCallback(
    async (checkin: ReadinessCheckin, tighter = false) => {
      setStage("working");
      setEvents([]);
      setBlockedReason(null);
      setLastCheckin(checkin);

      /* "Go lighter" re-runs the same check-in with the dials turned down,
         which is a smaller change than it looks and a better demo beat than a
         plan editor would have been. */
      const payload = tighter
        ? {
            ...checkin,
            energy: Math.max(1, checkin.energy - 1),
            discomfort: Math.min(5, checkin.discomfort + 1),
          }
        : checkin;

      const res = await fetch("/api/adapt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkin: payload,
          session_id: "demo",
          recent_feedback: feedback,
        }),
      });

      if (!res.ok || !res.body) {
        setEvents((e) => [...e, { step: "error", label: "Could not reach the planner" }]);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() || "";

        for (const chunk of chunks) {
          const type = chunk.match(/^event: (.+)$/m)?.[1];
          const dataLine = chunk.match(/^data: (.+)$/m)?.[1];
          if (!type || !dataLine) continue;
          const data = JSON.parse(dataLine);

          if (type === "agent") setEvents((e) => [...e, data as AgentEvent]);
          if (type === "blocked") {
            setBlockedReason(data.reason);
            setStage("blocked");
          }
          if (type === "result") {
            setResult(data as Result);
            setStage("result");
          }
          if (type === "error") {
            setEvents((e) => [...e, { step: "error", label: data.message }]);
          }
        }
      }
    },
    [feedback]
  );

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl">Good morning, {MAYA.display_name}</h1>
          <p className="text-sm text-ink-soft">{MAYA.goal}</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            className="h-4 w-4 accent-moss-deep"
            checked={nd}
            onChange={(e) => setNd(e.target.checked)}
          />
          Simplified mode
        </label>
      </header>

      {/* Today's plan, before anything has changed */}
      {stage === "plan" && (
        <section className="mt-8 grid gap-5">
          <div className="rounded-2xl bg-surface p-5 ring-1 ring-ink/10">
            <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate">
              Today&rsquo;s intended plan
            </p>
            <p className="mt-2 font-display text-3xl tabular-nums">
              {plan.total_minutes} min · {plan.intensity} · {plan.movements.length} movements
            </p>
            <ul className="mt-3 space-y-1 text-sm text-ink-soft">
              {plan.movements.map((m) => (
                <li key={m.id}>{m.name}</li>
              ))}
            </ul>
          </div>
          <ReadinessCheck onSubmit={(c) => adapt(c)} busy={false} />
        </section>
      )}

      {/* The agent, working. Real events from the real loop. */}
      {stage === "working" && (
        <section className="mt-8 rounded-2xl bg-surface p-6 ring-1 ring-ink/10">
          <h2 className="text-xl">Adapting your plan</h2>
          <ol className="mt-4 space-y-2">
            {events.map((e, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span aria-hidden="true" className="text-moss-deep">
                  ✓
                </span>
                <span>
                  {e.label}
                  {e.detail && <span className="text-slate"> · {e.detail}</span>}
                </span>
              </li>
            ))}
            <li className="flex gap-3 text-sm text-slate">
              <span aria-hidden="true">·</span> working
            </li>
          </ol>
        </section>
      )}

      {/* Red-flag path. No plan, no model, no negotiation. */}
      {stage === "blocked" && (
        <section className="mt-8 rounded-2xl bg-terracotta/10 p-6">
          <h2 className="text-xl">Let&rsquo;s pause today</h2>
          <p className="mt-2 text-ink-soft">{blockedReason}</p>
          <button
            className="mt-5 rounded-xl bg-surface px-5 py-3 font-bold ring-1 ring-ink/15"
            onClick={() => setStage("plan")}
          >
            Back
          </button>
        </section>
      )}

      {/* The hero moment */}
      {stage === "result" && result && (
        <section className="mt-8">
          <PlanDiff
            original={result.original}
            adapted={result.adapted}
            reasons={result.reasons}
            usedFallback={result.used_fallback}
          />

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              className="rounded-xl bg-coral px-5 py-3 font-bold text-coral-on"
              onClick={() => {
                setPlan(result.adapted);
                setStage("session");
              }}
            >
              Start adapted plan
            </button>
            <button
              className="rounded-xl bg-surface px-5 py-3 font-bold ring-1 ring-ink/15"
              onClick={() => lastCheckin && adapt(lastCheckin, true)}
            >
              Still too much
            </button>
            <button
              className="rounded-xl px-5 py-3 text-ink-soft underline"
              onClick={() => {
                setPlan(result.original);
                setStage("session");
              }}
            >
              Keep the original
            </button>
          </div>
        </section>
      )}

      {/* Tap to complete. No timers, on purpose. */}
      {stage === "session" && (
        <section className="mt-8">
          <h2 className="text-2xl">{plan.title}</h2>
          <p className="mt-1 text-sm text-ink-soft">
            {completed.length} of {plan.movements.length} done
          </p>
          <ul className="mt-4 grid gap-2">
            {plan.movements.map((m) => {
              const isDone = completed.includes(m.id);
              return (
                <li key={m.id}>
                  <button
                    onClick={() =>
                      setCompleted(
                        isDone ? completed.filter((id) => id !== m.id) : [...completed, m.id]
                      )
                    }
                    className={
                      "w-full rounded-xl p-4 text-left ring-1 " +
                      (isDone ? "bg-moss/25 ring-transparent" : "bg-surface ring-ink/10")
                    }
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="font-bold">{m.name}</span>
                      <span className="font-mono text-sm text-slate">{m.minutes} min</span>
                    </span>
                    {!nd && <span className="mt-1 block text-sm text-ink-soft">{m.instructions}</span>}
                  </button>
                </li>
              );
            })}
          </ul>

          <button
            className="mt-5 w-full rounded-xl bg-coral px-5 py-3.5 font-bold text-coral-on"
            onClick={() => setStage("done")}
          >
            Finish session
          </button>
        </section>
      )}

      {/* One tap of feedback, which feeds the next adaptation. */}
      {stage === "done" && (
        <section className="mt-8 rounded-2xl bg-surface p-6 ring-1 ring-ink/10">
          <h2 className="text-2xl">How was that?</h2>
          <p className="mt-1 text-sm text-ink-soft">
            We use this next time you check in. Nothing here is a score.
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            {(
              [
                ["too_much", "Still too much"],
                ["just_right", "Just right"],
                ["could_do_more", "Could do more"],
              ] as Array<[FeedbackVerdict, string]>
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => {
                  setFeedback([value, ...feedback]);
                  setStage("plan");
                  setCompleted([]);
                  setPlan(TODAYS_PLAN);
                }}
                className="rounded-xl bg-canvas px-4 py-3 font-bold ring-1 ring-ink/10"
              >
                {label}
              </button>
            ))}
          </div>
          {feedback.length > 0 && (
            <p className="mt-4 text-sm text-slate">
              Remembered so far: {feedback.join(", ")}
            </p>
          )}
        </section>
      )}
    </main>
  );
}
