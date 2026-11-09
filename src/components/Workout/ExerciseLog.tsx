import { EXERCISE_BY_ID } from "../../data/exercises.ts";
import { useRestTimer } from "../../hooks/useRestTimer.tsx";
import { fmtDate, fmtRest, fmtSets } from "../../lib/format.ts";
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
          <Button variant="link" onClick={onInfo}><h3>{ex.name}</h3></Button>
          <div className={styles.rx}>
            {slot.sets} × {slot.reps[0]}–{slot.reps[1]} · {slot.rir}
            {swapped && <> · <Chip>today instead of {EXERCISE_BY_ID.get(entry.plannedExId)?.name}</Chip></>}
          </div>
        </div>
        <div className={styles.tools}>
          <Button variant="ghost" small onClick={() => timer.start(slot.rest)}>Rest {fmtRest(slot.rest)}</Button>
          <Button variant="ghost" small onClick={onSwap}>Swap</Button>
        </div>
      </div>
      <div className={styles.meta}>
        <span className={styles.muted}>{last ? `Last (${fmtDate(last.date)}): ${fmtSets(last.sets)}` : "No previous sets"}</span>
        <Chip tone={CUE_TONE[next.kind]}>{next.text}</Chip>
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
            exerciseName={ex.name}
            onChange={(updated) => onChange(entry.sets.map((x, k) => (k === i ? updated : x)))}
          />
        ))}
      </div>
      <div>
        <Button variant="link" small onClick={() => onChange([...entry.sets, { w: null, r: null, hurt: false }])}>+ Add a set</Button>
      </div>
    </article>
  );
}
