"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  collectionById,
  workoutById,
  workoutMovements,
} from "@/lib/workouts";
import { mediaForMovement } from "@/lib/movement-media";
import MovementDemo from "@/components/MovementDemo";
import { usePublishBottomInset } from "@/lib/bottomInset";
import { readCalm, useCalmSync } from "@/components/CalmMode";
import type { Movement } from "@/types/domain";
import { addToDay, loadWeek, todayName, type PlannedDay } from "@/lib/week";
import AppNav from "@/components/AppNav";
import { useIdentity } from "@/lib/identity";
import { Asterisk, Blob, Sprig } from "@/components/BrandShapes";
import {
  EquipmentIcon,
  IntensityIcon,
  HelpIcon,
  MovementsIcon,
  PlaceIcon,
  PlayIcon,
  SensoryIcon,
  TimeIcon,
} from "@/components/ControlIcons";
import SaveButton from "@/components/SaveButton";

/**
 * A workout, as a real page.
 *
 * Everything someone needs to decide whether today is the day for it: what it
 * asks, what it needs, what is in it, and three things they can do about it.
 */
export default function WorkoutDetail() {
  const params = useParams<{ id: string }>();
  const workout = workoutById(params.id);
  const [week, setWeek] = useState<PlannedDay[]>([]);
  const [added, setAdded] = useState<string | null>(null);
  /* One sheet for the whole list. */
  const [demo, setDemo] = useState<Movement | null>(null);
  const [calm, setCalm] = useState(false);
  useCalmSync(setCalm);

  /* This page parks its own bar above the navigation, so the floating Calm
     control has to be told how tall it is or it lands on "Start session". */
  const actions = useRef<HTMLDivElement>(null);
  usePublishBottomInset(actions);

  const { identity, loading } = useIdentity();
  const uid = identity?.id ?? null;
  const isDemo = Boolean(identity?.isDemo);

  useEffect(() => {
    if (loading) return;
    setWeek(loadWeek(uid, isDemo));
    setCalm(readCalm(uid));
  }, [loading, uid, isDemo]);

  if (!workout) {
    return (
      <>
        <main className="mx-auto max-w-3xl px-5 py-10 lg:pl-56">
          <p className="text-ink-soft">That session does not exist.</p>
          <Link href="/explore" className="mt-4 inline-block underline">
            Back to Explore
          </Link>
        </main>
        <AppNav />
      </>
    );
  }

  const blocks = workoutMovements(workout);
  const collections = workout.collection_ids
    .map(collectionById)
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <>
      <main className="pb-36 lg:pb-10 lg:pl-56">
        {/* Hero */}
        <section className="relative overflow-hidden bg-moss/25 px-5 pb-14 pt-10">
          <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-16 text-moss/40">
            <Blob size={300} />
          </div>
          <div className="relative mx-auto max-w-3xl">
            <Link href="/explore" className="text-sm text-slate underline">
              Explore
            </Link>

            <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
              {workout.title}
            </h1>
            <p className="mt-3 max-w-lg text-lg text-ink-soft">{workout.description}</p>

            {/* One icon per fact, from the control family, so duration here
                reads as the same idea as duration in the player. The icons sit
                beside the words rather than replacing them. */}
            <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-4">
              {(
                [
                  [TimeIcon, "Duration", `${workout.duration_minutes} min`],
                  [IntensityIcon, "Intensity", workout.intensity],
                  [MovementsIcon, "Movements", String(workout.blocks.length)],
                  [SensoryIcon, "Sensory load", workout.sensory_load],
                  [
                    EquipmentIcon,
                    "Equipment",
                    workout.equipment.length ? workout.equipment.join(", ") : "None",
                  ],
                  [PlaceIcon, "Where", workout.environment.join(", ")],
                ] as Array<[typeof TimeIcon, string, string]>
              ).map(([Icon, label, value]) => (
                <div key={label} className="flex items-start gap-2">
                  <span aria-hidden="true" className="mt-0.5 shrink-0 text-moss-deep">
                    <Icon size={18} />
                  </span>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-[0.13em] text-slate">
                      {label}
                    </dt>
                    <dd className="mt-0.5 font-mono text-sm capitalize">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-5">
          {/* Adapt CTA, the one that matters most */}
          <section className="relative z-10 -mt-8 rounded-[24px] bg-surface p-6 shadow-[0_1px_2px_rgba(47,58,51,0.04),0_20px_50px_-32px_rgba(47,58,51,0.35)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-display text-2xl">Feeling different today?</p>
                <p className="mt-1 max-w-sm text-ink-soft">
                  Check in and Santé will reshape this session around the day you are actually
                  having.
                </p>
              </div>
              <span aria-hidden="true" className="shrink-0 text-moss">
                <Sprig size={38} />
              </span>
            </div>
            {/* Carries the workout with it. Sending people to a bare /today
                handed them the baseline session to adapt, so the thing they
                had just chosen quietly vanished. */}
            <Link
              href={`/today?start=${workout.id}`}
              className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-coral px-6 py-3.5 font-bold text-coral-on"
            >
              <span aria-hidden="true">
                <Asterisk size={18} />
              </span>
              Adapt this session
            </Link>
          </section>

          <p className="mt-7 max-w-lg text-ink-soft">{workout.intent}</p>

          {/* What is in it */}
          <section className="mt-8">
            <h2 className="font-display text-2xl">What is in it</h2>
            <ol className="mt-4 grid gap-2">
              {blocks.map(({ movement, block }, i) => (
                <li
                  key={movement.id + i}
                  className="rounded-[20px] bg-surface p-5 ring-1 ring-ink/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs text-slate">{i + 1}</p>
                      <h3 className="mt-0.5 font-display text-xl">{movement.name}</h3>
                      <p className="mt-1 font-mono text-sm text-moss-deep">
                        {block.prescription}
                      </p>
                    </div>
                    {/* Only where a demonstration exists. One sheet opens for
                        whichever movement asked, rather than a live player
                        embedded beside every line of the list. */}
                    {mediaForMovement(movement.id) && (
                      <button
                        onClick={() => setDemo(movement)}
                        aria-haspopup="dialog"
                        aria-label={`Watch a demonstration of ${movement.name}`}
                        className="flex min-h-[44px] shrink-0 items-center gap-2 rounded-full bg-canvas px-4 text-sm text-ink-soft ring-1 ring-ink/15 hover:ring-ink/30"
                      >
                        <span aria-hidden="true">
                          <HelpIcon size={18} />
                        </span>
                        <span className="hidden sm:inline">Watch demonstration</span>
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-ink-soft">{movement.instructions}</p>
                  {block.rest_seconds > 0 && (
                    <p className="mt-2 font-mono text-xs text-slate">
                      then {block.rest_seconds}s rest
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </section>

          {/* Add to a day */}
          <section className="mt-8 rounded-[24px] bg-lavender/30 p-6">
            <h2 className="font-display text-2xl">Put it in your week</h2>
            <p className="mt-1 text-ink-soft">
              It becomes that day&rsquo;s intended session, and it can still flex on the day.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {week.map((d) => (
                <button
                  key={d.day}
                  onClick={() => {
                    setWeek(addToDay(d.day, workout, uid, isDemo));
                    setAdded(d.day);
                  }}
                  className={
                    "inline-flex min-h-[44px] items-center rounded-full px-4 py-2 text-sm ring-1 " +
                    (added === d.day
                      ? "bg-moss/40 font-bold ring-transparent"
                      : "bg-surface ring-ink/15 hover:ring-ink/30")
                  }
                >
                  {added === d.day && <span aria-hidden="true">✓ </span>}
                  {d.day.slice(0, 3)}
                  {d.day === todayName() && " (today)"}
                </button>
              ))}
            </div>
            {added && (
              <p className="mt-3 text-sm" role="status">
                Added to {added}.{" "}
                <Link href="/plan" className="underline">
                  See your week
                </Link>
              </p>
            )}
          </section>

          {collections.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-2xl">Also in</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {collections.map((c) => (
                  <Link
                    key={c.id}
                    href={`/explore/${c.id}`}
                    className="inline-flex min-h-[44px] items-center rounded-full bg-surface px-4 py-2 text-sm ring-1 ring-ink/15"
                  >
                    {c.title}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sticky start, on every width. It used to be mobile only, which left
            the desktop start action at the very bottom of a long page: the one
            thing this page exists for was the last thing anyone could find. */}
        <div
          ref={actions}
          className="fixed inset-x-0 bottom-[60px] z-20 border-t border-ink/10 bg-surface/95 px-5 py-3 backdrop-blur lg:bottom-0 lg:left-56"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
        >
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <SaveButton workoutId={workout.id} />
            <Link
              href={`/today?start=${workout.id}&begin=1`}
              className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-2xl bg-coral px-5 py-3.5 text-center font-bold text-coral-on"
            >
              <span aria-hidden="true">
                <PlayIcon size={18} />
              </span>
              Start session
            </Link>
          </div>
        </div>

        {demo && mediaForMovement(demo.id) && (
          <MovementDemo
            media={mediaForMovement(demo.id)!}
            movementName={demo.name}
            instructions={demo.instructions}
            quiet={calm}
            onClose={() => setDemo(null)}
          />
        )}
      </main>
      <AppNav />
    </>
  );
}
