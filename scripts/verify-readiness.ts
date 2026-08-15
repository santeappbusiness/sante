import { computeReadiness, allowedMovements, fallbackPlan } from "../src/lib/readiness";
import { MAYA, TODAYS_PLAN } from "../src/lib/demo-data";

// The exact demo scenario from the build bible.
const demo = { energy: 2, discomfort: 4, mood: 2, sensory_load: 4, red_flags: [] };
const r = computeReadiness(demo as any, MAYA, TODAYS_PLAN);
console.log("score:", r.score, "| intensity:", r.max_intensity,
            "| target:", r.target_minutes, "min | max moves:", r.max_movements);
console.log("excluded:", r.excluded_tags.join(", "));
console.log("drivers:", r.drivers.join(" / "));

const allowed = allowedMovements(r);
console.log("allowed candidates:", allowed.length, "->", allowed.map(m => m.id).join(", "));
console.log("any jumping leaked?", allowed.some(m => m.tags.includes("jumping")));

const fb = fallbackPlan(r, TODAYS_PLAN);
console.log("FALLBACK:", fb.total_minutes, "min ·", fb.intensity, "·",
            fb.movements.length, "movements ->", fb.movements.map(m => m.name).join(", "));

// Red flag must stop everything.
const flagged = computeReadiness({ ...demo, red_flags: ["chest_pain"] } as any, MAYA, TODAYS_PLAN);
console.log("red flag blocked:", flagged.blocked);

// A good day should stay close to the original.
const good = computeReadiness({ energy: 5, discomfort: 1, mood: 5, sensory_load: 1, red_flags: [] } as any, MAYA, TODAYS_PLAN);
console.log("good day:", good.score, good.max_intensity, good.target_minutes + "min", good.max_movements + " moves");
