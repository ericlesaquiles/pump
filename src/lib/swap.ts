// Exercise swapping: reruns slot filling for one slot with the same filters.
import { PATTERNS, MUSCLES, MUSCLE_KEYS, EQUIPMENT, JOINTS } from "./constants.ts";
import { exclusionReason, scoreExercise, refreshPlan, indexExercises, weeklySets, getEx } from "./generator.ts";
import type { Equipment, Exercise, Joint, Muscle, Plan } from "./types.ts";

const EQUIP_WORDS: Record<Equipment, string> = {
  barbell: "a barbell", dumbbell: "dumbbells", cable: "a cable", machine: "a machine", bands: "bands",
  kettlebell: "a kettlebell", pullup_bar: "a pull-up bar", dip_bars: "dip bars", bench: "a bench", rack: "a rack",
};

const onlyFrom = (ex: Exercise, allowed: string[]) => ex.equipment.every((i) => i.split("|").some((e) => allowed.includes(e)));

export type QuickFilter = "dumbbells" | "no_bench" | "machines";
export const QUICK_FILTERS: Record<QuickFilter, { label: string; test: (ex: Exercise) => boolean }> = {
  dumbbells: { label: "Dumbbells only", test: (ex) => onlyFrom(ex, ["dumbbell", "bench"]) },
  no_bench: { label: "No bench", test: (ex) => !ex.equipment.includes("bench") },
  machines: { label: "Machines and cables", test: (ex) => ex.equipment.length > 0 && onlyFrom(ex, ["machine", "cable"]) },
};

function equipmentPhrase(ex: Exercise): string {
  const items = ex.equipment.filter((i) => i !== "bench" && i !== "rack");
  const first = items[0];
  if (!first) return ex.equipment.length ? "uses a bench" : "needs no equipment";
  return `uses ${first.split("|").map((e) => EQUIP_WORDS[e as Equipment] ?? EQUIPMENT[e as Equipment]).join(" or ")}`;
}

export interface SwapCandidate {
  ex: Exercise;
  /** 1 = same movement, 2 = same main muscle, different movement, 3 = shifts the muscle mix. */
  tier: 1 | 2 | 3;
  score: number;
  reason: string;
  shift: Muscle | null;
}

/** Ranked swap candidates for one exercise in the plan. */
export function swapCandidates(plan: Plan, dayIdx: number, exIdx: number, exercises: Exercise[], { filter = null as QuickFilter | null } = {}): SwapCandidate[] {
  const day = plan.days[dayIdx];
  const slot = day?.exercises[exIdx];
  if (!day || !slot) return [];
  const byId = indexExercises(exercises);
  const current = getEx(byId, slot.exId);
  const pat = PATTERNS[slot.pattern];
  const inDay = new Set(day.exercises.map((s) => s.exId));
  const answers = plan.answers;
  const pats = [slot.pattern, ...pat.related];

  const out: SwapCandidate[] = [];
  for (const ex of exercises) {
    if (inDay.has(ex.id)) continue;
    const mainWeight = ex.muscles[pat.main] ?? 0;
    if (!pats.includes(ex.pattern) && mainWeight < 1) continue;
    if (exclusionReason(ex, answers)) continue;
    if (filter && !QUICK_FILTERS[filter].test(ex)) continue;

    const samePattern = ex.pattern === slot.pattern;
    const sameType = ex.type === current.type;
    const tier: SwapCandidate["tier"] = mainWeight < 1 ? 3 : samePattern && sameType ? 1 : 2;

    // Which other muscle gains the most relative to the current exercise?
    let shift: { m: Muscle; w: number } | null = null;
    for (const [m, w] of Object.entries(ex.muscles) as [Muscle, number][]) {
      if (m !== pat.main && w > (current.muscles[m] ?? 0) && w >= 0.5 && (!shift || w > shift.w)) shift = { m, w };
    }

    const reasons: string[] = [];
    if (tier === 1) reasons.push(`Same movement, ${equipmentPhrase(ex)}`);
    else if (tier === 2) reasons.push(`Different movement (${PATTERNS[ex.pattern].label.toLowerCase()}), same main muscle`);
    else reasons.push(`Trains ${MUSCLES[pat.main].toLowerCase()} less directly`);
    const easier = (Object.keys(answers.injuries) as Joint[]).filter((j) => (ex.joints[j] ?? 0) < (current.joints[j] ?? 0));
    if (easier.length) reasons.push(`easier on your ${easier.map((j) => JOINTS[j].toLowerCase()).join(" and ")}`);
    if (shift && (tier > 1 || shift.w >= 1)) reasons.push(`more ${MUSCLES[shift.m].toLowerCase()} work`);

    out.push({ ex, tier, score: scoreExercise(ex, slot.pattern, answers), reason: reasons.join("; "), shift: shift?.m ?? null });
  }
  out.sort((a, b) => a.tier - b.tier || b.score - a.score || a.ex.order - b.ex.order);
  return out;
}

export interface SwapImpact { muscle: Muscle; delta: number; after: number; belowFloor: boolean }

/** Weekly sets per muscle that change if the swap were applied (for the preview). */
export function swapImpact(plan: Plan, dayIdx: number, exIdx: number, newId: string, exercises: Exercise[]): SwapImpact[] {
  const byId = indexExercises(exercises);
  const before = weeklySets(plan.days, byId);
  const days = plan.days.map((d, i) => (i !== dayIdx ? d : { ...d, exercises: d.exercises.map((s, j) => (j === exIdx ? { ...s, exId: newId } : s)) }));
  const after = weeklySets(days, byId);
  const changes: SwapImpact[] = [];
  for (const m of MUSCLE_KEYS) {
    const d = Math.round((after[m] - before[m]) * 10) / 10;
    if (d !== 0) changes.push({ muscle: m, delta: d, after: Math.round(after[m] * 10) / 10, belowFloor: after[m] + 1e-9 < plan.targets[m].floor });
  }
  return changes;
}

export type SwapScope = "plan" | "never";

/**
 * Apply a swap to the plan. Returns a new plan; the input is not modified.
 * "never" also adds the old exercise to the skip list and replaces it everywhere.
 */
export function applySwap(plan: Plan, dayIdx: number, exIdx: number, newId: string, exercises: Exercise[], scope: SwapScope = "plan"): Plan {
  const byId = indexExercises(exercises);
  const next = structuredClone(plan);
  const slot = next.days[dayIdx]?.exercises[exIdx];
  if (!slot) return next;
  const oldId = slot.exId;
  const oldName = byId.get(oldId)?.name ?? oldId;
  slot.exId = newId;
  slot.reasons = [`Swapped in by you (replaced ${oldName}).`];
  if (scope === "never" && !next.answers.dislikes.includes(oldId)) {
    next.answers.dislikes.push(oldId);
    next.days.forEach((d, di) => d.exercises.forEach((s, si) => {
      if (s.exId !== oldId) return;
      const alt = swapCandidates(next, di, si, exercises)[0];
      if (alt) { s.exId = alt.ex.id; s.reasons = [`Replaced ${oldName}, which you chose to skip.`]; }
    }));
  }
  return refreshPlan(next, exercises);
}
