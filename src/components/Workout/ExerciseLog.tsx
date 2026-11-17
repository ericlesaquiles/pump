import { useId, useState } from "react";
import { EXERCISE_BY_ID } from "../../data/exercises.ts";
import { useI18n } from "../../hooks/useI18n.ts";
import { useRestTimer } from "../../hooks/useRestTimer.tsx";
import { cx, fmtRest, fmtSets } from "../../lib/format.ts";
import { cue, type HistoryPoint } from "../../lib/progression.ts";
import type { DraftEntry, EntryState, LoggedSet, PlanExercise, WorkoutDraft } from "../../lib/types.ts";
import { Button } from "../common/Button.tsx";
import { Chip, type ChipTone } from "../common/Chip.tsx";
import { ExerciseDetails } from "../Exercise/ExerciseDetails.tsx";
import { SetRow } from "./SetRow.tsx";
import styles from "./ExerciseLog.module.css";

const CUE_TONE: Record<string, ChipTone> = { add: "good", hold: "quiet", stall: "warn", first: "quiet" };

interface Props {
  entry: DraftEntry;
  slot: PlanExercise;
  date: string;
  unit: WorkoutDraft["unit"];
  /** This exercise's past sessions (excluding the one being edited). */
  history: HistoryPoint[];
  onChange: (sets: LoggedSet[]) => void;
  /** Done or skipped closes the card; null reopens it. */
  onState: (state: EntryState | null) => void;
  onSwap: () => void;
}

export function ExerciseLog({ entry, slot, date, unit, history, onChange, onState, onSwap }: Props) {
  const timer = useRestTimer();
  const [details, setDetails] = useState(false);
  const detailsId = useId();
  const { t, exName, date: fmtDate } = useI18n();
  const ex = EXERCISE_BY_ID.get(entry.exId);
  if (!ex) return null;
  const name = exName(ex.id);

  if (entry.state) {
    const done = entry.state === "done";
    const logged = entry.sets.filter((s) => (s.r ?? 0) > 0);
    return (
      <article className={cx(styles.card, styles.closed, done ? styles.doneCard : styles.skippedCard)}>
        <button type="button" className={styles.reopen} onClick={() => onState(null)} aria-label={t.workout.reopen(name)}>
          <span className={done ? styles.doneName : styles.skippedName}>{done ? "✓" : "»"} {name}</span>
          <span className={styles.closedMeta}>
            {done ? (logged.length ? `${fmtSets(logged, t.locale)} ${unit}` : t.workout.doneLabel) : t.workout.skippedLabel}
          </span>
        </button>
      </article>
    );
  }

  const before = history.filter((h) => h.date < date);
  const last = before[before.length - 1];
  const next = cue(history, { sets: slot.sets, reps: slot.reps }, ex.pattern, unit, date);
  const swapped = entry.exId !== entry.plannedExId;

  return (
    <article className={styles.card}>
      <div className={styles.head}>
        <div>
          <Button variant="link" onClick={() => setDetails((d) => !d)} aria-expanded={details} aria-controls={detailsId}><h3>{name}</h3></Button>
          <div className={styles.rx}>
            {slot.sets} × {slot.reps[0]}–{slot.reps[1]} · {t.rir[slot.rir] ?? t.rir.compound}
            {swapped && <> · <Chip>{t.workout.insteadOf(exName(entry.plannedExId))}</Chip></>}
          </div>
        </div>
        <div className={styles.tools}>
          <Button variant="ghost" small onClick={() => timer.start(slot.rest)}>{t.workout.rest(fmtRest(slot.rest))}</Button>
          <Button variant="ghost" small onClick={onSwap}>{t.workout.swap}</Button>
          <Button variant="ghost" small onClick={() => setDetails((d) => !d)} aria-expanded={details} aria-controls={detailsId}>
            {t.workout.details} <span className={cx(styles.chevron, details && styles.open)} aria-hidden="true">▾</span>
          </Button>
        </div>
      </div>
      {details && (
        <div id={detailsId} className={styles.details}>
          <ExerciseDetails exId={entry.exId} showSummary />
        </div>
      )}
      <div className={styles.meta}>
        <span className={styles.muted}>{last ? t.workout.last(fmtDate(last.date), fmtSets(last.sets, t.locale)) : t.workout.noPrevious}</span>
        <Chip tone={CUE_TONE[next.kind]}>{t.workout.cue(next.kind, next)}</Chip>
      </div>
      {entry.untouched && <p className={styles.prefilled}>{t.workout.prefilled}</p>}
      <div className={styles.sets}>
        {entry.sets.map((s, i) => (
          <SetRow
            key={i}
            index={i}
            set={s}
            unit={unit}
            previous={last?.sets[i]}
            topReps={slot.reps[1]}
            exerciseName={name}
            onChange={(updated) => onChange(entry.sets.map((x, k) => (k === i ? updated : x)))}
          />
        ))}
      </div>
      <div className={styles.foot}>
        <Button variant="link" small onClick={() => onChange([...entry.sets, { w: null, r: null, hurt: false }])}>{t.workout.addSet}</Button>
        <div className={styles.tools}>
          <Button variant="ghost" small className={styles.skipBtn} onClick={() => onState("skipped")}>{t.workout.skip}</Button>
          <Button variant="ghost" small className={styles.doneBtn} onClick={() => onState("done")}>{t.workout.done}</Button>
        </div>
      </div>
    </article>
  );
}
