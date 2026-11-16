import { test } from "vitest";
import assert from "node:assert/strict";
import { generatePlan } from "../src/lib/generator.ts";
import { buildWorkout, workoutToSession } from "../src/lib/workout.ts";
import { loggedSets, setsThisWeek } from "../src/lib/volume.ts";
import { EXERCISES as db } from "../src/data/exercises.ts";
import type { Session } from "../src/lib/types.ts";

const plan = generatePlan({ days: 4, minutes: 60 }, db, { now: new Date(2026, 10, 1) });
const day = plan.days[0]!;
const active = day.exercises.map((s, i) => ({ s, i })).filter(({ s }) => s.sets > 0);
const first = active[0]!;
const second = active[1]!;
const past: Session = {
  id: "2026-11-09_0", planId: plan.id, date: "2026-11-09", dayIdx: 0, dayKey: day.key, unit: "kg", note: "", savedAt: "2026-11-09T18:00:00Z",
  entries: [{ slot: first.i, plannedExId: first.s.exId, exId: first.s.exId, sets: [{ w: 60, r: 8, hurt: true }, { w: 62.5, r: 6, hurt: false }] }],
};

test("a new workout is pre-filled with last time's values, set by set", () => {
  const w = buildWorkout(plan, 0, "2026-11-12", [past], "kg");
  const e = w.entries.find((x) => x.slot === first.i)!;
  assert.deepEqual(e.sets.slice(0, 2), [{ w: 60, r: 8, hurt: false }, { w: 62.5, r: 6, hurt: false }], "values copied, pain mark not");
  assert.equal(e.sets[2]?.r ?? null, null, "sets beyond last time's stay empty");
  assert.equal(e.untouched, true);
  const never = w.entries.find((x) => x.slot === second.i)!;
  assert.ok(never.sets.every((s) => s.w === null && s.r === null), "never-done exercise starts empty");
  assert.equal(never.untouched, undefined);
  // Weights from another unit aren't carried over; reps are.
  const lb = buildWorkout(plan, 0, "2026-11-12", [past], "lb").entries.find((x) => x.slot === first.i)!;
  assert.deepEqual(lb.sets[0], { w: null, r: 8, hurt: false });
  // Only earlier workouts count as "last time".
  assert.equal(buildWorkout(plan, 0, "2026-11-08", [past], "kg").entries.find((x) => x.slot === first.i)!.untouched, undefined);
});

test("saving keeps Done and edited exercises, drops skipped and untouched pre-filled ones", () => {
  const w = buildWorkout(plan, 0, "2026-11-12", [past], "kg");
  assert.equal(workoutToSession(w, plan), null, "only untouched pre-filled values: nothing to save");

  const third = active[2]!;
  w.entries = w.entries.map((e) =>
    e.slot === first.i ? { ...e, state: "done" as const, untouched: undefined }
    : e.slot === second.i ? { ...e, state: "skipped" as const, sets: [{ w: 20, r: 10, hurt: false }] }
    : e.slot === third.i ? { ...e, sets: [{ w: 30, r: 12, hurt: false }] }
    : e);
  const s = workoutToSession(w, plan)!;
  assert.deepEqual(s.entries.map((e) => e.slot).sort(), [first.i, third.i].sort());
  assert.equal(s.entries.find((e) => e.slot === first.i)!.done, true);
  assert.deepEqual(s.skipped, [second.i]);

  // Reopening the saved workout restores Done and Skipped.
  const again = buildWorkout(plan, 0, "2026-11-12", [past, s], "kg");
  assert.equal(again.entries.find((e) => e.slot === first.i)!.state, "done");
  assert.equal(again.entries.find((e) => e.slot === second.i)!.state, "skipped");
  assert.equal(again.entries.find((e) => e.slot === third.i)!.state, undefined);
});

test("sets logged this week are counted per muscle like the plan", () => {
  const ex = db.find((e) => e.id === "Barbell_Bench_Press_-_Medium_Grip")!;
  const s = (date: string, reps: number[]): Session => ({ ...past, id: date, date, entries: [{ slot: 0, plannedExId: ex.id, exId: ex.id, sets: reps.map((r) => ({ w: 60, r, hurt: false })) }] });
  const done = loggedSets([s("2026-11-10", [8, 8, 0])], db);
  assert.equal(done.chest, 2, "sets without reps don't count");
  assert.equal(done.triceps, 1, "secondary muscle counts half");
  // Week of Thursday 2026-11-12 runs Monday 9 to Sunday 15.
  const week = setsThisWeek([s("2026-11-08", [8]), s("2026-11-09", [8]), s("2026-11-15", [8, 8])], db, new Date(2026, 10, 12));
  assert.equal(week.chest, 3);
});
