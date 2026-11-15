// Workouts rotate in order (A, B, C…) instead of being tied to weekdays.
// The next workout is the one after the last you logged, on whatever day you train.
import { isoDate, parseIsoDate } from "./format.ts";
import type { Plan, Session } from "./types.ts";

/** "A" for the first workout of the plan, "B" for the second… */
export const dayLetter = (dayIdx: number): string => String.fromCharCode(65 + dayIdx);

const newestFirst = (a: Session, b: Session) =>
  a.date !== b.date ? (a.date < b.date ? 1 : -1) : a.savedAt < b.savedAt ? 1 : a.savedAt > b.savedAt ? -1 : 0;

/** The most recent workout logged under this plan, if any. */
export function lastSession(plan: Plan, sessions: Session[]): Session | null {
  return sessions.filter((s) => s.planId === plan.id && s.dayIdx < plan.days.length).sort(newestFirst)[0] ?? null;
}

/** Index of the workout that comes next in the rotation, skipping workouts with no exercises. */
export function nextDayIdx(plan: Plan, sessions: Session[]): number {
  const n = plan.days.length;
  const last = lastSession(plan, sessions);
  const start = last ? (last.dayIdx + 1) % n : 0;
  for (let k = 0; k < n; k++) {
    const i = (start + k) % n;
    if (plan.days[i]?.exercises.some((s) => s.sets > 0)) return i;
  }
  return start;
}

/** Monday of the week that contains `d` (local time). */
export function weekStart(d: Date): Date {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  out.setDate(out.getDate() - ((out.getDay() + 6) % 7));
  return out;
}

export function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

/** The 7 dates (YYYY-MM-DD) of the Monday-to-Sunday week containing `d`. */
export function weekDates(d: Date): string[] {
  const start = weekStart(d);
  return Array.from({ length: 7 }, (_, i) => isoDate(addDays(start, i)));
}

/** Workouts grouped by date, each day's list oldest first. */
export function sessionsByDate(sessions: Session[]): Map<string, Session[]> {
  const map = new Map<string, Session[]>();
  for (const s of [...sessions].sort((a, b) => -newestFirst(a, b))) {
    const list = map.get(s.date);
    if (list) list.push(s);
    else map.set(s.date, [s]);
  }
  return map;
}

/** Number of workouts logged in the Monday-to-Sunday week containing `d`. */
export function workoutsInWeek(sessions: Session[], d: Date): number {
  const dates = new Set(weekDates(d));
  return sessions.filter((s) => dates.has(s.date)).length;
}

/**
 * Calendar grid for a month: whole Monday-to-Sunday weeks covering it.
 * Dates outside the month are null.
 */
export function monthGrid(year: number, month: number): (string | null)[][] {
  const first = new Date(year, month, 1);
  const weeks: (string | null)[][] = [];
  for (let start = weekStart(first); start.getMonth() === month || start < first; start = addDays(start, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, i) => {
      const day = addDays(start, i);
      return day.getMonth() === month ? isoDate(day) : null;
    }));
  }
  return weeks;
}

/** Days since the given date (0 = today). */
export function daysAgo(date: string, today = new Date()): number {
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((t.getTime() - parseIsoDate(date).getTime()) / 864e5);
}
