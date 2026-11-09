// Turning a plan day into an editable workout, and a finished workout into a saved session.
import type { Plan, Session, Unit, WorkoutDraft } from "./types.ts";

export const sessionId = (date: string, dayIdx: number) => `${date}_${dayIdx}`;

/** A fresh workout for a plan day, pre-filled from an existing saved session if there is one. */
export function buildWorkout(plan: Plan, dayIdx: number, date: string, sessions: Session[], unit: Unit): WorkoutDraft {
  const id = sessionId(date, dayIdx);
  const saved = sessions.find((s) => s.id === id);
  const day = plan.days[dayIdx];
  const entries = (day?.exercises ?? [])
    .map((slot, i) => ({ slot, i }))
    .filter(({ slot }) => slot.sets > 0)
    .map(({ slot, i }) => {
      const prev = saved?.entries.find((e) => e.slot === i);
      const n = Math.max(slot.sets, prev?.sets.length ?? 0);
      return {
        slot: i,
        plannedExId: slot.exId,
        exId: prev?.exId ?? slot.exId,
        sets: Array.from({ length: n }, (_, k) => ({ w: prev?.sets[k]?.w ?? null, r: prev?.sets[k]?.r ?? null, hurt: prev?.sets[k]?.hurt ?? false })),
      };
    });
  return { id, planId: plan.id, date, dayIdx, unit: saved?.unit ?? unit, entries, note: saved?.note ?? "", saved: Boolean(saved) };
}

/** Only sets with reps count; exercises with no counted sets are dropped. Returns null if nothing was logged. */
export function workoutToSession(w: WorkoutDraft, plan: Plan): Session | null {
  const day = plan.days[w.dayIdx];
  if (!day) return null;
  const entries = w.entries
    .map((e) => ({
      slot: e.slot,
      plannedExId: e.plannedExId,
      exId: e.exId,
      sets: e.sets.filter((s) => (s.r ?? 0) > 0).map((s) => ({ w: s.w ?? 0, r: s.r ?? 0, hurt: s.hurt })),
    }))
    .filter((e) => e.sets.length > 0);
  if (!entries.length) return null;
  return {
    id: w.id, planId: w.planId, date: w.date, dayIdx: w.dayIdx, dayKey: day.key, dayName: day.name,
    unit: w.unit, entries, note: w.note.trim(), savedAt: new Date().toISOString(),
  };
}
