import { test } from "vitest";
import assert from "node:assert/strict";
import { generatePlan } from "../src/lib/generator.ts";
import { buildAskText } from "../src/lib/ask.ts";
import { buildWorkout } from "../src/lib/workout.ts";
import { EXERCISES as db } from "../src/data/exercises.ts";
import type { Session } from "../src/lib/types.ts";

const today = new Date(2026, 10, 15);
const plan = generatePlan({ days: 4, minutes: 60, injuries: { knee: "mild" }, age: 34 }, db, { now: today });
const first = plan.days[0]!.exercises.find((s) => s.sets > 0)!;
const session = (date: string, w: number, hurt = false): Session => ({
  id: `${date}_0`, planId: plan.id, date, dayIdx: 0, dayKey: plan.days[0]!.key, unit: "kg", note: "", savedAt: `${date}T18:00:00Z`,
  entries: [{ slot: first.slot, plannedExId: first.exId, exId: first.exId, sets: [{ w, r: 8, hurt }, { w: w + 2.5, r: 6, hurt: false }] }],
});
const sessions = [session("2026-10-01", 50), session("2026-11-03", 60), session("2026-11-10", 62.5, true)];

test("exercise context: profile, plan, recent sets and pain marks, in Portuguese", () => {
  const text = buildAskText(plan, sessions, db, "pt", { kind: "exercise", exId: first.exId }, today);
  assert.match(text, /^Uso um app de musculação chamado Pump/);
  assert.match(text, /Lesões ou limitações: Joelho \(Desconforto leve\)/);
  assert.match(text, /Treinos registrados nas últimas 4 semanas: 2/, "only the last 28 days count");
  assert.match(text, /Supino reto com barra/);
  assert.match(text, /62,5×8; 65×6 kg \(marcado com dor\)/);
  assert.match(text, /## Minha pergunta\n$/);
  assert.ok(!/undefined|NaN|\[object/.test(text), text);
});

test("workout context includes unsaved sets and notes; plan context works in English", () => {
  const w = buildWorkout(plan, 0, "2026-11-15", sessions, "kg");
  // As the Workout screen does: editing a set clears the "pre-filled, untouched" flag.
  w.entries[0] = { ...w.entries[0]!, sets: [{ w: 65, r: 8, hurt: false }, ...w.entries[0]!.sets.slice(1)], untouched: undefined };
  w.note = "Slept badly";
  const text = buildAskText(plan, sessions, db, "en", { kind: "workout", workout: w }, today);
  assert.match(text, /The workout I'm asking about: Workout A · Upper/);
  assert.match(text, /65×8, 65×6 kg/, "edited first set plus last time's second set");
  assert.match(text, /not logged/);
  assert.match(text, /My notes: Slept badly/);
  const planText = buildAskText(plan, [], db, "en", { kind: "plan" }, today);
  assert.equal(planText.split("\n").filter((l) => l.startsWith("- Workout ")).length, 4);
  assert.ok(planText.length < 4000, `short enough to share (${planText.length} chars)`);
});
