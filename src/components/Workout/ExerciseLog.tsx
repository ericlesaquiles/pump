import { EXERCISE_BY_ID } from "../../data/exercises.ts";
import { useI18n } from "../../hooks/useI18n.ts";
import { useRestTimer } from "../../hooks/useRestTimer.tsx";
import { fmtRest, fmtSets } from "../../lib/format.ts";
import { cue, type HistoryPoint } from "../../lib/progression.ts";
import type { LoggedSet, PlanExercise, WorkoutDraft } from "../../lib/types.ts";
import { Button } from "../common/Button.tsx";
import { Chip, type ChipTone } from "../common/Chip.tsx";
import { SetRow } from "./SetRow.tsx";
import styles from "./ExerciseLog.module.css";

const CUE_TONE: Record<string, ChipTone> = { add: "good", hold: "quiet", stall: "warn", first: "quiet" };

interface Props {
  entry: WorkoutDraft["entries"][number];
  slot: PlanExercise;
  date: string;
  unit: WorkoutDraft["unit"];
  /** This exercise's past sessions (excluding the one being edited). */
  history: HistoryPoint[];
  onChange: (sets: LoggedSet[]) => void;
  onInfo: () => void;
  onSwap: () => void;
}

export function ExerciseLog({ entry, slot, date, unit, history, onChange, onInfo, onSwap }: Props) {
  const timer = useRestTimer();
  const { t, exName, date: fmtDate } = useI18n();
  const ex = EXERCISE_BY_ID.get(entry.exId);
  if (!ex) return null;
  const before = history.filter((h) => h.date < date);
  const last = before[before.length - 1];
  const next = cue(history, { sets: slot.sets, reps: slot.reps }, ex.pattern, unit, date);
  const swapped = entry.exId !== entry.plannedExId;

  return (
    <article className={styles.card}>
      <div className={styles.head}>
        <div>
          <Button variant="link" onClick={onInfo}><h3>{exName(ex.id)}</h3></Button>
          <div className={styles.rx}>
            {slot.sets} × {slot.reps[0]}–{slot.reps[1]} · {t.rir[slot.rir] ?? t.rir.compound}
            {swapped && <> · <Chip>{t.workout.insteadOf(exName(entry.plannedExId))}</Chip></>}
          </div>
        </div>
        <div className={styles.tools}>
          <Button variant="ghost" small onClick={() => timer.start(slot.rest)}>{t.workout.rest(fmtRest(slot.rest))}</Button>
          <Button variant="ghost" small onClick={onSwap}>{t.workout.swap}</Button>
        </div>
      </div>
      <div className={styles.meta}>
        <span className={styles.muted}>{last ? t.workout.last(fmtDate(last.date), fmtSets(last.sets, t.locale)) : t.workout.noPrevious}</span>
        <Chip tone={CUE_TONE[next.kind]}>{t.workout.cue(next.kind, next)}</Chip>
      </div>
      <div className={styles.sets}>
        {entry.sets.map((s, i) => (
          <SetRow
            key={i}
            index={i}
            set={s}
            unit={unit}
            previous={last?.sets[i]}
            topReps={slot.reps[1]}
            exerciseName={exName(ex.id)}
            onChange={(updated) => onChange(entry.sets.map((x, k) => (k === i ? updated : x)))}
          />
        ))}
      </div>
      <div>
        <Button variant="link" small onClick={() => onChange([...entry.sets, { w: null, r: null, hurt: false }])}>{t.workout.addSet}</Button>
      </div>
    </article>
  );
}
