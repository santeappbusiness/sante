import { NextRequest } from "next/server";
import { readinessCheckinSchema, type AgentEvent } from "@/types/domain";
import { computeReadiness } from "@/lib/readiness";
import { runAdaptation } from "@/lib/luna";
import { MAYA, TODAYS_PLAN } from "@/lib/demo-data";
import { resolveUser, saveAdaptation, saveCheckin } from "@/lib/persist";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * The adapt route. Streams Server-Sent Events so the agent's real progress
 * shows while it works, which matters because a full run is around five
 * seconds and a dead spinner is the weakest possible moment in the demo.
 *
 * Order is deliberate and the model sits in the middle of it, never at the
 * front: authenticate, red-flag gate, compute constraints, then the tool loop,
 * then validate, then save.
 */

/* A blunt per-session cap. A public button that triggers model calls is an
   open wallet, and this is the cheap version of closing it. Serene owns the
   durable one. */
const CALLS = new Map<string, { count: number; first: number }>();
const MAX_PER_SESSION = 10;
const WINDOW_MS = 60 * 60 * 1000;

function overLimit(key: string) {
  const now = Date.now();
  const entry = CALLS.get(key);
  if (!entry || now - entry.first > WINDOW_MS) {
    CALLS.set(key, { count: 1, first: now });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_SESSION;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = readinessCheckinSchema.safeParse(body?.checkin);

  if (!parsed.success) {
    return Response.json({ error: "That check-in did not look right." }, { status: 400 });
  }

  const sessionId: string = typeof body?.session_id === "string" ? body.session_id : "anonymous";

  if (overLimit(sessionId)) {
    return Response.json(
      { error: "That is a lot of adaptations for one session. Try again later." },
      { status: 429 }
    );
  }

  const checkin = parsed.data;
  const profile = MAYA;
  const plan = TODAYS_PLAN;

  /* Deterministic gate and constraints, before the model is reachable at all. */
  const result = computeReadiness(checkin, profile, plan);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      /* One close, exactly once. Closing twice throws ERR_INVALID_STATE, which
         kills the whole response and reads on the client as a network failure.
         The blocked path returns early, so this has to be guarded. */
      let closed = false;
      const close = () => {
        if (!closed) {
          closed = true;
          controller.close();
        }
      };
      const send = (type: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      const emit = (event: AgentEvent) => send("agent", event);

      try {
        /* Identity from the caller's token, never from the request body. */
        const profileId = await resolveUser(req.headers.get("authorization"));
        emit({
          step: "authenticated",
          label: "Opened your plan for today",
          detail: profileId ? undefined : "this session only",
        });
        emit({
          step: "safety_checked",
          label: "Ran the safety check",
          detail: result.blocked ? "paused" : "clear",
        });

        /* The red-flag path stops here. No plan is generated, and no model call
           is made, so there is nothing for a model to override. */
        if (result.blocked) {
          /* The verdict is recorded even though no plan is produced, so a
             paused day is still part of the person's history. */
          if (profileId) await saveCheckin(profileId, checkin, result);
          send("blocked", { reason: result.block_reason });
          send("done", { ok: true });
          return;
        }

        const outcome = await runAdaptation({
          profile,
          plan,
          result,
          recentFeedback: Array.isArray(body?.recent_feedback) ? body.recent_feedback : [],
          emit,
          signal: req.signal,
        });

        let adaptationId: string | null = null;
        if (profileId) {
          const checkinId = await saveCheckin(profileId, checkin, result);
          /* No check-in row means no adaptation row: the table requires the
             link, and an adaptation with no recorded cause is not worth
             storing anyway. */
          if (checkinId)
            adaptationId = await saveAdaptation({
              profileId,
              checkinId,
              original: plan,
              adapted: outcome.adapted,
              reasons: outcome.reasons,
              usedFallback: outcome.used_fallback,
              result,
            });
        }

        emit({
          step: "saved",
          label: adaptationId ? "Saved today's adaptation" : "Ready",
        });

        send("result", {
          adaptation_id: adaptationId,
          original: plan,
          adapted: outcome.adapted,
          reasons: outcome.reasons,
          used_fallback: outcome.used_fallback,
          readiness: {
            score: result.score,
            target_minutes: result.target_minutes,
            max_intensity: result.max_intensity,
            drivers: result.drivers,
          },
        });
        send("done", { ok: true });
      } catch {
        /* Never leak internals to the client. The deterministic fallback inside
           runAdaptation means we should not get here, but if we do, say so
           plainly rather than showing a stack trace. */
        send("error", { message: "Something went wrong building today's plan." });
      } finally {
        close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
