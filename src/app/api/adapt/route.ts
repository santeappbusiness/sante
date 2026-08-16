import { NextRequest } from "next/server";
import {
  feedbackVerdictSchema,
  readinessCheckinSchema,
  type AgentEvent,
  type FeedbackVerdict,
  type UserProfile,
} from "@/types/domain";
import { allowedMovements, computeReadiness } from "@/lib/readiness";
import { interpretRequest, LUNA_MODEL, runAdaptation } from "@/lib/luna";
import { CONTEXT_TAGS, MAYA, TODAYS_PLAN } from "@/lib/demo-data";
import { loadProfile, resolveUser, saveAdaptation, saveCheckin } from "@/lib/persist";

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

/* A blunt per-identity cap. A public button that triggers model calls is an
   open wallet, and this is the cheap version of closing it. Serene owns the
   durable one.

   Keyed on the authenticated user, never on anything from the body. It used to
   read session_id off the request, which the caller writes, so a fresh string
   per call reset the counter and the cap counted nothing. */
const CALLS = new Map<string, { count: number; first: number }>();
const MAX_PER_SESSION = 10;
const WINDOW_MS = 60 * 60 * 1000;

/* Bounds on the two things a caller can put in the body that are not numbers.
   The free-text box on screen holds a sentence and the feedback list is at most
   a handful of past sessions; neither needs to be open-ended, and both end up
   in front of a model. */
const MAX_REQUEST_CHARS = 280;
const MAX_FEEDBACK_ITEMS = 10;

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

/**
 * Chips like "quieter" or "5 minutes shorter" are constraint edits, not prompts.
 * Applying them here keeps one source of truth for what is allowed today, and
 * means the model cannot be talked past them.
 */
function applyFit(
  result: ReturnType<typeof computeReadiness>,
  fit: string[],
  profile: typeof MAYA
) {
  /* A blocked day has no constraints to adjust. This runs before the blocked
     check below, and the floors in Math.max would raise target_minutes back to
     5 and max_movements back to 1, which is exactly the buildable shape the
     gate exists to prevent. */
  if (fit.length === 0 || result.blocked) return result;

  const next = { ...result, excluded_tags: [...result.excluded_tags], drivers: [...result.drivers] };

  for (const f of fit) {
    if (f === "shorter") {
      next.target_minutes = Math.max(5, next.target_minutes - 5);
      next.drivers.push("you asked for something shorter");
    }
    if (f === "quieter") {
      for (const tag of ["jumping", "strength"])
        if (!next.excluded_tags.includes(tag)) next.excluded_tags.push(tag);
      next.max_intensity = "low";
      next.drivers.push("you asked for something quieter");
    }
    if (f === "no_floor") {
      if (!next.excluded_tags.includes("floor_work")) next.excluded_tags.push("floor_work");
      next.drivers.push("you asked to stay off the floor");
    }
    if (f === "fewer") {
      next.max_movements = Math.max(1, next.max_movements - 1);
      next.drivers.push("you asked for fewer movements");
    }
  }
  return next;
}

/**
 * Add exclusions that came from what someone typed, unless they would leave
 * nothing to build with.
 *
 * "Nothing seated, nothing standing, nothing on the floor" is a reasonable
 * sentence and an impossible session: those three tags between them cover the
 * whole catalogue. Honouring it literally produced an empty plan. The tags a
 * person saved on their profile and the ones the safety rules added stay
 * untouched; only this request's are dropped, and only when keeping them would
 * mean handing back nothing at all.
 */
function widenIfEmptied(result: ReturnType<typeof computeReadiness>, add: string[]): string[] {
  const tags = [...result.excluded_tags];
  for (const t of add) if (!tags.includes(t)) tags.push(t);
  if (tags.length === result.excluded_tags.length) return result.excluded_tags;

  const wouldAllow = allowedMovements({ ...result, excluded_tags: tags });
  return wouldAllow.length > 0 ? tags : result.excluded_tags;
}

export async function POST(req: NextRequest) {
  /* Identity first, before the body is read and long before a model is
     reachable. Every visitor has a token, including the demo: opening Santé
     signs you in anonymously, so requiring one turns nobody away. What it does
     turn away is a script with a URL and no session, which is what an
     unauthenticated route was handing an unlimited number of model calls to.

     Anonymous users are accepted deliberately. The demo is the product, and a
     gate that only let signed-up accounts through would close it. */
  const profileId = await resolveUser(req.headers.get("authorization"));
  if (!profileId) {
    return Response.json(
      { error: "Open Santé in a browser to build today's plan." },
      { status: 401 }
    );
  }

  /* Now that the caller is known, the cap has something real to count. */
  if (overLimit(profileId)) {
    return Response.json(
      { error: "That is a lot of adaptations for one session. Try again later." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = readinessCheckinSchema.safeParse(body?.checkin);

  if (!parsed.success) {
    return Response.json({ error: "That check-in did not look right." }, { status: 400 });
  }

  const checkin = parsed.data;
  const plan = TODAYS_PLAN;

  /* Quick adjustments the person asked for by tapping a chip. They tighten the
     constraints our own code computes; they never loosen them, and they never
     reach the model as instructions. */
  const fit: string[] = Array.isArray(body?.fit) ? body.fit : [];

  /* Free text, if they typed instead of tapping. Trimmed and capped before it
     goes anywhere near a model: the box on screen holds a sentence, and the
     request body is not the box. */
  const request: string =
    typeof body?.request === "string" ? body.request.trim().slice(0, MAX_REQUEST_CHARS) : "";

  /* Movement tags derived from anything else they told us about today. They
     arrive as tags, not as symptoms or labels, so nothing downstream can treat
     them as clinical information.

     Filtered against the two tags this feature can actually produce, not
     against the catalogue vocabulary. These go straight into excluded_tags,
     and ten valid catalogue tags in one request body exclude every movement
     there is, which left the fallback handing back a nought minute session. */
  const contextTags: string[] = Array.isArray(body?.context_tags)
    ? body.context_tags.filter(
        (t: unknown): t is string => typeof t === "string" && CONTEXT_TAGS.includes(t)
      )
    : [];

  /* How recent sessions felt. This is the one client-supplied value that
     reaches the model as content rather than as a constraint, so it is parsed
     against the enum instead of trusted: anything that is not one of the three
     verdicts is dropped rather than forwarded into Luna's context. */
  const recentFeedback: FeedbackVerdict[] = (
    Array.isArray(body?.recent_feedback) ? body.recent_feedback : []
  )
    .filter((v: unknown): v is FeedbackVerdict => feedbackVerdictSchema.safeParse(v).success)
    .slice(0, MAX_FEEDBACK_ITEMS);

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
        /* Adapt for whoever this actually is. A brand new visitor is
           authenticated but has no profile row yet, and falls back to the demo
           persona rather than to nothing. */
        const stored = await loadProfile(profileId);
        /* Built field by field rather than spread over MAYA. Spreading left a
           signed-in person carrying Maya's id, her is_demo flag, and the
           paragraph she wrote about herself, none of which are theirs. The
           fields nobody stores fall back to the schema's own defaults, not to
           a fictional person's. */
        const profile: UserProfile = stored
          ? {
              id: profileId,
              display_name: stored.display_name ?? "",
              goal: stored.goal ?? "",
              preferred_minutes: stored.preferred_minutes ?? 30,
              avoid_tags: stored.avoid_tags ?? [],
              neurodivergent_mode: stored.nd_mode ?? false,
              context: stored.context ?? null,
              is_demo: false,
            }
          : MAYA;

        /* Deterministic gate and constraints, before the model is reachable. */
        let result = applyFit(computeReadiness(checkin, profile, plan), fit, profile);

        if (contextTags.length > 0 && !result.blocked) {
          const tags = [...result.excluded_tags];
          for (const t of contextTags) if (!tags.includes(t)) tags.push(t);
          result = { ...result, excluded_tags: tags };
        }

        /* If they wrote a sentence, Luna turns it into constraint edits and our
           code decides what those edits are allowed to do. They can only ever
           tighten: nothing typed here can lengthen a session or raise its
           intensity. */
        let interpreted: Awaited<ReturnType<typeof interpretRequest>> = null;
        if (request && !result.blocked) {
          interpreted = await interpretRequest(request);
          if (interpreted) {
            emit({
              step: "tool_call",
              label: "Read what you asked for",
              detail: interpreted.summary || undefined,
            });
            result = {
              ...result,
              excluded_tags: widenIfEmptied(result, interpreted.avoid_tags),
              target_minutes: interpreted.minutes
                ? Math.min(result.target_minutes, interpreted.minutes)
                : result.target_minutes,
              max_movements: interpreted.fewer_movements
                ? Math.max(1, result.max_movements - 1)
                : result.max_movements,
              max_intensity: interpreted.low_intensity ? "low" : result.max_intensity,
              drivers: interpreted.summary
                ? [...result.drivers, interpreted.summary.replace(/^You /, "you ")]
                : result.drivers,
            };
          }
        }
        emit({ step: "authenticated", label: "Opened your plan for today" });
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
          await saveCheckin(profileId, checkin, result);
          send("blocked", { reason: result.block_reason });
          send("done", { ok: true });
          return;
        }

        const recentFeedbackCount = recentFeedback.length;

        const outcome = await runAdaptation({
          plan,
          result,
          recentFeedback,
          emit,
          signal: req.signal,
        });

        const checkinId = await saveCheckin(profileId, checkin, result);
        /* No check-in row means no adaptation row: the table requires the link,
           and an adaptation with no recorded cause is not worth storing. */
        let adaptationId: string | null = null;
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
          /* Everything the app is allowed to use today. Sending it means a
             mid-session swap is a local, instant choice from a list the server
             already vetted, rather than a second trip through the model. */
          allowed_movements: allowedMovements(result),
          /* The adaptation receipt. Everything here is a fact about the run:
             what we knew, what was consulted, what changed. No reasoning. */
          receipt: {
            inputs: [
              "Today's readiness check-in",
              `${profile.avoid_tags.length} saved movement preference${profile.avoid_tags.length === 1 ? "" : "s"}`,
              recentFeedbackCount > 0
                ? `${recentFeedbackCount} recent feedback item${recentFeedbackCount === 1 ? "" : "s"}`
                : "No feedback history yet",
              interpreted ? "What you typed" : fit.length ? "Quick adjustments you tapped" : null,
            ].filter(Boolean),
            tools: [
              "Readiness constraints (our code)",
              "Movement retrieval (filtered to what is allowed)",
              "Plan validation (checked against the constraints)",
            ],
            outcome: {
              minutes: [plan.total_minutes, outcome.adapted.total_minutes],
              movements: [plan.movements.length, outcome.adapted.movements.length],
              intensity: [plan.intensity, outcome.adapted.intensity],
              source: outcome.used_fallback ? "Santé's own rules" : LUNA_MODEL,
            },
          },
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
