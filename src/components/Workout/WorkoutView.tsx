import { useEffect, useMemo, useState } from "react";
import { EXERCISES } from "../../data/exercises.ts";
import { defaultLogSelection, useAppState } from "../../hooks/useAppState.tsx";
import { useI18n } from "../../hooks/useI18n.ts";
import { useToast } from "../../hooks/useToast.tsx";
import { isoDate } from "../../lib/format.ts";
import { setKeepAwake } from "../../lib/native.ts";
import { historyFor } from "../../lib/progression.ts";
import { dayLetter, nextDayIdx } from "../../lib/rotation.ts";
import { store } from "../../lib/storage.ts";
import { applySwap } from "../../lib/swap.ts";
import type { Plan, WorkoutDraft } from "../../lib/types.ts";
import { buildWorkout, prefillSets, sessionId, workoutToSession } from "../../lib/workout.ts";
import { AskClaudeButton } from "../common/AskClaudeButton.tsx";
import { Button } from "../common/Button.tsx";
import { Callout } from "../common/Callout.tsx";
import { PageHeader } from "../common/PageHeader.tsx";
import { SwapDialog } from "../Exercise/SwapDialog.tsx";
import { ExerciseLog } from "./ExerciseLog.tsx";
import { HurtCallout, type HurtInfo } from "./HurtCallout.tsx";
import styles from "./WorkoutView.module.css";

function loadWorkout(plan: Plan, dayIdx: number, date: string, sessions: Parameters<typeof buildWorkout>[3], unit: WorkoutDraft["unit"]): { workout: WorkoutDraft; fromDraft: boolean } {
  const draft = store.getDraft(sessionId(date, dayIdx));
  if (draft && draft.planId === plan.id) return { workout: draft, fromDraft: true };
  return { workout: buildWorkout(plan, dayIdx, date, sessions, unit), fromDraft: false };
}

export function WorkoutView({ plan }: { plan: Plan }) {
  const { sessions, settings, logSel, setLogSel, saveSession, updatePlan } = useAppState();
  const toast = useToast();
  const { t, exName } = useI18n();
  const sel = logSel && logSel.dayIdx < plan.days.length ? logSel : defaultLogSelection(plan, sessions);
  const day = plan.days[sel.dayIdx];
  const next = nextDayIdx(plan, sessions);

  const [state, setState] = useState(() => loadWorkout(plan, sel.dayIdx, sel.date, sessions, settings.unit));
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hurt, setHurt] = useState<HurtInfo | null>(null);
  const [swap, setSwap] = useState<{ entryIdx: number; mode: "today" | "plan"; dayIdx: number; slot: number } | null>(null);
  const workout = state.workout;

  // Switching day, date or plan loads that workout.
  const key = `${plan.id}|${sel.dayIdx}|${sel.date}`;
  const [loadedKey, setLoadedKey] = useState(key);
  if (loadedKey !== key) {
    setLoadedKey(key);
    setState(loadWorkout(plan, sel.dayIdx, sel.date, sessions, settings.unit));
    setDirty(false);
    setError(null);
  }

  // Keep the screen on while logging a workout (Android app only).
  useEffect(() => {
    void setKeepAwake(true);
    return () => { void setKeepAwake(false); };
  }, []);

  // Keep unsaved changes as a draft on this device.
  useEffect(() => {
    if (!dirty) return;
    const t = window.setTimeout(() => store.setDraft(workout.id, workout), 300);
    return () => window.clearTimeout(t);
  }, [workout, dirty]);

  const others = useMemo(() => sessions.filter((s) => s.id !== workout.id), [sessions, workout.id]);

  const edit = (fn: (w: WorkoutDraft) => WorkoutDraft) => {
    setState((s) => ({ ...s, workout: fn(s.workout) }));
    setDirty(true);
    setError(null);
  };

  const save = () => {
    const session = workoutToSession(workout, plan);
    if (!session) { setError(t.workout.needReps); return; }
    saveSession(session);
    store.setDraft(workout.id, null);
    const painful = session.entries.filter((e) => e.sets.some((s) => s.hurt));
    setHurt(painful.length ? {
      exIds: painful.map((e) => e.exId),
      slots: painful.map((e) => ({ dayIdx: session.dayIdx, slot: e.slot, exId: plan.days[session.dayIdx]?.exercises[e.slot]?.exId ?? e.exId })),
    } : null);
    setState({ workout: { ...workout, saved: true }, fromDraft: false });
    setDirty(false);
    toast(t.workout.savedToast);
    window.scrollTo({ top: 0 });
  };

  if (!day) return null;
  const status = error ?? (dirty || state.fromDraft ? t.workout.draft : workout.saved ? t.workout.saved : "");

  return (
    <>
      <PageHeader
        eyebrow={t.workout.eyebrow}
        title={t.workoutFull(sel.dayIdx, day.key)}
        actions={
          <>
            <label className={styles.field}>
              <span className={styles.label}>{t.workout.pick}</span>
              <select value={sel.dayIdx} onChange={(e) => { setLogSel({ ...sel, dayIdx: Number(e.target.value) }); setHurt(null); }}>
                {plan.days.map((d, i) => <option key={i} value={i}>{t.workout.option(dayLetter(i), t.days[d.key].name, i === next)}</option>)}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.label}>{t.workout.date}</span>
              <input type="date" value={sel.date} onChange={(e) => { setLogSel({ ...sel, date: e.target.value || isoDate(new Date()) }); setHurt(null); }} />
            </label>
          </>
        }
      />

      {hurt && <HurtCallout info={hurt} onDismiss={() => setHurt(null)} onSwap={(dayIdx, slot) => setSwap({ entryIdx: -1, mode: "plan", dayIdx, slot })} />}

      {workout.entries.length === 0 && <Callout>{t.workout.empty}</Callout>}
      {workout.entries.map((entry, i) => {
        const slot = day.exercises[entry.slot];
        if (!slot) return null;
        return (
          <ExerciseLog
            key={`${entry.slot}-${entry.exId}`}
            entry={entry}
            slot={slot}
            date={workout.date}
            unit={workout.unit}
            history={historyFor(others, entry.exId)}
            onChange={(sets) => edit((w) => ({ ...w, entries: w.entries.map((e, k) => (k === i ? { ...e, sets, untouched: undefined } : e)) }))}
            onState={(state) => edit((w) => ({
              ...w,
              entries: w.entries.map((e, k) => {
                if (k !== i) return e;
                // Done confirms the values shown, pre-filled or not.
                if (state === "done") return { ...e, state, untouched: undefined };
                return state ? { ...e, state } : { ...e, state: undefined };
              }),
            }))}
            onSwap={() => setSwap({ entryIdx: i, mode: "today", dayIdx: sel.dayIdx, slot: entry.slot })}
          />
        );
      })}

      <label className={styles.notes}>
        <span className={styles.label}>{t.workout.notes}</span>
        <textarea rows={3} value={workout.note} placeholder={t.workout.notesHint} onChange={(e) => edit((w) => ({ ...w, note: e.target.value }))} />
      </label>

      <div><AskClaudeButton focus={{ kind: "workout", workout }} label={t.ask.aboutWorkout} /></div>

      <div className={styles.savebar}>
        <Button onClick={save}>{workout.saved ? t.workout.update : t.workout.save}</Button>
        <span className={error ? styles.error : styles.status} role={error ? "alert" : undefined}>{status}</span>
      </div>
      <p className={styles.status}>{t.workout.saveHint}</p>

      {swap && (
        <SwapDialog
          plan={plan}
          dayIdx={swap.dayIdx}
          exIdx={swap.slot}
          mode={swap.mode}
          onClose={() => setSwap(null)}
          onPick={(exId, scope) => {
            if (swap.mode === "today") {
              edit((w) => ({
                ...w,
                entries: w.entries.map((e, k) => {
                  if (k !== swap.entryIdx) return e;
                  const { sets, prefilled } = prefillSets(exId, e.sets.length, w.date, others, w.unit);
                  return { ...e, exId, sets, state: undefined, untouched: prefilled || undefined };
                }),
              }));
            } else {
              updatePlan(applySwap(plan, swap.dayIdx, swap.slot, exId, EXERCISES, scope));
              setHurt(null);
              toast(t.plan.swappedIn(exName(exId)));
            }
            setSwap(null);
          }}
        />
      )}
    </>
  );
}
