// Rule-based plan generator. Pure functions: same answers + same exercise
// list => same plan. See the design doc, "Plan generation algorithm".
import {
  PATTERNS, MUSCLES, MUSCLE_KEYS, SPLITS, DAY_TEMPLATES, PRESCRIPTION,
  BASE_WEEKLY_SETS, SKILL_RANK, PRIORITY_GROUPS, JOINTS, MOVEMENTS,
} from "./constants.ts";
import type {
  Answers, Equipment, Exercise, Joint, Movement, Muscle, MuscleTarget, Pattern, Plan, PlanDay,
  PlanExercise, PlanWarning, PriorityGroup, RawAnswers, Severity,
} from "./types.ts";

export const LIMITS = {
  maxSetsCompound: 5,
  maxSetsIsolation: 4,
  perSessionMuscleCap: 10,
  warmupSeconds: 360,
  firstCompoundWarmupSeconds: 120,
  transitionSeconds: 60,
  workSecondsCompound: 50,
  workSecondsIsolation: 40,
  repairPasses: 5,
} as const;

export const PUSH = new Set<Pattern>(["horizontal_push", "incline_push", "vertical_push", "chest_fly", "triceps_ext"]);
export const PULL = new Set<Pattern>(["horizontal_pull", "vertical_pull", "rear_delt", "biceps_curl"]);

export type ExerciseIndex = Map<string, Exercise>;
type Targets = Record<Muscle, MuscleTarget>;
type Volume = Record<Muscle, number>;

export const DEFAULT_ANSWERS: Answers = {
  days: 4,
  minutes: 60,
  goal: "muscle",
  experience: "intermediate",
  equipment: ["barbell", "rack", "bench", "dumbbell", "cable", "machine", "pullup_bar", "dip_bars"],
  injuries: {},
  painful: [],
  priorities: [],
  dislikes: [],
  age: null,
};

export function normalizeAnswers(a: RawAnswers = {}): Answers {
  const days = Math.min(6, Math.max(2, Number(a.days) || 4));
  const injuries: Answers["injuries"] = {};
  for (const [j, s] of Object.entries(a.injuries ?? {})) {
    if (j in JOINTS && (s === "mild" || s === "avoid" || s === "injured")) injuries[j as Joint] = s as Severity;
  }
  return {
    days,
    minutes: Math.min(120, Math.max(30, Number(a.minutes) || 60)),
    goal: a.goal && a.goal in PRESCRIPTION ? a.goal : "muscle",
    experience: a.experience && a.experience in BASE_WEEKLY_SETS ? a.experience : "intermediate",
    equipment: [...new Set(a.equipment ?? DEFAULT_ANSWERS.equipment)],
    injuries,
    painful: (a.painful ?? []).filter((m): m is Movement => m in MOVEMENTS),
    priorities: (a.priorities ?? []).filter((p): p is PriorityGroup => p in PRIORITY_GROUPS).slice(0, 3),
    dislikes: [...new Set(a.dislikes ?? [])],
    age: a.age ? Number(a.age) : null,
  };
}

export function indexExercises(exercises: Exercise[]): ExerciseIndex {
  return new Map(exercises.map((e) => [e.id, e]));
}

/** Look up an exercise that must exist (ids in a plan always come from the list). */
export function getEx(byId: ExerciseIndex, id: string): Exercise {
  const ex = byId.get(id);
  if (!ex) throw new Error(`Unknown exercise: ${id}`);
  return ex;
}

const entries = <K extends string, V>(o: Partial<Record<K, V>>) => Object.entries(o) as [K, V][];

// ---------- filters and scoring ----------

export function hasEquipment(ex: Exercise, available: Set<string>): boolean {
  return ex.equipment.every((item) => item.split("|").some((e) => available.has(e)));
}

/** Why an exercise can't be used at all (null = allowed). Order matters for messages. */
export function exclusionReason(ex: Exercise, answers: Answers): string | null {
  if (answers.dislikes.includes(ex.id)) return "on your skip list";
  for (const [joint, stress] of entries(ex.joints)) {
    const sev = answers.injuries[joint];
    if (sev === "injured" && stress >= 1) return `loads your injured ${JOINTS[joint].toLowerCase()}`;
    if (sev === "avoid" && stress >= 2) return `loads your ${JOINTS[joint].toLowerCase()}`;
  }
  for (const m of ex.moves) if (answers.painful.includes(m)) return `involves ${MOVEMENTS[m].toLowerCase()}`;
  if (SKILL_RANK[ex.skill] > SKILL_RANK[answers.experience]) return "needs more experience";
  if (!hasEquipment(ex, new Set(answers.equipment))) return "needs equipment you don't have";
  return null;
}

export function mildPenalty(ex: Exercise, answers: Answers): number {
  let p = 0;
  for (const [joint, stress] of entries(ex.joints)) if (answers.injuries[joint] === "mild") p += stress * 1.5;
  return p;
}

export function mildJointsHit(ex: Exercise, answers: Answers): Joint[] {
  return entries(ex.joints).filter(([j, s]) => answers.injuries[j] === "mild" && s >= 2).map(([j]) => j);
}

const LOADED: Equipment[] = ["barbell", "dumbbell", "machine", "cable", "kettlebell"];

export function scoreExercise(ex: Exercise, pattern: Pattern, answers: Answers, usedCount = 0): number {
  const pat = PATTERNS[pattern];
  const w = ex.muscles[pat.main] ?? 0;
  let s = 10 * w;
  s += (ex.type === "compound") === pat.compound ? 3 : -2;
  if (ex.staple) s += 2;
  if (answers.experience === "beginner") s -= SKILL_RANK[ex.skill];
  if (answers.goal === "strength" && pat.compound && ex.equipment.includes("barbell")) s += 1.5;
  if (ex.pattern !== pattern) s -= 5;
  // Unloaded bodyweight moves are a poor main stimulus once someone has weights.
  const hasLoad = LOADED.some((e) => answers.equipment.includes(e));
  if (ex.equipment.length === 0 && hasLoad && ex.pattern !== "core") s -= answers.experience === "beginner" ? 2 : 6;
  s -= mildPenalty(ex, answers);
  if (answers.experience !== "beginner") s -= usedCount * 4;
  return s;
}

export interface Candidate { ex: Exercise; score: number }

/** Ranked allowed candidates for a slot. */
export function candidatesFor(
  pattern: Pattern,
  exercises: Exercise[],
  answers: Answers,
  { used = new Map<string, number>(), exclude = new Set<string>(), includeRelated = true } = {},
): Candidate[] {
  const pats = includeRelated ? [pattern, ...PATTERNS[pattern].related] : [pattern];
  const list: Candidate[] = [];
  for (const ex of exercises) {
    if (!pats.includes(ex.pattern) || exclude.has(ex.id)) continue;
    if (exclusionReason(ex, answers)) continue;
    list.push({ ex, score: scoreExercise(ex, pattern, answers, used.get(ex.id) ?? 0) });
  }
  list.sort((a, b) => b.score - a.score || a.ex.order - b.ex.order);
  return list;
}

/** Best exercise for the pattern if injuries/movements/dislikes were ignored (for "instead of" reasons). */
function idealFor(pattern: Pattern, exercises: Exercise[], answers: Answers): Exercise | null {
  const relaxed: Answers = { ...answers, injuries: {}, painful: [], dislikes: [] };
  return candidatesFor(pattern, exercises, relaxed, { includeRelated: false })[0]?.ex ?? null;
}

// ---------- volume targets and time ----------

export function muscleTargets(answers: Answers): Targets {
  const base = BASE_WEEKLY_SETS[answers.experience] * (answers.age && answers.age >= 50 ? 0.85 : 1);
  const prioritized = new Set(answers.priorities.flatMap((p) => PRIORITY_GROUPS[p].muscles));
  const out = {} as Targets;
  for (const m of MUSCLE_KEYS) {
    let target = base;
    let floor = 6;
    if (m === "abs" || m === "calves") { target = base * 0.6; floor = 4; }
    if (m === "front_delt") { target = base * 0.4; floor = 0; }
    if (prioritized.has(m)) target *= 1.4;
    out[m] = { target: Math.round(target), floor, priority: prioritized.has(m) };
  }
  return out;
}

export function restFor(ex: Exercise, answers: Answers): number {
  const rx = PRESCRIPTION[answers.goal];
  return ex.type === "compound" ? rx.restC : rx.restI;
}

function exerciseSeconds(ex: Exercise, sets: number, answers: Answers, isFirstCompound: boolean): number {
  if (!sets) return 0;
  const work = ex.type === "compound" ? LIMITS.workSecondsCompound : LIMITS.workSecondsIsolation;
  const rest = restFor(ex, answers);
  let t = sets * work + (sets - 1) * rest + LIMITS.transitionSeconds;
  if (ex.type === "compound") t += isFirstCompound ? LIMITS.firstCompoundWarmupSeconds : 45;
  return t;
}

export function sessionSeconds(day: Pick<PlanDay, "exercises">, byId: ExerciseIndex, answers: Answers): number {
  let t: number = LIMITS.warmupSeconds;
  let firstSeen = false;
  for (const s of day.exercises) {
    if (!s.sets) continue;
    const ex = getEx(byId, s.exId);
    const first = ex.type === "compound" && !firstSeen;
    if (first) firstSeen = true;
    t += exerciseSeconds(ex, s.sets, answers, first);
  }
  return t;
}

export function weeklySets(days: Pick<PlanDay, "exercises">[], byId: ExerciseIndex): Volume {
  const v = Object.fromEntries(MUSCLE_KEYS.map((m) => [m, 0])) as Volume;
  for (const d of days) for (const s of d.exercises) {
    if (!s.sets) continue;
    for (const [m, w] of entries(getEx(byId, s.exId).muscles)) v[m] += w * s.sets;
  }
  return v;
}

function sessionMuscle(day: PlanDay, byId: ExerciseIndex): Partial<Volume> {
  const v: Partial<Volume> = {};
  for (const s of day.exercises) {
    if (!s.sets) continue;
    for (const [m, w] of entries(getEx(byId, s.exId).muscles)) v[m] = (v[m] ?? 0) + w * s.sets;
  }
  return v;
}

// ---------- prescriptions and reasons ----------

function prescribe(day: PlanDay, byId: ExerciseIndex, answers: Answers): void {
  const rx = PRESCRIPTION[answers.goal];
  let firstDone = false;
  for (const s of day.exercises) {
    const ex = getEx(byId, s.exId);
    let reps: [number, number];
    if (ex.type === "compound" && !firstDone && s.sets) { reps = rx.first; firstDone = true; }
    else reps = ex.type === "compound" ? rx.compound : rx.isolation;
    const hit = mildJointsHit(ex, answers);
    s.reps = hit.length ? [reps[0] + 3, reps[1] + 3] : [reps[0], reps[1]];
    s.rest = restFor(ex, answers);
    s.rir = ex.type === "isolation" ? "1–2 reps in reserve; last set may go to failure" : "1–2 reps in reserve";
    s.lighter = hit;
  }
}

function slotReasons(pattern: Pattern, ex: Exercise, exercises: Exercise[], answers: Answers): string[] {
  const reasons: string[] = [];
  const pat = PATTERNS[pattern];
  if (ex.pattern !== pattern) {
    reasons.push(`No ${pat.label.toLowerCase()} exercise fits your equipment or limits, so this uses a ${PATTERNS[ex.pattern].label.toLowerCase()} instead.`);
  } else {
    reasons.push(`${pat.label} slot for ${MUSCLES[pat.main].toLowerCase()}${ex.staple ? "; a well-proven staple" : ""}.`);
  }
  const ideal = idealFor(pattern, exercises, answers);
  if (ideal && ideal.id !== ex.id) {
    const withItsEquipment = [...answers.equipment, ...ideal.equipment.flatMap((i) => i.split("|"))] as Equipment[];
    const why = exclusionReason(ideal, { ...answers, equipment: withItsEquipment });
    if (why) reasons.push(`Instead of ${ideal.name}: it ${why}.`);
  }
  const hit = mildJointsHit(ex, answers);
  if (hit.length) reasons.push(`Lighter load and 3 more reps per set to go easy on your ${hit.map((j) => JOINTS[j].toLowerCase()).join(" and ")}.`);
  return reasons;
}

// ---------- the generator ----------

function newPlanExercise(slot: number, pattern: Pattern, optional: boolean, ex: Exercise, reasons: string[]): PlanExercise {
  return {
    slot, pattern, optional, exId: ex.id,
    sets: optional ? 0 : ex.type === "compound" ? 3 : 2,
    reasons, reps: [0, 0], rest: 0, rir: "", lighter: [],
  };
}

export function generatePlan(rawAnswers: RawAnswers, exercises: Exercise[], { now = new Date() } = {}): Plan {
  const answers = normalizeAnswers(rawAnswers);
  const byId = indexExercises(exercises);
  const split = SPLITS[answers.days]!;
  const targets = muscleTargets(answers);
  const notices: string[] = [];
  const used = new Map<string, number>();

  for (const [joint, sev] of entries(answers.injuries)) {
    if (sev === "injured") notices.push(`Your ${JOINTS[joint].toLowerCase()} is marked as injured, so every exercise that loads it is left out. Get this plan checked by a physio or doctor before training that area.`);
  }

  // Steps 1 + 4 + 5: split, slots, fill each slot.
  const days: PlanDay[] = split.days.map((key) => {
    const tpl = DAY_TEMPLATES[key];
    const day: PlanDay = { key, name: tpl.name, focus: tpl.focus, estMinutes: 0, exercises: [] };
    const inDay = new Set<string>();
    tpl.slots.forEach((slot, slotIdx) => {
      const best = candidatesFor(slot.p, exercises, answers, { used, exclude: inDay })[0];
      if (!best) {
        if (!slot.opt) notices.push(`${tpl.name}: no ${PATTERNS[slot.p].label.toLowerCase()} exercise fits your equipment and limits, so that slot is left out.`);
        return;
      }
      inDay.add(best.ex.id);
      used.set(best.ex.id, (used.get(best.ex.id) ?? 0) + 1);
      day.exercises.push(newPlanExercise(slotIdx, slot.p, slot.opt, best.ex, slotReasons(slot.p, best.ex, exercises, answers)));
    });
    return day;
  });

  // Step 3: fit the base sets into the time budget.
  const budget = answers.minutes * 60;
  for (const day of days) {
    let guard = 50;
    while (sessionSeconds(day, byId, answers) > budget && guard-- > 0) {
      const active = day.exercises.filter((s) => s.sets > 0);
      const shrink = [...active].reverse().find((s) => s.sets > 2);
      if (shrink) { shrink.sets -= 1; continue; }
      if (active.length <= 2) break;
      const dropIso = [...active].reverse().find((s) => getEx(byId, s.exId).type === "isolation");
      const drop = dropIso ?? active[active.length - 1];
      if (drop) drop.sets = 0;
    }
  }

  // Step 2 + 3: greedily add sets where muscles are furthest below target.
  allocate(days, byId, answers, targets, budget);

  // Step 7: checks and targeted repairs.
  repair(days, byId, answers, targets, budget);

  for (const day of days) {
    if (!day.exercises.some((s) => s.sets > 0)) {
      notices.push(`${day.name} days have no exercises that fit your equipment and limits. Adding a pull-up bar, resistance bands or dumbbells would fill them.`);
    }
  }

  const plan: Plan = {
    id: `plan-${now.getTime()}`,
    createdAt: now.toISOString(),
    splitName: split.name,
    answers,
    targets,
    days,
    notices: [...new Set(notices)],
    weekly: weeklySets(days, byId),
    warnings: [],
  };
  // Step 6 (reps, rest, effort) + derived numbers and checks.
  return refreshPlan(plan, exercises);
}

function allocate(days: PlanDay[], byId: ExerciseIndex, answers: Answers, targets: Targets, budget: number): void {
  for (let iter = 0; iter < 300; iter++) {
    const volume = weeklySets(days, byId);
    let best: { s: PlanExercise; add: number; value: number } | null = null;
    for (const day of days) {
      const dayTime = sessionSeconds(day, byId, answers);
      const perSession = sessionMuscle(day, byId);
      for (const s of day.exercises) {
        const ex = getEx(byId, s.exId);
        const max = ex.type === "compound" ? LIMITS.maxSetsCompound : LIMITS.maxSetsIsolation;
        const add = s.sets === 0 ? 2 : 1;
        if (s.sets >= max) continue;
        if (entries(ex.muscles).some(([m, w]) => (perSession[m] ?? 0) + w * add > LIMITS.perSessionMuscleCap)) continue;
        const before = s.sets;
        s.sets += add;
        const newTime = sessionSeconds(day, byId, answers);
        s.sets = before;
        if (newTime > budget) continue;
        let gain = 0;
        for (const [m, w] of entries(ex.muscles)) {
          const deficit = targets[m].target - volume[m];
          if (deficit > 0) gain += Math.min(deficit, w * add) * (targets[m].priority ? 1.5 : 1);
          // Reaching each muscle's minimum matters most.
          const belowFloor = targets[m].floor - volume[m];
          if (belowFloor > 0) gain += 3 * Math.min(belowFloor, w * add);
        }
        if (gain <= 0.01) continue;
        const value = gain / Math.max(1, newTime - dayTime);
        if (!best || value > best.value + 1e-9) best = { s, add, value };
      }
    }
    if (!best) break;
    best.s.sets += best.add;
  }
}

export function groupSets(days: Pick<PlanDay, "exercises">[], set: Set<Pattern>): number {
  let n = 0;
  for (const d of days) for (const s of d.exercises) if (set.has(s.pattern)) n += s.sets;
  return n;
}

type SlotTest = (s: PlanExercise, ex: Exercise) => boolean;

/** Try to add sets (activating optional slots if needed) for exercises matching `want`. */
function tryAdd(days: PlanDay[], byId: ExerciseIndex, answers: Answers, budget: number, want: SlotTest): boolean {
  for (const day of days) {
    for (const s of day.exercises) {
      const ex = getEx(byId, s.exId);
      if (!want(s, ex)) continue;
      const max = ex.type === "compound" ? LIMITS.maxSetsCompound : LIMITS.maxSetsIsolation;
      const add = s.sets === 0 ? 2 : 1;
      if (s.sets + add > max) continue;
      s.sets += add;
      if (sessionSeconds(day, byId, answers) <= budget) return true;
      s.sets -= add;
    }
  }
  return false;
}

function tryRemove(days: PlanDay[], byId: ExerciseIndex, want: SlotTest): boolean {
  for (const day of [...days].reverse()) {
    for (const s of [...day.exercises].reverse()) {
      if (s.sets > 2 && want(s, getEx(byId, s.exId))) { s.sets -= 1; return true; }
    }
  }
  return false;
}

function repair(days: PlanDay[], byId: ExerciseIndex, answers: Answers, targets: Targets, budget: number): void {
  for (let pass = 0; pass < LIMITS.repairPasses; pass++) {
    let changed = false;
    const push = groupSets(days, PUSH);
    const pull = groupSets(days, PULL);
    if (pull < push * 0.9) {
      changed = tryAdd(days, byId, answers, budget, (s) => PULL.has(s.pattern)) || tryRemove(days, byId, (s) => PUSH.has(s.pattern));
    }
    const volume = weeklySets(days, byId);
    for (const m of MUSCLE_KEYS) {
      const t = targets[m];
      if (volume[m] + 1e-9 >= t.floor) continue;
      if (tryAdd(days, byId, answers, budget, (_s, ex) => (ex.muscles[m] ?? 0) >= 1)) { changed = true; continue; }
      // Make room: take sets from exercises whose muscles all stay above their
      // minimum and that don't train this muscle, until the add fits (max 3).
      for (let k = 0; k < 3; k++) {
        const v = weeklySets(days, byId);
        const removed = tryRemove(days, byId, (_s, ex) => !((ex.muscles[m] ?? 0) > 0) &&
          entries(ex.muscles).every(([mm, w]) => v[mm] - w >= targets[mm].floor && v[mm] - w >= targets[mm].target * 0.75));
        if (!removed) break;
        if (tryAdd(days, byId, answers, budget, (_s, ex) => (ex.muscles[m] ?? 0) >= 1)) { changed = true; break; }
      }
    }
    if (!changed) break;
  }
}

/** Recompute derived numbers and checks after any change (generation, swap). Mutates and returns the plan. */
export function refreshPlan(plan: Plan, exercises: Exercise[]): Plan {
  const byId = indexExercises(exercises);
  const answers = plan.answers;
  for (const day of plan.days) {
    prescribe(day, byId, answers);
    day.estMinutes = Math.round(sessionSeconds(day, byId, answers) / 60);
  }
  const volume = weeklySets(plan.days, byId);
  plan.weekly = Object.fromEntries(MUSCLE_KEYS.map((m) => [m, Math.round(volume[m] * 10) / 10])) as Volume;
  plan.warnings = checkPlan(plan);
  return plan;
}

export function checkPlan(plan: Plan): PlanWarning[] {
  const warnings: PlanWarning[] = [];
  const { targets, answers } = plan;
  for (const m of MUSCLE_KEYS) {
    const t = targets[m];
    if (plan.weekly[m] + 1e-9 < t.floor) warnings.push({ kind: "volume", muscle: m, text: `${MUSCLES[m]}: ${plan.weekly[m]} sets a week, below the minimum of ${t.floor}.` });
  }
  const push = groupSets(plan.days, PUSH);
  const pull = groupSets(plan.days, PULL);
  if (push > 0 && pull < push * 0.9) warnings.push({ kind: "balance", text: `Pushing (${push} sets) outweighs pulling (${pull} sets). Aim for at least as much pulling.` });
  const q = plan.weekly.quads;
  const h = plan.weekly.hamstrings;
  if (q > 0 && h < q * 0.5) warnings.push({ kind: "balance", text: `Hamstrings (${h} sets) get less than half the work of quads (${q} sets).` });
  for (const day of plan.days) {
    if (day.estMinutes > answers.minutes * 1.05) warnings.push({ kind: "time", text: `${day.name} takes about ${day.estMinutes} min, over your ${answers.minutes} min.` });
  }
  const short = warnings.filter((w) => w.kind === "volume").length;
  const full = plan.days.filter((d) => d.exercises.some((s) => s.sets)).every((d) => d.estMinutes >= answers.minutes * 0.9);
  if (short >= 3 && full) {
    warnings.unshift({ kind: "time", text: "Every session is already full, which is why several muscles fall short. Longer sessions or one more training day would cover them." });
  }
  return warnings;
}
