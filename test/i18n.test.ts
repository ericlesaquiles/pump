import { test } from "vitest";
import assert from "node:assert/strict";
import { generatePlan, migratePlan } from "../src/lib/generator.ts";
import { swapCandidates, applySwap } from "../src/lib/swap.ts";
import { cue } from "../src/lib/progression.ts";
import { buildReviewInput } from "../src/lib/review.ts";
import { DICTS, textOf } from "../src/i18n/index.ts";
import { en } from "../src/i18n/en.ts";
import { pt } from "../src/i18n/pt.ts";
import { exerciseText } from "../src/i18n/exercises.ts";
import { EXERCISES as db } from "../src/data/exercises.ts";
import ptData from "../src/data/exercises.pt.json";
import type { Msg, Plan, RawAnswers } from "../src/lib/types.ts";

// Plans that between them produce every kind of message.
const PLANS: RawAnswers[] = [
  { days: 4, minutes: 60, injuries: { knee: "mild", lower_back: "injured", shoulder: "avoid" }, painful: ["overhead"], dislikes: ["Barbell_Squat"] },
  { days: 6, minutes: 30, equipment: [] },
  { days: 5, minutes: 45, goal: "strength", experience: "beginner", equipment: ["dumbbell", "bench"] },
  { days: 3, minutes: 30, equipment: ["bands"] },
];

const allText = (plan: Plan, lang: "en" | "pt") => {
  const t = DICTS[lang];
  return [
    ...plan.notices.map((n) => textOf(t, n)),
    ...plan.warnings.map((w) => t.msg(w.msg)),
    ...plan.days.flatMap((d) => d.exercises.flatMap((s) => s.reasons.map((r) => textOf(t, r)))),
  ];
};

test("every plan message renders in both languages", () => {
  const kinds = new Set<Msg["k"]>();
  for (const a of PLANS) {
    let plan = generatePlan(a, db);
    // A swap adds the "swapped" and "replaced, skipped" reasons.
    const di = plan.days.findIndex((d) => d.exercises.some((s) => s.sets > 0));
    const ei = plan.days[di]!.exercises.findIndex((s) => s.sets > 0);
    const alt = swapCandidates(plan, di, ei, db)[0];
    if (alt) plan = applySwap(plan, di, ei, alt.ex.id, db, "never");
    for (const n of plan.notices) if (typeof n !== "string") kinds.add(n.k);
    for (const w of plan.warnings) kinds.add(w.msg.k);
    for (const d of plan.days) for (const s of d.exercises) for (const r of s.reasons) if (typeof r !== "string") kinds.add(r.k);
    for (const lang of ["en", "pt"] as const) {
      for (const s of allText(plan, lang)) {
        assert.ok(s.length > 10, `${lang}: "${s}"`);
        assert.ok(!/undefined|NaN|\[object/.test(s), `${lang}: "${s}"`);
      }
    }
  }
  const missing = ["reason.fallback", "reason.slot", "reason.insteadOf", "reason.lighter", "reason.swapped", "reason.replacedSkipped",
    "notice.injured", "notice.dayEmpty", "warn.volume", "warn.full"].filter((k) => !kinds.has(k as Msg["k"]));
  assert.deepEqual(missing, [], "test plans cover the main message kinds");
});

test("Portuguese messages use Portuguese words, exercise names and decimal commas", () => {
  const plan = generatePlan({ days: 4, minutes: 60, injuries: { lower_back: "injured", knee: "mild" } }, db);
  const notice = textOf(pt, plan.notices[0]!);
  assert.match(notice, /^Sua lombar está marcada como lesionada/);
  assert.equal(pt.msg({ k: "warn.volume", muscle: "calves", sets: 4.5, floor: 6 }), "Panturrilhas: 4,5 séries por semana, abaixo do mínimo de 6.");
  assert.equal(pt.msg({ k: "reason.swapped", ex: "Barbell_Squat" }), "Escolhido por você (substituiu Agachamento livre com barra).");
  assert.equal(en.msg({ k: "notice.dayEmpty", days: [3, 6], key: "pull" }).slice(0, 26), "Workouts D and G (Pull) ha");
  assert.equal(pt.workout.cue("add", cue([{ date: "2026-11-01", unit: "kg", sets: [{ w: 20, r: 12 }] }], { sets: 1, reps: [8, 12] }, "biceps_curl", "kg")), "Aumente 2,5 kg");
});

test("swap reasons render in both languages", () => {
  const plan = generatePlan({ days: 4, minutes: 60, injuries: { shoulder: "mild" } }, db);
  const ei = plan.days[0]!.exercises.findIndex((s) => s.pattern === "horizontal_push");
  for (const c of swapCandidates(plan, 0, ei, db)) {
    for (const t of [en, pt]) assert.ok(!/undefined/.test(t.swap.reason(c.reason)), t.swap.reason(c.reason));
  }
});

test("every exercise has a Portuguese name", () => {
  const data = ptData as Record<string, { name: string; instructions?: string[] }>;
  for (const ex of db) {
    assert.ok(data[ex.id]?.name, `${ex.id} has no Portuguese name`);
    const text = exerciseText(ex, "pt");
    assert.equal(text.instructions.length > 0, ex.instructions.length > 0, `${ex.id} instructions`);
  }
  assert.equal(Object.keys(data).length, db.length, "no translations for unknown exercises");
});

test("old plans are migrated: no weekdays or day names, warnings as messages", () => {
  const plan = generatePlan({ days: 3, minutes: 45 }, db);
  const old = structuredClone(plan) as unknown as Record<string, unknown> & { days: Record<string, unknown>[]; warnings: unknown[] };
  delete old.v;
  old.splitName = "Full body";
  old.days.forEach((d, i) => { d.weekday = [1, 3, 5][i]; d.name = "Full body A"; d.focus = "x"; });
  old.warnings = [{ kind: "time", text: "old" }];
  const migrated = migratePlan(old as unknown as Plan, db);
  assert.equal(migrated.v, 2);
  assert.ok(!("splitName" in migrated));
  for (const d of migrated.days) assert.deepEqual(Object.keys(d).sort(), ["estMinutes", "exercises", "key"]);
  assert.ok(migrated.warnings.every((w) => typeof w.msg === "object"));
  assert.equal(migrated.days[0]!.exercises[0]!.rir, plan.days[0]!.exercises[0]!.rir);
});

test("the review input follows the chosen language", () => {
  const plan = generatePlan({ days: 3, minutes: 60, injuries: { knee: "mild" } }, db);
  const input = buildReviewInput(plan, db, "pt");
  assert.equal(input.person.limitations[0], "Joelho: Desconforto leve");
  assert.equal(input.days[0]!.day, "Treino A · Corpo inteiro");
  assert.ok(input.weeklySetsPerMuscle["Peito"]);
});
