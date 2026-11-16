// Turning a plan day into an editable workout, and a finished workout into a saved session.
import { historyFor } from "./progression.ts";
import type { DraftEntry, LoggedSet, Plan, Session, Unit, WorkoutDraft } from "./types.ts";

export const sessionId = (date: string, dayIdx: number) => `${date}_${dayIdx}`;

/**
 * Sets pre-filled with what was logged the last time this exercise was done (before `date`):
 * set k gets last time's set k. Empty when there's no history; weight left empty if last
 * time was in another unit.
 */
export function prefillSets(exId: string, count: number, date: string, sessions: Session[], unit: Unit): { sets: LoggedSet[]; prefilled: boolean } {
  const last = historyFor(sessions.filter((s) => s.date < date), exId).at(-1);
  const sets = Array.from({ length: count }, (_, k) => {
    const p = last?.sets[k];
    return { w: p && last.unit === unit && p.w > 0 ? p.w : null, r: p ? p.r : null, hurt: false };
  });
  return { sets, prefilled: sets.some((s) => s.w !== null || s.r !== null) };
}

/** A workout for a plan day: the saved session if there is one, otherwise last time's values. */
export function buildWorkout(plan: Plan, dayIdx: number, date: string, sessions: Session[], unit: Unit): WorkoutDraft {
  const id = sessionId(date, dayIdx);
  const saved = sessions.find((s) => s.id === id);
  const others = sessions.filter((s) => s.id !== id);
  const wUnit = saved?.unit ?? unit;
  const day = plan.days[dayIdx];
  const entries = (day?.exercises ?? [])
    .map((slot, i) => ({ slot, i }))
    .filter(({ slot }) => slot.sets > 0)
    .map(({ slot, i }): DraftEntry => {
      const prev = saved?.entries.find((e) => e.slot === i);
      const base = { slot: i, plannedExId: slot.exId };
      if (prev) {
        const n = Math.max(slot.sets, prev.sets.length);
        const sets = Array.from({ length: n }, (_, k) => ({ w: prev.sets[k]?.w ?? null, r: prev.sets[k]?.r ?? null, hurt: prev.sets[k]?.hurt ?? false }));
        return { ...base, exId: prev.exId, sets, ...(prev.done ? { state: "done" as const } : {}) };
      }
      const skipped = saved?.skipped?.includes(i);
      const { sets, prefilled } = prefillSets(slot.exId, slot.sets, date, others, wUnit);
      return { ...base, exId: slot.exId, sets, ...(skipped ? { state: "skipped" as const } : {}), ...(prefilled && !skipped ? { untouched: true } : {}) };
    });
  return { id, planId: plan.id, date, dayIdx, unit: wUnit, entries, note: saved?.note ?? "", saved: Boolean(saved) };
}

/**
 * Only sets with reps count. An exercise is saved if it was marked Done or edited;
 * skipped exercises and untouched pre-filled ones are left out. Returns null if nothing was logged.
 */
export function workoutToSession(w: WorkoutDraft, plan: Plan): Session | null {
  const day = plan.days[w.dayIdx];
  if (!day) return null;
  const entries = w.entries
    .filter((e) => e.state !== "skipped" && (e.state === "done" || !e.untouched))
    .map((e) => ({
      slot: e.slot,
      plannedExId: e.plannedExId,
      exId: e.exId,
      sets: e.sets.filter((s) => (s.r ?? 0) > 0).map((s) => ({ w: s.w ?? 0, r: s.r ?? 0, hurt: s.hurt })),
      ...(e.state === "done" ? { done: true } : {}),
    }))
    .filter((e) => e.sets.length > 0);
  if (!entries.length) return null;
  const skipped = w.entries.filter((e) => e.state === "skipped").map((e) => e.slot);
  return {
    id: w.id, planId: w.planId, date: w.date, dayIdx: w.dayIdx, dayKey: day.key,
    unit: w.unit, entries, ...(skipped.length ? { skipped } : {}), note: w.note.trim(), savedAt: new Date().toISOString(),
  };
}
