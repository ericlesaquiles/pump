import { test } from "vitest";
import assert from "node:assert/strict";
import { generatePlan } from "../src/lib/generator.ts";
import { dayLetter, monthGrid, nextDayIdx, weekDates, workoutsInWeek } from "../src/lib/rotation.ts";
import { EXERCISES as db } from "../src/data/exercises.ts";
import type { Session } from "../src/lib/types.ts";

const plan = generatePlan({ days: 4, minutes: 60 }, db, { now: new Date("2026-11-08T10:00:00Z") });
const session = (date: string, dayIdx: number, savedAt = `${date}T18:00:00Z`, planId = plan.id): Session => ({
  id: `${date}_${dayIdx}`, planId, date, dayIdx, dayKey: plan.days[dayIdx]!.key, dayName: "", unit: "kg", entries: [], note: "", savedAt,
});

test("the rotation starts at A and follows the last logged workout", () => {
  assert.equal(nextDayIdx(plan, []), 0);
  assert.equal(nextDayIdx(plan, [session("2026-11-02", 0)]), 1);
  assert.equal(nextDayIdx(plan, [session("2026-11-02", 0), session("2026-11-05", 3)]), 0, "wraps around after the last workout");
  // Order is by date, not by when it was entered: back-filling an older workout doesn't change what's next.
  assert.equal(nextDayIdx(plan, [session("2026-11-05", 1, "2026-11-05T18:00:00Z"), session("2026-11-03", 2, "2026-11-06T08:00:00Z")]), 2);
  // Two workouts on the same day: the one saved last counts.
  assert.equal(nextDayIdx(plan, [session("2026-11-05", 2, "2026-11-05T19:00:00Z"), session("2026-11-05", 1, "2026-11-05T18:00:00Z")]), 3);
});

test("workouts from another plan don't move the rotation", () => {
  assert.equal(nextDayIdx(plan, [session("2026-11-05", 2, undefined, "old-plan")]), 0);
});

test("empty workouts are skipped", () => {
  const bodyweight = generatePlan({ days: 6, minutes: 60, equipment: [] }, db);
  const empty = bodyweight.days.findIndex((d) => !d.exercises.some((s) => s.sets > 0));
  assert.ok(empty > 0, "bodyweight 6-day plan has an empty pull day");
  const before: Session = { ...session("2026-11-02", empty - 1), planId: bodyweight.id, dayKey: bodyweight.days[empty - 1]!.key };
  assert.notEqual(nextDayIdx(bodyweight, [before]), empty);
});

test("week and month helpers", () => {
  assert.equal(dayLetter(0), "A");
  assert.equal(dayLetter(5), "F");
  // 2026-11-12 is a Thursday; its week runs Monday 9 to Sunday 15.
  const week = weekDates(new Date(2026, 10, 12));
  assert.deepEqual([week[0], week[6]], ["2026-11-09", "2026-11-15"]);
  assert.equal(workoutsInWeek([session("2026-11-08", 0), session("2026-11-09", 1), session("2026-11-15", 2)], new Date(2026, 10, 12)), 2);
  // November 2026 starts on a Sunday and ends on a Monday: 6 calendar rows.
  const nov = monthGrid(2026, 10);
  assert.equal(nov.length, 6);
  assert.deepEqual(nov[0], [null, null, null, null, null, null, "2026-11-01"]);
  assert.deepEqual(nov[5], ["2026-11-30", null, null, null, null, null, null]);
  assert.equal(monthGrid(2026, 11).flat().filter(Boolean).length, 31, "December doesn't spill into January");
});

test("swiping moves along the top-bar tabs and stops at the ends", async () => {
  const { neighbourTab } = await import("../src/hooks/useSwipeTabs.ts");
  assert.equal(neighbourTab("plan", 1), "log");
  assert.equal(neighbourTab("log", 1), "history");
  assert.equal(neighbourTab("history", -1), "log");
  assert.equal(neighbourTab("plan", -1), null);
  assert.equal(neighbourTab("settings", 1), null);
  assert.equal(neighbourTab("setup", 1), null, "the questionnaire isn't a tab");
});
