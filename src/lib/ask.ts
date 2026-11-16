// "Ask Claude": a plain-text summary of the user's training context, shared to the
// Claude app (or any chat app) so a question there takes Pump's data into account.
// Text only, built on demand, in the user's language. Nothing is sent by Pump itself.
import { DICTS } from "../i18n/index.ts";
import { exerciseText } from "../i18n/exercises.ts";
import { fmtDate, fmtRest, fmtSets, isoDate } from "./format.ts";
import { indexExercises } from "./generator.ts";
import { cue, historyFor } from "./progression.ts";
import { addDays } from "./rotation.ts";
import type { Exercise, Joint, Lang, Plan, Session, Severity, WorkoutDraft } from "./types.ts";

export type AskFocus =
  | { kind: "plan" }
  | { kind: "exercise"; exId: string }
  | { kind: "workout"; workout: WorkoutDraft };

/** How many past sessions of an exercise to include. */
const HISTORY_SESSIONS = 6;

export function buildAskText(plan: Plan, sessions: Session[], exercises: Exercise[], lang: Lang, focus: AskFocus, today = new Date()): string {
  const t = DICTS[lang];
  const a = t.ask;
  const byId = indexExercises(exercises);
  const name = (id: string) => {
    const ex = byId.get(id);
    return ex ? exerciseText(ex, lang).name : id;
  };
  const date = (iso: string) => fmtDate(iso, t.locale);
  const list = (items: string[]) => (items.length ? items.join(", ") : a.none);
  const ans = plan.answers;
  const since = isoDate(addDays(today, -28));
  const recent = sessions.filter((s) => s.date >= since).length;

  const lines: string[] = [a.intro, "", `## ${a.me}`];
  lines.push(`- ${a.goal}: ${t.goals[ans.goal]}`);
  lines.push(`- ${a.experience}: ${t.experience[ans.experience]}`);
  lines.push(`- ${a.schedule(ans.days, ans.minutes)}`);
  lines.push(`- ${a.equipment}: ${list(ans.equipment.map((e) => t.equipment[e]))}`);
  lines.push(`- ${a.limits}: ${list((Object.entries(ans.injuries) as [Joint, Severity][]).map(([j, s]) => `${t.joints[j]} (${t.severity[s]})`))}`);
  lines.push(`- ${a.hurts}: ${list(ans.painful.map((m) => t.movements[m]))}`);
  lines.push(`- ${a.priorities}: ${list(ans.priorities.map((p) => t.priorities[p]))}`);
  if (ans.age) lines.push(`- ${a.age}: ${ans.age}`);
  lines.push(`- ${a.recent(recent)}`);

  lines.push("", `## ${a.plan(t.splits[ans.days] ?? "")}`);
  plan.days.forEach((d, i) => {
    const items = d.exercises.filter((s) => s.sets > 0).map((s) => `${name(s.exId)} ${s.sets}×${s.reps[0]}–${s.reps[1]}`);
    lines.push(`- ${t.workoutFull(i, d.key)}: ${items.length ? items.join("; ") : a.none}`);
  });

  if (focus.kind === "exercise") {
    const ex = byId.get(focus.exId);
    lines.push("", `## ${a.exercise(name(focus.exId))}`);
    const where = plan.days.flatMap((d, i) => d.exercises.filter((s) => s.sets > 0 && s.exId === focus.exId).map((s) => ({ i, d, s })));
    for (const { i, d, s } of where) {
      lines.push(`- ${a.inPlan}: ${t.workoutFull(i, d.key)}, ${s.sets}×${s.reps[0]}–${s.reps[1]}, ${t.plan.rest} ${fmtRest(s.rest)}${s.lighter.length ? `, ${t.plan.lighter}` : ""}`);
    }
    if (!where.length) lines.push(`- ${a.notInPlan}`);
    const hist = historyFor(sessions, focus.exId);
    const hurtDates = new Set(sessions.filter((s) => s.entries.some((e) => e.exId === focus.exId && e.sets.some((x) => x.hurt))).map((s) => s.date));
    lines.push(`- ${a.history}:${hist.length ? "" : ` ${a.noHistory}`}`);
    for (const h of hist.slice(-HISTORY_SESSIONS)) {
      lines.push(`  - ${date(h.date)}: ${fmtSets(h.sets, t.locale)} ${h.unit}${hurtDates.has(h.date) ? ` ${a.hurtMark}` : ""}`);
    }
    const slot = where[0]?.s;
    if (ex && slot) {
      const c = cue(hist, { sets: slot.sets, reps: slot.reps }, ex.pattern, hist[hist.length - 1]?.unit ?? "kg");
      lines.push(`- ${a.nextStep}: ${t.workout.cue(c.kind, c)}`);
    }
  }

  if (focus.kind === "workout") {
    const w = focus.workout;
    const day = plan.days[w.dayIdx];
    if (day) {
      lines.push("", `## ${a.workout(t.workoutFull(w.dayIdx, day.key), date(w.date))}`);
      for (const e of w.entries) {
        const slot = day.exercises[e.slot];
        // Pre-filled values nobody confirmed aren't what was done today.
        const done = e.state === "skipped" || e.untouched ? [] : e.sets.filter((s) => (s.r ?? 0) > 0);
        const planned = slot ? ` (${a.planned} ${slot.sets}×${slot.reps[0]}–${slot.reps[1]})` : "";
        const swapped = e.exId !== e.plannedExId ? ` ${a.insteadOf(name(e.plannedExId))}` : "";
        const sets = e.state === "skipped" ? a.skipped : done.length ? `${fmtSets(done, t.locale)} ${w.unit}` : a.notLogged;
        const hurt = done.some((s) => s.hurt) ? ` ${a.hurtMark}` : "";
        lines.push(`- ${name(e.exId)}${swapped}${planned}: ${sets}${hurt}`);
      }
      if (w.note.trim()) lines.push(`- ${a.notes}: ${w.note.trim()}`);
    }
  }

  lines.push("", `## ${a.question}`, "");
  return lines.join("\n");
}
