/**
 * FROZEN CONTRACTS.
 *
 * Both engineers build against this file. If a type here has to change, it is a
 * tiny pull request of its own: change it, tell the other engineer, merge, both
 * pull, then carry on. Do not edit it inline while building a feature.
 *
 * Everything the model produces is validated against the Zod schemas at the
 * bottom before it is trusted. The TypeScript types are inferred from those
 * schemas so the two can never drift apart.
 */

import { z } from "zod";

/* ------------------------------------------------------------------ *
 * Readiness: the only signal we take. No wearable, no cycle prediction.
 * ------------------------------------------------------------------ */

/** 1 is lowest, 5 is highest. Energy and mood are "more is better";
 *  discomfort and sensory load are "more is harder". */
export const SCALE_MIN = 1;
export const SCALE_MAX = 5;

export const readinessScale = z.number().int().min(SCALE_MIN).max(SCALE_MAX);

export const redFlagSchema = z.enum([
  "chest_pain",
  "fainting_or_severe_dizziness",
  "severe_or_unusual_pain",
  "possible_pregnancy_complication",
]);

export const readinessCheckinSchema = z.object({
  energy: readinessScale,
  discomfort: readinessScale,
  mood: readinessScale,
  sensory_load: readinessScale,
  red_flags: z.array(redFlagSchema).default([]),
  note: z.string().max(500).optional(),
});

/* ------------------------------------------------------------------ *
 * Constraints: computed by our own code, never by the model.
 * ------------------------------------------------------------------ */

export const intensitySchema = z.enum(["low", "moderate", "high"]);

export const readinessResultSchema = z
  .object({
    /** 0 to 100. Presentational only; the constraints below do the real work. */
    score: z.number().int().min(0).max(100),
    blocked: z.boolean(),
    block_reason: z.string().optional(),
    max_intensity: intensitySchema,
    /** 0 only on a blocked day, where nothing may be built at all. The floor
     *  for a usable day is still 5, enforced below rather than here, because
     *  the legal range genuinely depends on `blocked`. */
    target_minutes: z.number().int().min(0).max(60),
    max_movements: z.number().int().min(0).max(8),
    /** Movement tags the plan must avoid, e.g. "jumping", "floor_work". */
    excluded_tags: z.array(z.string()),
    /**
     * Calm mode reached the constraints, so quiet movements are preferred over
     * equally permitted noisy ones. A preference rather than an exclusion: a
     * quiet day should still be allowed to be a strong one.
     */
    prefer_quiet: z.boolean().default(false),
    /** Short, plain-language reasons shown under "Why this changed". */
    drivers: z.array(z.string()),
  })
  /* A blocked verdict must not describe a session anyone could build. Zeroes
     are what make a forgotten `blocked` check produce nothing instead of a
     short gentle session, so the shape has to hold them and nothing else. */
  .superRefine((result, ctx) => {
    if (result.blocked) {
      if (result.target_minutes !== 0 || result.max_movements !== 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "a blocked result must carry no buildable session: target_minutes and max_movements are both 0",
        });
      }
      return;
    }
    if (result.target_minutes < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["target_minutes"],
        message: "a usable day is at least 5 minutes",
      });
    }
    if (result.max_movements < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["max_movements"],
        message: "a usable day has at least one movement",
      });
    }
  });

/* ------------------------------------------------------------------ *
 * Movements and plans
 * ------------------------------------------------------------------ */

export const movementSchema = z.object({
  id: z.string(),
  name: z.string(),
  intensity: intensitySchema,
  minutes: z.number().int().min(1).max(30),
  /** "jumping", "floor_work", "standing", "seated", "breathing", ... */
  tags: z.array(z.string()),
  /** One or two short sentences. Neurodivergent mode shows only the first. */
  instructions: z.string(),
});

export const dailyPlanSchema = z.object({
  id: z.string(),
  title: z.string(),
  total_minutes: z.number().int(),
  intensity: intensitySchema,
  movements: z.array(movementSchema),
});

export const adaptedPlanSchema = z.object({
  title: z.string(),
  total_minutes: z.number().int().min(5).max(60),
  intensity: intensitySchema,
  /** Ids only. The server rebuilds the full movements from its own catalogue,
   *  so the model can never invent a movement or change its instructions. */
  movement_ids: z.array(z.string()).min(1).max(8),
  /** Two to four short lines for "Why this changed". Readiness-only language:
   *  never causal about a reported condition, never a medical claim. */
  reasons: z.array(z.string()).min(1).max(4),
});

/* ------------------------------------------------------------------ *
 * Session and feedback
 * ------------------------------------------------------------------ */

export const feedbackVerdictSchema = z.enum(["too_much", "just_right", "could_do_more"]);

export const sessionFeedbackSchema = z.object({
  adaptation_id: z.string(),
  verdict: feedbackVerdictSchema,
  completed_movement_ids: z.array(z.string()),
  note: z.string().max(500).optional(),
});

/* ------------------------------------------------------------------ *
 * Profile
 * ------------------------------------------------------------------ */

export const userProfileSchema = z.object({
  id: z.string(),
  display_name: z.string(),
  goal: z.string(),
  preferred_minutes: z.number().int().min(5).max(60),
  /** Movement tags this person always avoids. */
  avoid_tags: z.array(z.string()),
  neurodivergent_mode: z.boolean(),
  /** Self-reported narrative context. Storytelling only. Never a clinical
   *  input, never read by the red-flag gate, never referenced causally in
   *  generated copy. Free text rather than tags, deliberately: a list of
   *  condition labels invites being treated as structured clinical data, and
   *  this is not a medical product. */
  context: z.string().max(1000).nullable().default(null),
  is_demo: z.boolean().default(false),
});

/* ------------------------------------------------------------------ *
 * Agent events: what the UI streams while the tool loop runs.
 * These are emitted from the real loop, never faked.
 * ------------------------------------------------------------------ */

export const agentEventSchema = z.object({
  step: z.enum([
    "authenticated",
    "safety_checked",
    "constraints_computed",
    "tool_call",
    "tool_result",
    "model_responded",
    "validated",
    "retrying",
    "fallback",
    "saved",
    "done",
    "error",
  ]),
  label: z.string(),
  detail: z.string().optional(),
});

/* ------------------------------------------------------------------ *
 * Inferred types. Import these, not hand-written interfaces.
 * ------------------------------------------------------------------ */

export type RedFlag = z.infer<typeof redFlagSchema>;
export type ReadinessCheckin = z.infer<typeof readinessCheckinSchema>;
export type ReadinessResult = z.infer<typeof readinessResultSchema>;
export type Intensity = z.infer<typeof intensitySchema>;
export type Movement = z.infer<typeof movementSchema>;
export type DailyPlan = z.infer<typeof dailyPlanSchema>;
export type AdaptedPlan = z.infer<typeof adaptedPlanSchema>;
export type FeedbackVerdict = z.infer<typeof feedbackVerdictSchema>;
export type SessionFeedback = z.infer<typeof sessionFeedbackSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type AgentEvent = z.infer<typeof agentEventSchema>;

/** What the client receives once the adaptation is validated and saved. */
export type AdaptationResult = {
  adaptation_id: string | null;
  original: DailyPlan;
  adapted: DailyPlan;
  reasons: string[];
  /** True when the model failed and our deterministic rules produced the plan. */
  used_fallback: boolean;
};
