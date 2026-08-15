import OpenAI from "openai";
import {
  adaptedPlanSchema,
  type AdaptedPlan,
  type AgentEvent,
  type DailyPlan,
  type FeedbackVerdict,
  type Movement,
  type ReadinessResult,
  type UserProfile,
} from "@/types/domain";
import { allowedMovements, fallbackPlan } from "./readiness";
import { movementById } from "./demo-data";

export const LUNA_MODEL = process.env.LUNA_MODEL || "gpt-5.6-luna";

/**
 * The agent loop.
 *
 * Luna gets read-only tools whose implementations enforce the constraints our
 * own code computed. It chooses what to look up and what to propose; it cannot
 * widen a limit, invent a movement, or write anything. Every response is parsed
 * with Zod and then checked against the constraints again before we trust it.
 *
 * Events are emitted from the real loop as it runs. Nothing here is theatre,
 * and the model's reasoning items are never surfaced.
 */

type RunArgs = {
  profile: UserProfile;
  plan: DailyPlan;
  result: ReadinessResult;
  recentFeedback: FeedbackVerdict[];
  emit: (event: AgentEvent) => void;
  signal?: AbortSignal;
};

type RunOutcome = {
  adapted: DailyPlan;
  reasons: string[];
  used_fallback: boolean;
};

const SYSTEM_PROMPT = `You adapt one day's wellness plan to the capacity a person just reported.

How you work:
- Call find_movement_options before proposing anything. It returns only movements that are already allowed today, so anything it gives you is safe to use.
- Call get_recent_feedback when it would change your choice, for example if they recently said a session was too much.
- Choose from the returned ids only. Never invent an id, a movement name, or an instruction.
- Stay within the constraints you are given: maximum intensity, target minutes, maximum number of movements.

How you write the reasons:
- Two to four short lines, plain language, second person.
- Refer only to what they reported today: energy, discomfort, mood, sensory load.
- Never mention or imply a medical condition, diagnosis, cause, or treatment. Never say a movement is "safe for" anything.
- No guilt, no encouragement to push through, no praise for effort. Warm and matter of fact.
- Good: "You reported low energy, so we kept the movements you find easiest and cut the total time roughly in half."
- Bad: "Because of your anemia, we lowered the intensity."`;

function toolDefs() {
  return [
    {
      type: "function" as const,
      name: "find_movement_options",
      description:
        "Movements allowed for today. Already filtered by the day's constraints, so everything returned is permitted.",
      parameters: {
        type: "object",
        properties: {
          max_minutes: {
            type: "integer",
            description: "Only return movements no longer than this.",
          },
        },
        required: ["max_minutes"],
        additionalProperties: false,
      },
      strict: true,
    },
    {
      type: "function" as const,
      name: "get_recent_feedback",
      description:
        "How this person rated their recent sessions: too_much, just_right, or could_do_more, newest first.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false,
      },
      strict: true,
    },
  ];
}

function outputFormat() {
  return {
    type: "json_schema" as const,
    name: "adapted_plan",
    strict: true,
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        total_minutes: { type: "integer" },
        intensity: { type: "string", enum: ["low", "moderate", "high"] },
        movement_ids: { type: "array", items: { type: "string" } },
        reasons: { type: "array", items: { type: "string" } },
      },
      required: ["title", "total_minutes", "intensity", "movement_ids", "reasons"],
      additionalProperties: false,
    },
  };
}

/** Constraint check that runs after Zod. Zod proves the shape; this proves the
 *  content is inside the limits our own code set. */
function violations(candidate: AdaptedPlan, result: ReadinessResult, pool: Movement[]): string[] {
  const rank = { low: 1, moderate: 2, high: 3 } as const;
  const allowed = new Set(pool.map((m) => m.id));
  const problems: string[] = [];

  const invented = candidate.movement_ids.filter((id) => !allowed.has(id));
  if (invented.length) problems.push(`these ids are not in the allowed list: ${invented.join(", ")}`);

  if (candidate.movement_ids.length > result.max_movements)
    problems.push(`too many movements, the maximum today is ${result.max_movements}`);

  if (rank[candidate.intensity] > rank[result.max_intensity])
    problems.push(`intensity is above today's maximum of ${result.max_intensity}`);

  const realMinutes = candidate.movement_ids.reduce(
    (sum, id) => sum + (movementById(id)?.minutes ?? 0),
    0
  );
  if (realMinutes > result.target_minutes + 3)
    problems.push(`that comes to ${realMinutes} minutes, over today's target of ${result.target_minutes}`);

  return problems;
}

export async function runAdaptation({
  profile,
  plan,
  result,
  recentFeedback,
  emit,
  signal,
}: RunArgs): Promise<RunOutcome> {
  const pool = allowedMovements(result);

  emit({
    step: "constraints_computed",
    label: "Worked out today's limits",
    detail: `${result.max_intensity} intensity · about ${result.target_minutes} min · up to ${result.max_movements} movements`,
  });

  if (!process.env.OPENAI_API_KEY) {
    emit({ step: "fallback", label: "Using the built-in plan", detail: "No model configured" });
    return finishWithFallback(result, plan);
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const userMessage = [
    `Today's plan: ${plan.title}, ${plan.total_minutes} minutes, ${plan.intensity} intensity, ${plan.movements.length} movements (${plan.movements.map((m) => m.id).join(", ")}).`,
    `They reported: ${result.drivers.join("; ")}.`,
    `Constraints: maximum intensity ${result.max_intensity}, target ${result.target_minutes} minutes, at most ${result.max_movements} movements.`,
    profile.neurodivergent_mode
      ? "This person uses the simplified mode, so prefer fewer movements and the quietest options."
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  let input: any[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userMessage },
  ];

  let attempt = 0;

  while (attempt < 2) {
    attempt += 1;

    try {
      let response = await client.responses.create(
        { model: LUNA_MODEL, input, tools: toolDefs(), text: { format: outputFormat() } },
        { signal }
      );

      /* Tool loop. Luna is a reasoning model: its function_call items are paired
         with reasoning items, so the whole output array goes back untouched.
         See src/lib/luna-notes.md. */
      let hops = 0;
      while (hops < 4) {
        const calls = (response.output || []).filter((o: any) => o.type === "function_call");
        if (calls.length === 0) break;
        hops += 1;

        const outputs = calls.map((call: any) => {
          let payload: unknown;

          if (call.name === "find_movement_options") {
            let args: any = {};
            try {
              args = JSON.parse(call.arguments || "{}");
            } catch {
              args = {};
            }
            const cap = Number.isFinite(args.max_minutes) ? args.max_minutes : result.target_minutes;
            const options = pool.filter((m) => m.minutes <= cap);
            emit({
              step: "tool_call",
              label: "Looked up today's options",
              detail: `${options.length} movements fit`,
            });
            payload = options.map((m) => ({
              id: m.id,
              name: m.name,
              intensity: m.intensity,
              minutes: m.minutes,
              tags: m.tags,
            }));
          } else if (call.name === "get_recent_feedback") {
            emit({
              step: "tool_call",
              label: "Checked your recent feedback",
              detail: recentFeedback.length ? recentFeedback.join(", ") : "nothing yet",
            });
            payload = recentFeedback;
          } else {
            payload = { error: "unknown tool" };
          }

          return {
            type: "function_call_output",
            call_id: call.call_id,
            output: JSON.stringify(payload),
          };
        });

        input = [...input, ...response.output, ...outputs];
        response = await client.responses.create(
          { model: LUNA_MODEL, input, tools: toolDefs(), text: { format: outputFormat() } },
          { signal }
        );
      }

      emit({ step: "model_responded", label: "Drafted an adapted plan" });

      const parsed = adaptedPlanSchema.safeParse(JSON.parse(response.output_text || "{}"));
      if (!parsed.success) {
        if (attempt < 2) {
          emit({ step: "retrying", label: "Output did not match, asking again" });
          input = [
            ...input,
            ...response.output,
            {
              role: "user",
              content: "That did not match the required format. Reply again in the exact schema.",
            },
          ];
          continue;
        }
        emit({ step: "fallback", label: "Using the built-in plan", detail: "Invalid output twice" });
        return finishWithFallback(result, plan);
      }

      const problems = violations(parsed.data, result, pool);
      if (problems.length > 0) {
        if (attempt < 2) {
          emit({ step: "retrying", label: "Outside today's limits, asking again", detail: problems[0] });
          input = [
            ...input,
            ...response.output,
            { role: "user", content: `That plan is not allowed: ${problems.join("; ")}. Try again.` },
          ];
          continue;
        }
        emit({ step: "fallback", label: "Using the built-in plan", detail: problems[0] });
        return finishWithFallback(result, plan);
      }

      emit({ step: "validated", label: "Checked it against today's limits" });

      /* Rebuild from our own catalogue so instructions and durations are ours,
         never the model's. */
      const movements = parsed.data.movement_ids
        .map((id) => movementById(id))
        .filter((m): m is Movement => Boolean(m));

      return {
        adapted: {
          id: "adapted",
          title: parsed.data.title,
          total_minutes: movements.reduce((s, m) => s + m.minutes, 0),
          intensity: parsed.data.intensity,
          movements,
        },
        reasons: parsed.data.reasons,
        used_fallback: false,
      };
    } catch (err) {
      if (attempt < 2) {
        emit({ step: "retrying", label: "The model did not answer, trying once more" });
        continue;
      }
      emit({ step: "fallback", label: "Using the built-in plan", detail: "The model was unavailable" });
      return finishWithFallback(result, plan);
    }
  }

  return finishWithFallback(result, plan);
}

function finishWithFallback(result: ReadinessResult, plan: DailyPlan): RunOutcome {
  const adapted = fallbackPlan(result, plan);
  return {
    adapted,
    reasons: [
      `${capitalise(result.drivers[0] ?? "you checked in")}, so we shortened today's session.`,
      `We kept ${adapted.movements.length} movement${adapted.movements.length === 1 ? "" : "s"} at a gentle pace.`,
    ],
    used_fallback: true,
  };
}

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
