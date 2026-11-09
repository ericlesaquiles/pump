import { test } from "vitest";
import assert from "node:assert/strict";
import { generatePlan, indexExercises, exclusionReason, normalizeAnswers, weeklySets, getEx } from "../src/lib/generator.ts";
import { swapCandidates, applySwap, swapImpact } from "../src/lib/swap.ts";
import { cue, historyFor } from "../src/lib/progression.ts";
import { buildReviewInput } from "../src/lib/review.ts";
import { FULL_GYM, SPLITS } from "../src/lib/constants.ts";
import { EXERCISES as db } from "../src/data/exercises.ts";
import type { Experience, Goal, Plan, RawAnswers, Session } from "../src/lib/types.ts";

const byId = indexExercises(db);
const lookup = (id: string) => getEx(byId, id);
const now = new Date("2026-11-08T10:00:00Z");
const gen = (a: RawAnswers) => generatePlan(a, db, { now });
const active = (plan: Plan) => plan.days.flatMap((d) => d.exercises.filter((s) => s.sets > 0));

const SCENARIOS: RawAnswers[] = [];
for (const days of [2, 3, 4, 5, 6])
  for (const minutes of [45, 60, 90])
    for (const experience of ["beginner", "intermediate", "advanced"] as Experience[])
      for (const goal of ["muscle", "strength"] as Goal[])
        SCENARIOS.push({ days, minutes, experience, goal, equipment: FULL_GYM });

test("every full-gym scenario builds the right split within the time budget", () => {
  for (const a of SCENARIOS) {
    const plan = gen(a);
    assert.equal(plan.days.length, a.days);
    assert.deepEqual(plan.days.map((d) => d.key), SPLITS[a.days!]!.days);
    for (const d of plan.days) {
      assert.ok(d.exercises.some((s) => s.sets > 0), `${d.name} empty for ${JSON.stringify(a)}`);
      assert.ok(d.estMinutes <= a.minutes! + 1, `${d.name} ${d.estMinutes} min > ${a.minutes} for ${JSON.stringify(a)}`);
      const ids = d.exercises.map((s) => s.exId);
      assert.equal(new Set(ids).size, ids.length, "no exercise twice in one day");
    }
  }
});

test("a 60-minute full-gym plan has no volume warnings for intermediates", () => {
  for (const days of [3, 4, 5, 6]) {
    const plan = gen({ days, minutes: 60, experience: "intermediate", equipment: FULL_GYM });
    assert.deepEqual(plan.warnings.filter((w) => w.kind === "volume"), [], `days=${days}`);
  }
});

test("generation is deterministic", () => {
  const a: RawAnswers = { days: 5, minutes: 60, priorities: ["glutes"], injuries: { shoulder: "mild" } };
  assert.deepEqual(gen(a), gen(a));
});

test("equipment is respected", () => {
  const plan = gen({ days: 3, minutes: 60, equipment: ["dumbbell", "bench"] });
  for (const s of active(plan)) {
    const ex = lookup(s.exId);
    for (const item of ex.equipment) assert.ok(item.split("|").some((e) => ["dumbbell", "bench"].includes(e)), ex.name);
  }
});

test("avoided and injured joints and painful movements are excluded", () => {
  const a: RawAnswers = { days: 4, minutes: 60, injuries: { knee: "avoid", lower_back: "injured" }, painful: ["overhead"] };
  const plan = gen(a);
  for (const s of active(plan)) {
    const ex = lookup(s.exId);
    assert.ok((ex.joints.knee ?? 0) < 2, `${ex.name} loads the knee`);
    assert.ok(!ex.joints.lower_back, `${ex.name} loads the lower back`);
    assert.ok(!ex.moves.includes("overhead"), `${ex.name} is overhead`);
  }
  assert.ok(plan.notices.some((n) => n.includes("lower back")), "injured joint gets a notice");
});

test("mild limitations raise reps on stressful exercises", () => {
  const plan = gen({ days: 4, minutes: 60, injuries: { shoulder: "mild" } });
  const lighter = active(plan).filter((s) => s.lighter.length);
  for (const s of lighter) assert.ok((lookup(s.exId).joints.shoulder ?? 0) >= 2);
  const normal = gen({ days: 4, minutes: 60 });
  const same = lighter.find((s) => active(normal).some((n) => n.exId === s.exId && n.pattern === s.pattern));
  if (same) {
    const n = active(normal).find((x) => x.exId === same.exId)!;
    assert.equal(same.reps[0], n.reps[0] + 3);
  }
});

test("prioritized muscles get more weekly sets", () => {
  const base = gen({ days: 4, minutes: 75 });
  const prio = gen({ days: 4, minutes: 75, priorities: ["glutes", "arms"] });
  assert.ok(prio.weekly.glutes > base.weekly.glutes, `glutes ${prio.weekly.glutes} vs ${base.weekly.glutes}`);
  assert.ok(prio.weekly.biceps + prio.weekly.triceps >= base.weekly.biceps + base.weekly.triceps);
});

test("beginners never get advanced exercises", () => {
  const plan = gen({ days: 3, minutes: 60, experience: "beginner" });
  for (const s of active(plan)) assert.notEqual(lookup(s.exId).skill, "advanced");
});

test("bodyweight-only plans don't crash and explain empty days", () => {
  const plan = gen({ days: 6, minutes: 60, equipment: [] });
  assert.ok(plan.notices.some((n) => n.includes("Pull days")));
});

test("dislikes are never used", () => {
  const dislikes = ["Barbell_Squat", "Barbell_Bench_Press_-_Medium_Grip"];
  const plan = gen({ days: 4, minutes: 60, dislikes });
  for (const s of active(plan)) assert.ok(!dislikes.includes(s.exId));
});

test("normalizeAnswers clamps and cleans input", () => {
  const a = normalizeAnswers({ days: 9, minutes: 5, goal: "x", priorities: ["chest", "back", "arms", "abs"], injuries: { knee: "mild", elbow: "none", nose: "avoid" } } as unknown as RawAnswers);
  assert.equal(a.days, 6);
  assert.equal(a.minutes, 30);
  assert.equal(a.goal, "muscle");
  assert.equal(a.priorities.length, 3);
  assert.deepEqual(a.injuries, { knee: "mild" });
});

test("swap candidates respect the plan's filters and rank same-movement first", () => {
  const plan = gen({ days: 4, minutes: 60, injuries: { shoulder: "avoid" } });
  const di = 0;
  const ei = plan.days[di]!.exercises.findIndex((s) => s.pattern === "horizontal_push");
  const cands = swapCandidates(plan, di, ei, db);
  assert.ok(cands.length > 0);
  for (const c of cands) assert.equal(exclusionReason(c.ex, plan.answers), null, c.ex.name);
  for (let i = 1; i < cands.length; i++) assert.ok(cands[i - 1]!.tier <= cands[i]!.tier);
  assert.equal(cands[0]!.tier, 1);
  assert.ok(!cands.some((c) => plan.days[di]!.exercises.some((s) => s.exId === c.ex.id)), "no exercise already in the day");
});

test("applying a swap updates the plan and weekly sets", () => {
  const plan = gen({ days: 4, minutes: 60 });
  const ei = plan.days[0]!.exercises.findIndex((s) => s.pattern === "horizontal_push");
  const target = swapCandidates(plan, 0, ei, db).find((c) => c.ex.id === "Dips_-_Chest_Version") ?? swapCandidates(plan, 0, ei, db)[0]!;
  const impact = swapImpact(plan, 0, ei, target.ex.id, db);
  const next = applySwap(plan, 0, ei, target.ex.id, db, "plan");
  assert.equal(next.days[0]!.exercises[ei]!.exId, target.ex.id);
  assert.notEqual(plan.days[0]!.exercises[ei]!.exId, target.ex.id, "original plan untouched");
  const w = weeklySets(next.days, byId);
  for (const c of impact) assert.ok(Math.abs(w[c.muscle] - c.after) < 0.11, c.muscle);
});

test("'never again' swaps add the exercise to dislikes and remove it everywhere", () => {
  const plan = gen({ days: 6, minutes: 60, experience: "beginner" });
  const counts = new Map<string, number>();
  for (const s of active(plan)) counts.set(s.exId, (counts.get(s.exId) ?? 0) + 1);
  const repeated = [...counts].find(([, n]) => n > 1)?.[0];
  assert.ok(repeated, "beginner 6-day plan repeats exercises");
  const di = plan.days.findIndex((d) => d.exercises.some((s) => s.exId === repeated));
  const ei = plan.days[di]!.exercises.findIndex((s) => s.exId === repeated);
  const alt = swapCandidates(plan, di, ei, db)[0]!;
  const next = applySwap(plan, di, ei, alt.ex.id, db, "never");
  assert.ok(next.answers.dislikes.includes(repeated!));
  assert.ok(!next.days.some((d) => d.exercises.some((s) => s.exId === repeated)));
});

test("progression cue: add weight only when every set hits the top of the range", () => {
  const sessions: Pick<Session, "date" | "unit" | "entries">[] = [
    { date: "2026-11-01", unit: "kg", entries: [{ slot: 0, plannedExId: "Barbell_Squat", exId: "Barbell_Squat", sets: [{ w: 100, r: 8, hurt: false }, { w: 100, r: 8, hurt: false }, { w: 100, r: 8, hurt: false }] }] },
  ];
  const h = historyFor(sessions, "Barbell_Squat");
  assert.equal(cue(h, { sets: 3, reps: [5, 8] }, "squat", "kg").kind, "add");
  assert.equal(cue(h, { sets: 3, reps: [5, 8] }, "squat", "kg").text, "Add 5 kg");
  sessions[0]!.entries[0]!.sets[2]!.r = 7;
  assert.equal(cue(historyFor(sessions, "Barbell_Squat"), { sets: 3, reps: [5, 8] }, "squat", "kg").kind, "hold");
  assert.equal(cue([], { sets: 3, reps: [5, 8] }, "squat", "kg").kind, "first");
});

test("progression cue: stall after 2+ weeks without improvement", () => {
  const s = (date: string): Pick<Session, "date" | "unit" | "entries"> => ({ date, unit: "kg", entries: [{ slot: 0, plannedExId: "Barbell_Curl", exId: "Barbell_Curl", sets: [{ w: 30, r: 9, hurt: false }, { w: 30, r: 9, hurt: false }] }] });
  const h = historyFor([s("2026-10-01"), s("2026-10-08"), s("2026-10-16")], "Barbell_Curl");
  assert.equal(cue(h, { sets: 2, reps: [10, 15] }, "biceps_curl", "kg").kind, "stall");
});

test("review input contains the plan as text and no API key", () => {
  const plan = gen({ days: 3, minutes: 60, injuries: { knee: "mild" } });
  const input = buildReviewInput(plan, db);
  assert.equal(input.days.length, 3);
  assert.ok(input.person.limitations[0]!.startsWith("Knee"));
  assert.ok(!JSON.stringify(input).includes("sk-ant"));
});
