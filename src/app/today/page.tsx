"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AdaptationResult,
  AgentEvent,
  DailyPlan,
  FeedbackVerdict,
  Movement,
  ReadinessCheckin,
} from "@/types/domain";
import { MAYA, MOVEMENTS, TODAYS_PLAN } from "@/lib/demo-data";
import { getStore, type StoredSession } from "@/lib/storage";
import { getSupabase } from "@/lib/supabase/client";
import ReadinessRitual from "@/components/ReadinessRitual";
import CapacityBloom, { toBloom } from "@/components/CapacityBloom";
import PlanDiff from "@/components/PlanDiff";
import AgentEvents from "@/components/AgentEvents";
import SessionPlayer from "@/components/SessionPlayer";
import MakeItFit from "@/components/MakeItFit";
import MemoryProposal from "@/components/MemoryProposal";
import AppNav from "@/components/AppNav";
import CalmModeToggle, { readCalm } from "@/components/CalmMode";
import AdaptationReceipt, { type Receipt } from "@/components/AdaptationReceipt";
import RebalanceProposal from "@/components/RebalanceProposal";
import TodayContext, { contextTags, type TodayContextValue } from "@/components/TodayContext";

type Stage = "plan" | "working" | "result" | "blocked" | "session" | "done" | "rest";

/* Gentlest first: what "just start me" reaches for, and the pool it can swap
   within if even that is too much. */
const MOVEMENTS_BY_EASE = [...MOVEMENTS]
  .filter((m) => m.intensity === "low")
  .sort((a, b) => a.minutes - b.minutes);

export default function Today() {
  const store = useRef(getStore()).current;

  const [session, setSession] = useState<StoredSession | null>(null);
  const [stage, setStage] = useState<Stage>("plan");
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const [nd, setNd] = useState(MAYA.neurodivergent_mode);
  const [context, setContext] = useState<TodayContextValue>({
    period_today: false,
    symptoms: [],
  });
  const [who, setWho] = useState<{ name: string; isDemo: boolean }>({
    name: MAYA.display_name,
    isDemo: true,
  });

  /* One ephemeral session per visitor. Two judges opening the link at the same
     time each get their own Maya. */
  useEffect(() => {
    (async () => {
      const existing = await store.load();
      const s = existing ?? (await store.createSession(TODAYS_PLAN));
      setSession(s);
      setStage((s.stage as Stage) || "plan");
    })();
  }, [store]);

  /* Whatever they chose last time wins over the profile default. */
  useEffect(() => {
    setNd(readCalm(MAYA.neurodivergent_mode));
  }, []);

  /* An anonymous visitor is Maya. A signed-in person is themselves. */
  useEffect(() => {
    (async () => {
      const sb = getSupabase();
      if (!sb) return;
      const { data } = await sb.auth.getSession();
      const user = data.session?.user;
      if (!user) return;
      const { data: row } = await sb
        .from("profiles")
        .select("display_name, nd_mode")
        .maybeSingle();
      if (row?.display_name) {
        setWho({ name: row.display_name, isDemo: Boolean(user.is_anonymous) });
        setNd(Boolean(row.nd_mode));
      }
    })();
  }, []);

  const patch = useCallback(
    async (p: Partial<StoredSession>) => {
      setSession((prev) => (prev ? { ...prev, ...p } : prev));
      await store.save(p);
    },
    [store]
  );

  const goTo = useCallback(
    async (next: Stage, extra: Partial<StoredSession> = {}) => {
      setStage(next);
      await patch({ stage: next, ...extra });
    },
    [patch]
  );

  const adapt = useCallback(
    async (
      checkin: ReadinessCheckin,
      tighter = false,
      fit: string[] = [],
      request?: string
    ) => {
      if (!session) return;
      setStage("working");
      setEvents([]);
      setStreaming(true);
      setBlockedReason(null);
      await patch({ last_checkin: checkin, stage: "working" });

      /* "Still too much" re-runs the same check-in with the dials turned down.
         Smaller than a plan editor, and a better demo beat. */
      const payload = tighter
        ? {
            ...checkin,
            energy: Math.max(1, checkin.energy - 1),
            discomfort: Math.min(5, checkin.discomfort + 1),
          }
        : checkin;

      try {
        const sb = getSupabase();
        const token = sb ? (await sb.auth.getSession()).data.session?.access_token : null;

        const res = await fetch("/api/adapt", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            checkin: payload,
            session_id: session.session_id,
            recent_feedback: session.feedback,
            fit,
            request,
            /* Symptoms become ordinary movement constraints. There is no rule
               anywhere that turns a period into a gentle day: what they
               reported on the sliders decides that. */
            context_tags: contextTags(context),
          }),
        });

        if (!res.ok || !res.body) throw new Error("no stream");

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
              await goTo("blocked");
            }
            if (type === "result") {
              const result = data as AdaptationResult;
              await goTo("result", {
                result,
                allowed_movements: (data as any).allowed_movements ?? [],
                receipt: (data as any).receipt ?? null,
              });
            }
            if (type === "error") {
              setEvents((e) => [...e, { step: "error", label: data.message }]);
            }
          }
        }
      } catch {
        setEvents((e) => [
          ...e,
          { step: "error", label: "Could not reach the planner. Try again in a moment." },
        ]);
      } finally {
        setStreaming(false);
      }
    },
    [session, patch, goTo]
  );

  if (!session) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-10">
        <p className="text-ink-soft">Opening today&rsquo;s plan…</p>
      </main>
    );
  }

  const plan = session.plan;
  const result = session.result;
  const completed = session.completed_movement_ids;

  return (
    <>
    <main className="px-5 py-8 pb-28 lg:pb-10 lg:pl-64">
      <div className="mx-auto max-w-3xl">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <img src="/brand/sante-logo.png" alt="Santé" className="-ml-2 w-24 sm:w-28 lg:hidden" />
          <h1 className="mt-1 font-display text-4xl leading-tight">Today</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {who.name}, this is what you planned and what today can be.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <CalmModeToggle value={nd} onChange={setNd} compact />
          <button
            className="nd-secondary text-xs text-slate underline"
            onClick={async () => {
              const fresh = await store.reset(TODAYS_PLAN);
              setSession(fresh);
              setStage("plan");
              setEvents([]);
            }}
          >
            Reset demo
          </button>
        </div>
      </header>

      {stage === "plan" && (
        <section className="mt-8 grid gap-5">
          <div className="rounded-[24px] bg-surface p-6 shadow-[0_1px_2px_rgba(47,58,51,0.04),0_18px_44px_-30px_rgba(47,58,51,0.3)]">
            <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate">
              What you planned
            </p>
            <p className="mt-2 font-display text-3xl leading-tight tabular-nums sm:text-4xl">
              {plan.total_minutes} min · {plan.intensity}
            </p>
            <p className="font-display text-xl text-ink-soft sm:text-2xl">
              {plan.movements.length} movement{plan.movements.length === 1 ? "" : "s"}
            </p>
            <ul className="mt-3 space-y-1 text-sm text-ink-soft">
              {plan.movements.map((m) => (
                <li key={m.id}>{m.name}</li>
              ))}
            </ul>
          </div>

          {session.feedback.length > 0 && (
            <p className="rounded-xl bg-lavender/40 px-4 py-3 text-sm">
              Last time you said the session was{" "}
              <strong>{session.feedback[0].replace(/_/g, " ")}</strong>. We will take that into
              account.
            </p>
          )}

          {/* For the days when answering four questions is itself too much.
              One movement, no decisions, and the door stays open afterwards. */}
          <button
            onClick={() => {
              const first = MOVEMENTS_BY_EASE[0];
              goTo("session", {
                plan: {
                  id: "just-start",
                  title: "Just this one",
                  total_minutes: first.minutes,
                  intensity: first.intensity,
                  movements: [first],
                },
                allowed_movements: MOVEMENTS_BY_EASE,
                completed_movement_ids: [],
              });
            }}
            className="rounded-2xl bg-lavender/35 px-5 py-4 text-left"
          >
            <span className="block font-bold">Just start me</span>
            <span className="mt-0.5 block text-sm text-ink-soft">
              One movement, a few minutes, no decisions. You can stop after it.
            </span>
          </button>

          <TodayContext value={context} onChange={setContext} />

          <ReadinessRitual onSubmit={(c) => adapt(c)} busy={streaming} quiet={nd} />
        </section>
      )}

      {stage === "working" && (
        <section className="mt-8 rounded-2xl bg-surface p-6 ring-1 ring-ink/10">
          <h2 className="text-xl">Adapting your plan</h2>
          <p className="mt-1 text-sm text-slate">
            These are the steps actually being taken, as they happen.
          </p>
          <div className="mt-4">
            <AgentEvents events={events} done={!streaming} />
          </div>
        </section>
      )}

      {stage === "blocked" && (
        <section className="mt-8 rounded-2xl bg-terracotta/10 p-6">
          <h2 className="text-xl">Let&rsquo;s pause today</h2>
          <p className="mt-2 text-ink-soft">{blockedReason}</p>
          <p className="mt-3 text-sm text-slate">
            Santé is a wellness tool and cannot advise on symptoms.
          </p>
          <button
            className="mt-5 rounded-xl bg-surface px-5 py-3 font-bold ring-1 ring-ink/15"
            onClick={() => goTo("plan")}
          >
            Back to today
          </button>
        </section>
      )}

      {stage === "result" && result && (
        <section className="mt-8">
          <h2 className="mb-4 text-3xl">Your plan flexed.</h2>

          {session.last_checkin && (
            <div className="mb-5 flex justify-center rounded-2xl bg-lavender/25 py-6">
              <CapacityBloom
                values={toBloom(session.last_checkin)}
                size={150}
                showLegend={false}
                quiet={nd}
              />
            </div>
          )}

          <PlanDiff
            original={result.original}
            adapted={result.adapted}
            reasons={result.reasons}
            usedFallback={result.used_fallback}
          />

          {Boolean(session.receipt) && (
            <AdaptationReceipt receipt={session.receipt as Receipt} />
          )}

          <MakeItFit
            busy={streaming}
            quiet={nd}
            onApply={(chips, request) =>
              session.last_checkin && adapt(session.last_checkin, false, chips, request)
            }
          />

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              className="rounded-xl bg-coral px-5 py-3 font-bold text-coral-on"
              onClick={() => goTo("session", { plan: result.adapted, completed_movement_ids: [] })}
            >
              Start adapted plan
            </button>
            <button
              className="rounded-xl bg-surface px-5 py-3 font-bold ring-1 ring-ink/15"
              onClick={() => session.last_checkin && adapt(session.last_checkin, true)}
            >
              Still too much
            </button>
            <button
              className="rounded-xl px-5 py-3 text-ink-soft underline"
              onClick={() => goTo("session", { plan: result.original, completed_movement_ids: [] })}
            >
              Keep the original
            </button>
            <button
              className="rounded-xl px-5 py-3 text-ink-soft underline"
              onClick={() => goTo("rest")}
            >
              Rest today
            </button>
          </div>
        </section>
      )}

      {stage === "session" && (
        <div className="mt-8">
          <SessionPlayer
            plan={plan}
            pool={session.allowed_movements ?? []}
            completed={completed}
            quiet={nd}
            onToggleComplete={(id) =>
              patch({
                completed_movement_ids: completed.includes(id)
                  ? completed.filter((x) => x !== id)
                  : [...completed, id],
              })
            }
            onSwap={(index, replacement) => {
              const movements = [...plan.movements];
              movements[index] = replacement;
              patch({
                plan: {
                  ...plan,
                  movements,
                  total_minutes: movements.reduce((sum, m) => sum + m.minutes, 0),
                },
              });
            }}
            onFinish={() => goTo("done")}
          />
        </div>
      )}

      {stage === "rest" && (
        <section className="mt-8 rounded-2xl bg-moss/20 p-6">
          <h2 className="text-2xl">Rest is still a choice.</h2>
          <p className="mt-2 max-w-md text-ink-soft">
            You checked in, saw what today looked like, and chose rest. That counts as
            honoring your capacity, and nothing here will guilt you about it.
          </p>
          <button
            className="mt-5 rounded-xl bg-surface px-5 py-3 font-bold ring-1 ring-ink/15"
            onClick={() => goTo("plan", { plan: TODAYS_PLAN, completed_movement_ids: [] })}
          >
            Back to today
          </button>
        </section>
      )}

      {stage === "done" && (
        <section className="mt-8 rounded-2xl bg-surface p-6 ring-1 ring-ink/10">
          <h2 className="text-3xl">You showed up for today.</h2>
          <p className="mt-1 text-ink-soft">The plan changed. The intention didn&rsquo;t.</p>
          <p className="mt-4 text-sm font-bold">How was it?</p>
          <p className="text-sm text-ink-soft">
            We use this next time you check in. Nothing here is a score.
          </p>
          <RebalanceProposal actualMinutes={plan.total_minutes} />

          <MemoryProposal
            feedback={session.feedback}
            alreadyOffered={Boolean(session.memory_offered)}
            adaptedMinutes={result?.adapted.total_minutes ?? 12}
            onRemember={async (minutes) => {
              await store.rememberPreferredMinutes?.(minutes);
              await patch({ memory_offered: true });
            }}
            onDismiss={() => patch({ memory_offered: true })}
          />

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
                onClick={async () => {
                  if (session.result?.adaptation_id) {
                    await store.saveFeedback?.(
                      session.result.adaptation_id,
                      value,
                      session.completed_movement_ids
                    );
                  }
                  await goTo("plan", {
                    feedback: [value, ...session.feedback],
                    plan: TODAYS_PLAN,
                    completed_movement_ids: [],
                  });
                }}
                className="rounded-xl bg-canvas px-4 py-3 font-bold ring-1 ring-ink/10"
              >
                {label}
              </button>
            ))}
          </div>
        </section>
      )}

      <footer className="mt-14 text-xs leading-relaxed text-slate">
        {who.isDemo && "Maya is a fictional demo user. "}Santé is a wellness tool, not a medical
        one, and does not diagnose, treat, or give medical advice.
      </footer>
      </div>
    </main>
    <AppNav />
    </>
  );
}
