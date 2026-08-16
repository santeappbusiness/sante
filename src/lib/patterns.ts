import type { HistoryEntry } from "./storage";

/**
 * Personal patterns, computed rather than generated.
 *
 * Every line here is arithmetic over the person's own history. Asking a model
 * to spot trends in six rows invites it to invent one, and a wellness app
 * confidently telling someone something untrue about their body is exactly the
 * failure worth designing against.
 *
 * Nothing is claimed until there is enough to claim it, and every statement is
 * descriptive: what they did, never what it means.
 */

export type Pattern = { text: string; evidence: string };

export function derivePatterns(entries: HistoryEntry[]): Pattern[] {
  if (entries.length < 3) return [];

  const patterns: Pattern[] = [];

  const adapted = entries.filter((e) => e.adapted_minutes < e.original_minutes);
  if (adapted.length >= 2) {
    const avg = Math.round(
      adapted.reduce((s, e) => s + e.adapted_minutes, 0) / adapted.length
    );
    patterns.push({
      text: `When you adapt a session, it usually lands around ${avg} minutes.`,
      evidence: `${adapted.length} adapted sessions`,
    });
  }

  const shortening = adapted.length / entries.length;
  if (shortening >= 0.6) {
    patterns.push({
      text: "You adapt more often than you keep the original, which is what the plan is for.",
      evidence: `${adapted.length} of ${entries.length} sessions`,
    });
  }

  const fallbacks = entries.filter((e) => e.source === "fallback");
  if (fallbacks.length > 0 && fallbacks.length < entries.length) {
    patterns.push({
      text:
        fallbacks.length === 1
          ? "One session was built by Santé's own rules rather than the assistant, and still worked."
          : `${fallbacks.length} sessions were built by Santé's own rules rather than the assistant, and still worked.`,
      evidence: "graceful fallback",
    });
  }

  const totals = entries.map((e) => e.adapted_minutes).sort((a, b) => a - b);
  if (totals.length >= 3) {
    const median = totals[Math.floor(totals.length / 2)];
    patterns.push({
      text: `Your typical session is about ${median} minutes.`,
      evidence: `median of ${totals.length}`,
    });
  }

  return patterns.slice(0, 4);
}

/** Minutes per day for the last fortnight, for the chart. */
export function minutesByDay(entries: HistoryEntry[], days = 14) {
  const out: Array<{ label: string; date: string; minutes: number }> = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toDateString();
    const minutes = entries
      .filter((e) => new Date(e.created_at).toDateString() === key)
      .reduce((s, e) => s + e.adapted_minutes, 0);
    out.push({
      label: d.toLocaleDateString(undefined, { weekday: "narrow" }),
      date: key,
      minutes,
    });
  }
  return out;
}
