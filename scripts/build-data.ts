// Builds src/data/exercises.json from the curated overlay and the
// free-exercise-db text (instructions, original name). Run: npm run build:data
// (Node runs this TypeScript file directly via type stripping.)
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { OVERLAY } from "../data/overlay.ts";
import { PATTERNS, MUSCLES, EQUIPMENT, JOINTS, MOVEMENTS, SKILL_RANK } from "../src/lib/constants.ts";
import type { Exercise } from "../src/lib/types.ts";

interface BaseExercise { id: string; name: string; instructions: string[] }

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const base = JSON.parse(readFileSync(path.join(root, "data/vendor/free-exercise-db.json"), "utf8")) as BaseExercise[];
const byId = new Map(base.map((e) => [e.id, e]));

const errors: string[] = [];
const seen = new Set<string>();
const has = (o: object, k: string) => Object.hasOwn(o, k);

const out: Exercise[] = OVERLAY.map((o, index) => {
  const b = byId.get(o.id);
  if (!b) errors.push(`${o.id}: not in free-exercise-db`);
  if (seen.has(o.id)) errors.push(`${o.id}: duplicate`);
  seen.add(o.id);
  if (!has(PATTERNS, o.pattern)) errors.push(`${o.id}: unknown pattern ${o.pattern}`);
  for (const m of Object.keys(o.muscles)) if (!has(MUSCLES, m)) errors.push(`${o.id}: unknown muscle ${m}`);
  for (const item of o.equipment) for (const e of item.split("|")) if (!has(EQUIPMENT, e)) errors.push(`${o.id}: unknown equipment ${e}`);
  for (const j of Object.keys(o.joints)) if (!has(JOINTS, j)) errors.push(`${o.id}: unknown joint ${j}`);
  for (const m of o.moves ?? []) if (!has(MOVEMENTS, m)) errors.push(`${o.id}: unknown movement ${m}`);
  if (!has(SKILL_RANK, o.skill)) errors.push(`${o.id}: unknown skill ${o.skill}`);
  const compound = o.type ? o.type === "compound" : PATTERNS[o.pattern].compound;
  return {
    id: o.id,
    order: index,
    name: o.name ?? b?.name ?? o.id,
    sourceName: b?.name ?? null,
    pattern: o.pattern,
    type: compound ? "compound" : "isolation",
    muscles: o.muscles,
    equipment: o.equipment,
    skill: o.skill,
    joints: o.joints,
    moves: o.moves ?? [],
    staple: Boolean(o.staple),
    note: o.note ?? null,
    instructions: b?.instructions ?? [],
  };
});

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const payload = {
  source: "free-exercise-db (public domain, https://github.com/yuhonas/free-exercise-db) + Pump curated overlay",
  count: out.length,
  exercises: out,
};
writeFileSync(path.join(root, "src/data/exercises.json"), JSON.stringify(payload));
console.log(`Wrote ${out.length} exercises to src/data/exercises.json`);
