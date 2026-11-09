// Progression cues (double progression) and per-exercise history.
import { PATTERNS } from "./constants.ts";
import type { Pattern, Session, Unit } from "./types.ts";

export interface HistoryPoint { date: string; sets: { w: number; r: number }[]; unit: Unit }
export type CueKind = "first" | "add" | "hold" | "stall";
export interface Cue { kind: CueKind; text: string }

export function weightStep(pattern: Pattern, unit: Unit): number {
  const lower = PATTERNS[pattern].lower;
  if (unit === "lb") return lower ? 10 : 5;
  return lower ? 5 : 2.5;
}

/** All logged sets for an exercise, oldest first. */
export function historyFor(sessions: Pick<Session, "date" | "unit" | "entries">[], exId: string): HistoryPoint[] {
  const out: HistoryPoint[] = [];
  for (const s of sessions) {
    const e = s.entries.find((x) => x.exId === exId);
    if (e && e.sets.some((x) => x.r > 0)) out.push({ date: s.date, sets: e.sets.filter((x) => x.r > 0), unit: s.unit });
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

const top = (h: HistoryPoint) => Math.max(...h.sets.map((x) => x.w || 0));
const totalReps = (h: HistoryPoint) => h.sets.reduce((a, x) => a + x.r, 0);

/** Cue for the next session of an exercise. */
export function cue(history: HistoryPoint[], prescription: { sets: number; reps: [number, number] }, pattern: Pattern, unit: Unit, beforeDate: string | null = null): Cue {
  const past = beforeDate ? history.filter((h) => h.date < beforeDate) : history;
  const last = past[past.length - 1];
  if (!last) return { kind: "first", text: `No history yet. Start light and find a weight you can lift for ${prescription.reps[1]} reps with 2 to spare.` };
  const hi = prescription.reps[1];
  const full = last.sets.length >= prescription.sets && last.sets.every((x) => x.r >= hi);
  if (full) return { kind: "add", text: `Add ${weightStep(pattern, last.unit ?? unit)} ${last.unit ?? unit}` };
  // Stalled: no increase in top weight or total reps across the last 3 sessions spanning 14+ days.
  const third = past[past.length - 3];
  if (third) {
    const days = (Date.parse(last.date) - Date.parse(third.date)) / 864e5;
    if (days >= 14 && top(last) <= top(third) && totalReps(last) <= totalReps(third)) {
      return { kind: "stall", text: "Stalled for 2+ weeks: consider a lighter week or swapping this exercise" };
    }
  }
  return { kind: "hold", text: "Same weight, beat your reps" };
}

export function topSetSeries(history: HistoryPoint[]): { date: string; w: number }[] {
  return history.map((h) => ({ date: h.date, w: top(h) }));
}
