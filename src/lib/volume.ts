// Sets actually logged, counted per muscle the same way as the plan's weekly sets
// (main muscle 1 set, secondary muscles their weight, usually ½).
import { MUSCLE_KEYS } from "./constants.ts";
import { weekDates } from "./rotation.ts";
import type { Exercise, Muscle, Session } from "./types.ts";

export function loggedSets(sessions: Pick<Session, "entries">[], exercises: Exercise[]): Record<Muscle, number> {
  const byId = new Map(exercises.map((e) => [e.id, e]));
  const out = Object.fromEntries(MUSCLE_KEYS.map((m) => [m, 0])) as Record<Muscle, number>;
  for (const s of sessions) {
    for (const e of s.entries) {
      const ex = byId.get(e.exId);
      const n = e.sets.filter((x) => x.r > 0).length;
      if (!ex || !n) continue;
      for (const [m, w] of Object.entries(ex.muscles) as [Muscle, number][]) out[m] += w * n;
    }
  }
  for (const m of MUSCLE_KEYS) out[m] = Math.round(out[m] * 10) / 10;
  return out;
}

/** Sets logged in the Monday-to-Sunday week containing `today`, per muscle. */
export function setsThisWeek(sessions: Session[], exercises: Exercise[], today = new Date()): Record<Muscle, number> {
  const dates = new Set(weekDates(today));
  return loggedSets(sessions.filter((s) => dates.has(s.date)), exercises);
}
