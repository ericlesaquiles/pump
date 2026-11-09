import { EXERCISE_BY_ID } from "../../data/exercises.ts";
import { fmtRest } from "../../lib/format.ts";
import type { PlanExercise } from "../../lib/types.ts";
import { Button } from "../common/Button.tsx";
import { Chip } from "../common/Chip.tsx";
import styles from "./ExerciseRow.module.css";

interface Props {
  item: PlanExercise;
  onInfo: (exId: string) => void;
  onSwap: () => void;
}

export function ExerciseRow({ item, onInfo, onSwap }: Props) {
  const ex = EXERCISE_BY_ID.get(item.exId);
  if (!ex) return null;
  return (
    <li className={styles.row}>
      <div>
        <Button variant="link" className={styles.name} onClick={() => onInfo(ex.id)}>{ex.name}</Button>
        <div className={styles.rx}>
          {item.sets} × {item.reps[0]}–{item.reps[1]} · rest {fmtRest(item.rest)}
          {item.lighter.length > 0 && <> · <Chip tone="warn">lighter load</Chip></>}
        </div>
      </div>
      <Button variant="ghost" small onClick={onSwap}>Swap</Button>
      <details className={styles.why}>
        <summary>Why this exercise?</summary>
        <ul>
          {item.reasons.map((r) => <li key={r}>{r}</li>)}
          <li>{item.rir}.</li>
        </ul>
      </details>
    </li>
  );
}
