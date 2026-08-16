"use client";

import { useEffect, useState } from "react";
import { loadWeek, planMinutes, proposeRebalance, saveWeek, todayName, type Rebalance } from "@/lib/week";
import { useIdentity } from "@/lib/identity";

/**
 * When today came out much lighter than planned, the load has to go somewhere
 * or quietly disappear. Santé says where it would put it and waits.
 *
 * The proposal is computed in ordinary code, not asked of a model: moving a
 * session to the next free day is arithmetic, and spending a model call on it
 * would be for show.
 */
export default function RebalanceProposal({ actualMinutes }: { actualMinutes: number }) {
  const [proposal, setProposal] = useState<Rebalance | null>(null);
  const [done, setDone] = useState<"moved" | "kept" | null>(null);
  const { identity, loading } = useIdentity();

  useEffect(() => {
    if (loading) return;
    const week = loadWeek(identity?.id ?? null, Boolean(identity?.isDemo));
    setProposal(proposeRebalance(week, todayName(), actualMinutes));
  }, [actualMinutes, loading, identity]);

  if (done === "moved")
    return (
      <p className="mt-5 rounded-2xl bg-moss/25 px-5 py-4 text-sm">
        Moved. Your week has the heavier session later, and today is what today was.
      </p>
    );

  if (!proposal || done) return null;

  const before = planMinutes(proposal.before.find((d) => d.day === proposal.from)!);

  return (
    <div className="mt-5 rounded-[24px] bg-lavender/35 p-5">
      <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate">
        Your week changed
      </p>
      <p className="mt-2 text-lg">
        Today was {actualMinutes} minutes instead of {before}. Want the longer session moved to{" "}
        {proposal.to}?
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl bg-canvas p-4">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate">Now</p>
          <p className="mt-1 text-sm">
            {proposal.from}: {before} min
            <br />
            {proposal.to}: rest
          </p>
        </div>
        <div className="rounded-xl bg-surface p-4 ring-1 ring-ink/10">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate">Proposed</p>
          <p className="mt-1 text-sm">
            {proposal.from}: {actualMinutes} min
            <br />
            {proposal.to}: {proposal.movedMinutes} min
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => {
            saveWeek(proposal.after, identity?.id ?? null);
            setDone("moved");
          }}
          className="rounded-xl bg-coral px-5 py-2.5 font-bold text-coral-on"
        >
          Update my week
        </button>
        <button onClick={() => setDone("kept")} className="rounded-xl px-5 py-2.5 text-ink-soft underline">
          Leave it
        </button>
      </div>

      <p className="mt-3 text-xs text-slate">
        Nothing moves unless you say so.
      </p>
    </div>
  );
}
