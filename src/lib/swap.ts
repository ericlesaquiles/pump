// Exercise swapping: reruns slot filling for one slot with the same filters.
import { PATTERNS, MUSCLE_KEYS } from "./constants.ts";
import { exclusionReason, scoreExercise, refreshPlan, indexExercises, weeklySets, getEx } from "./generator.ts";
import type { Equipment, Exercise, Joint, Muscle, Pattern, Plan } from "./types.ts";

const onlyFrom = (ex: Exercise, allowed: string[]) => ex.equipment.every((i) => i.split("|").some((e) => allowed.includes(e)));

export type QuickFilter = "dumbbells" | "no_bench" | "machines";
export const QUICK_FILTERS: Record<QuickFilter, (ex: Exercise) => boolean> = {
  dumbbells: (ex) => onlyFrom(ex, ["dumbbell", "bench"]),
  no_bench: (ex) => !ex.equipment.includes("bench"),
  machines: (ex) => ex.equipment.length > 0 && onlyFrom(ex, ["machine", "cable"]),
};

/** What equipment a candidate needs, for "same movement, uses dumbbells". */
export type EquipmentNeed = { kind: "none" } | { kind: "bench" } | { kind: "uses"; items: Equipment[] };

export function equipmentNeed(ex: Exercise): EquipmentNeed {
  const first = ex.equipment.filter((i) => i !== "bench" && i !== "rack")[0];
  if (!first) return ex.equipment.length ? { kind: "bench" } : { kind: "none" };
  return { kind: "uses", items: first.split("|") as Equipment[] };
}

/** Why a candidate is offered, as data for the UI to phrase. */
export interface SwapReason {
  tier: 1 | 2 | 3;
  equipment: EquipmentNeed;
  /** The candidate's own movement pattern (tier 2). */
  pattern: Pattern;
  /** The slot's main muscle (tier 3). */
  main: Muscle;
  /** Limited joints this candidate loads less than the current exercise. */
  easier: Joint[];
  /** Another muscle that gets clearly more work. */
  more: Muscle | null;
}

export interface SwapCandidate {
  ex: Exercise;
  /** 1 = same movement, 2 = same main muscle, different movement, 3 = shifts the muscle mix. */
  tier: 1 | 2 | 3;
  score: number;
  reason: SwapReason;
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
    if (filter && !QUICK_FILTERS[filter](ex)) continue;

    const samePattern = ex.pattern === slot.pattern;
    const sameType = ex.type === current.type;
    const tier: SwapCandidate["tier"] = mainWeight < 1 ? 3 : samePattern && sameType ? 1 : 2;

    // Which other muscle gains the most relative to the current exercise?
    let shift: { m: Muscle; w: number } | null = null;
    for (const [m, w] of Object.entries(ex.muscles) as [Muscle, number][]) {
      if (m !== pat.main && w > (current.muscles[m] ?? 0) && w >= 0.5 && (!shift || w > shift.w)) shift = { m, w };
    }

    const easier = (Object.keys(answers.injuries) as Joint[]).filter((j) => (ex.joints[j] ?? 0) < (current.joints[j] ?? 0));
    const reason: SwapReason = {
      tier, equipment: equipmentNeed(ex), pattern: ex.pattern, main: pat.main, easier,
      more: shift && (tier > 1 || shift.w >= 1) ? shift.m : null,
    };

    out.push({ ex, tier, score: scoreExercise(ex, slot.pattern, answers), reason, shift: shift?.m ?? null });
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
  const next = structuredClone(plan);
  const slot = next.days[dayIdx]?.exercises[exIdx];
  if (!slot) return next;
  const oldId = slot.exId;
  slot.exId = newId;
  slot.reasons = [{ k: "reason.swapped", ex: oldId }];
  if (scope === "never" && !next.answers.dislikes.includes(oldId)) {
    next.answers.dislikes.push(oldId);
    next.days.forEach((d, di) => d.exercises.forEach((s, si) => {
      if (s.exId !== oldId) return;
      const alt = swapCandidates(next, di, si, exercises)[0];
      if (alt) { s.exId = alt.ex.id; s.reasons = [{ k: "reason.replacedSkipped", ex: oldId }]; }
    }));
  }
  return refreshPlan(next, exercises);
}
