import { useEffect, useMemo, useState } from "react";
import { EXERCISES, EXERCISE_BY_ID } from "../../data/exercises.ts";
import { defaultLogSelection, useAppState } from "../../hooks/useAppState.tsx";
import { useToast } from "../../hooks/useToast.tsx";
import { WEEKDAYS } from "../../lib/constants.ts";
import { isoDate } from "../../lib/format.ts";
import { historyFor } from "../../lib/progression.ts";
import { store } from "../../lib/storage.ts";
import { applySwap } from "../../lib/swap.ts";
import type { Plan, WorkoutDraft } from "../../lib/types.ts";
import { buildWorkout, sessionId, workoutToSession } from "../../lib/workout.ts";
import { Button } from "../common/Button.tsx";
import { Callout } from "../common/Callout.tsx";
import { PageHeader } from "../common/PageHeader.tsx";
import { ExerciseInfoDialog } from "../Exercise/ExerciseInfoDialog.tsx";
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
  const sel = logSel && logSel.dayIdx < plan.days.length ? logSel : defaultLogSelection(plan);
  const day = plan.days[sel.dayIdx];

  const [state, setState] = useState(() => loadWorkout(plan, sel.dayIdx, sel.date, sessions, settings.unit));
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hurt, setHurt] = useState<HurtInfo | null>(null);
  const [infoId, setInfoId] = useState<string | null>(null);
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
    if (!session) { setError("Enter reps for at least one set before saving."); return; }
    saveSession(session);
    store.setDraft(workout.id, null);
    const painful = session.entries.filter((e) => e.sets.some((s) => s.hurt));
    setHurt(painful.length ? {
      names: painful.map((e) => EXERCISE_BY_ID.get(e.exId)?.name ?? e.exId),
      slots: painful.map((e) => ({ dayIdx: session.dayIdx, slot: e.slot, exId: plan.days[session.dayIdx]?.exercises[e.slot]?.exId ?? e.exId })),
    } : null);
    setState({ workout: { ...workout, saved: true }, fromDraft: false });
    setDirty(false);
    toast("Workout saved");
    window.scrollTo({ top: 0 });
  };

  if (!day) return null;
  const status = error ?? (dirty || state.fromDraft ? "Unsaved changes are kept on this device as a draft." : workout.saved ? "Saved." : "");

  return (
    <>
      <PageHeader
        eyebrow="Workout"
        title={day.name}
        actions={
          <>
            <label className={styles.field}>
              <span className={styles.label}>Day</span>
              <select value={sel.dayIdx} onChange={(e) => { setLogSel({ ...sel, dayIdx: Number(e.target.value) }); setHurt(null); }}>
                {plan.days.map((d, i) => <option key={i} value={i}>{WEEKDAYS[d.weekday]} · {d.name}</option>)}
              </select>
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Date</span>
              <input type="date" value={sel.date} onChange={(e) => { setLogSel({ ...sel, date: e.target.value || isoDate(new Date()) }); setHurt(null); }} />
            </label>
          </>
        }
      />

      {hurt && <HurtCallout info={hurt} onDismiss={() => setHurt(null)} onSwap={(dayIdx, slot) => setSwap({ entryIdx: -1, mode: "plan", dayIdx, slot })} />}

      {workout.entries.length === 0 && <Callout>This day has no exercises. Pick another day.</Callout>}
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
            onChange={(sets) => edit((w) => ({ ...w, entries: w.entries.map((e, k) => (k === i ? { ...e, sets } : e)) }))}
            onInfo={() => setInfoId(entry.exId)}
            onSwap={() => setSwap({ entryIdx: i, mode: "today", dayIdx: sel.dayIdx, slot: entry.slot })}
          />
        );
      })}

      <label className={styles.notes}>
        <span className={styles.label}>Notes</span>
        <textarea rows={3} value={workout.note} placeholder="Sleep, energy, anything that felt off" onChange={(e) => edit((w) => ({ ...w, note: e.target.value }))} />
      </label>

      <div className={styles.savebar}>
        <Button onClick={save}>{workout.saved ? "Update workout" : "Save workout"}</Button>
        <span className={error ? styles.error : styles.status} role={error ? "alert" : undefined}>{status}</span>
      </div>

      {infoId && <ExerciseInfoDialog exId={infoId} onClose={() => setInfoId(null)} />}
      {swap && (
        <SwapDialog
          plan={plan}
          dayIdx={swap.dayIdx}
          exIdx={swap.slot}
          mode={swap.mode}
          onClose={() => setSwap(null)}
          onPick={(exId, scope) => {
            if (swap.mode === "today") {
              edit((w) => ({ ...w, entries: w.entries.map((e, k) => (k === swap.entryIdx ? { ...e, exId, sets: e.sets.map(() => ({ w: null, r: null, hurt: false })) } : e)) }));
            } else {
              updatePlan(applySwap(plan, swap.dayIdx, swap.slot, exId, EXERCISES, scope));
              setHurt(null);
              toast(`Swapped in ${EXERCISE_BY_ID.get(exId)?.name ?? exId}`);
            }
            setSwap(null);
          }}
        />
      )}
    </>
  );
}
