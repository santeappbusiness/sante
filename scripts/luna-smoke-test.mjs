/**
 * Luna smoke test. Run this before anything else is built on top of the model.
 *
 *   OPENAI_API_KEY=sk-... node scripts/luna-smoke-test.mjs
 *   OPENAI_API_KEY=sk-... LUNA_MODEL=<exact-id> node scripts/luna-smoke-test.mjs
 *
 * It answers the four questions that gate the whole build:
 *   1. Does the key work at all?
 *   2. What is the exact model id available to this account?
 *   3. Does function calling work?
 *   4. Does structured output come back in the shape we validate against?
 *
 * It prints latency too, because latency decides whether the adapt route needs
 * to stream. Nothing here writes to a database or touches app code.
 */

import OpenAI from "openai";

const key = process.env.OPENAI_API_KEY;
if (!key) {
  console.error("\n  No OPENAI_API_KEY in the environment.\n");
  console.error("  Run it like this:\n");
  console.error("    OPENAI_API_KEY=sk-... node scripts/luna-smoke-test.mjs\n");
  process.exit(1);
}

const client = new OpenAI({ apiKey: key });
const wanted = process.env.LUNA_MODEL || null;

function line() {
  console.log("-".repeat(64));
}

/* ---------- 1. key works, and what models exist ---------- */

let models = [];
try {
  const page = await client.models.list();
  models = page.data.map((m) => m.id).sort();
  console.log(`\n  Key works. ${models.length} models available to this account.`);
} catch (err) {
  console.error("\n  The key was rejected:", err?.message || err);
  console.error("  Check it is the right project's key and that billing is active.\n");
  process.exit(1);
}

const candidates = models.filter((m) => /gpt-5|luna/i.test(m));
line();
console.log("  Models matching gpt-5 or luna:");
if (candidates.length === 0) {
  console.log("    none. Full list starts:", models.slice(0, 12).join(", "));
} else {
  candidates.forEach((m) => console.log("   ", m));
}

const model = wanted || candidates[0] || models[0];
line();
console.log(`  Testing with: ${model}`);
if (!wanted && candidates.length > 1) {
  console.log("  (pass LUNA_MODEL=<id> to pin a different one)");
}

/* ---------- 2. function calling + structured output ---------- */

const tools = [
  {
    type: "function",
    name: "find_movement_options",
    description:
      "Return the movements allowed for today. Only ever returns options that already satisfy the caller's constraints.",
    parameters: {
      type: "object",
      properties: {
        max_intensity: { type: "string", enum: ["low", "moderate", "high"] },
        max_minutes: { type: "integer" },
      },
      required: ["max_intensity", "max_minutes"],
      additionalProperties: false,
    },
  },
];

/* The same shape as adaptedPlanSchema in src/types/domain.ts. */
const outputFormat = {
  type: "json_schema",
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

const catalogue = [
  { id: "mv_breath", name: "Slow breathing", intensity: "low", minutes: 3, tags: ["seated", "breathing"] },
  { id: "mv_neck", name: "Neck and shoulder release", intensity: "low", minutes: 4, tags: ["seated"] },
  { id: "mv_walk", name: "Gentle walk in place", intensity: "low", minutes: 5, tags: ["standing"] },
];

const input = [
  {
    role: "system",
    content:
      "You adapt a wellness plan to the user's reported capacity. You must call find_movement_options before proposing anything, and you may only use movement ids it returns. Reference reported readiness only, never a medical condition or cause. Keep reasons short and plain.",
  },
  {
    role: "user",
    content:
      "Today's plan is 35 minutes, moderate, 5 movements. The user reported low energy, high discomfort, low mood and high sensory load. Constraints: max intensity low, target 12 minutes, at most 3 movements.",
  },
];

let toolCallSeen = null;
let parsed = null;
const started = Date.now();

try {
  let response = await client.responses.create({
    model,
    input,
    tools,
    text: { format: outputFormat },
  });

  const calls = (response.output || []).filter((o) => o.type === "function_call");
  if (calls.length > 0) {
    toolCallSeen = { name: calls[0].name, args: calls[0].arguments };

    const followUp = [
      ...input,
      ...calls,
      ...calls.map((c) => ({
        type: "function_call_output",
        call_id: c.call_id,
        output: JSON.stringify(catalogue),
      })),
    ];

    response = await client.responses.create({
      model,
      input: followUp,
      tools,
      text: { format: outputFormat },
    });
  }

  const text = response.output_text;
  parsed = JSON.parse(text);
} catch (err) {
  line();
  console.error("\n  The call failed:", err?.message || err);
  console.error("\n  Common causes:");
  console.error("   - wrong model id for this account, try LUNA_MODEL with one listed above");
  console.error("   - the account has no credits");
  console.error("   - this model does not support the Responses API on this account\n");
  process.exit(1);
}

const ms = Date.now() - started;

/* ---------- 3. report ---------- */

line();
console.log(`  Round trip: ${ms} ms${ms > 8000 ? "  <- slow enough that the adapt route must stream" : ""}`);
console.log(`  Tool call:  ${toolCallSeen ? toolCallSeen.name + " " + toolCallSeen.args : "NONE - the model skipped the tool"}`);
line();
console.log("  Structured output:");
console.log(JSON.stringify(parsed, null, 2));
line();

const allowed = new Set(catalogue.map((m) => m.id));
const invented = (parsed.movement_ids || []).filter((id) => !allowed.has(id));

const checks = [
  ["key and model reachable", true],
  ["function calling used", Boolean(toolCallSeen)],
  ["structured output parsed", Boolean(parsed)],
  ["stayed inside the catalogue", invented.length === 0],
  ["respected the 3 movement cap", (parsed.movement_ids || []).length <= 3],
  ["respected low intensity", parsed.intensity === "low"],
];

console.log("  Result:");
checks.forEach(([label, ok]) => console.log(`   ${ok ? "PASS" : "FAIL"}  ${label}`));

if (invented.length) console.log(`\n  Invented ids: ${invented.join(", ")}`);

const allPassed = checks.every(([, ok]) => ok);
console.log(
  allPassed
    ? `\n  Green. Record in HQ: model ${model}, ${ms} ms round trip.\n`
    : `\n  Something failed above. The server validates all of this anyway, but tell the team before building on it.\n`
);
