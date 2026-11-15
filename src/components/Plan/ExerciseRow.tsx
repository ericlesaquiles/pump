import { useI18n } from "../../hooks/useI18n.ts";
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
  const { t, exName, text } = useI18n();
  const reasons = item.reasons.map(text);
  return (
    <li className={styles.row}>
      <div>
        <Button variant="link" className={styles.name} onClick={() => onInfo(item.exId)}>{exName(item.exId)}</Button>
        <div className={styles.rx}>
          {item.sets} × {item.reps[0]}–{item.reps[1]} · {t.plan.rest} {fmtRest(item.rest)}
          {item.lighter.length > 0 && <> · <Chip tone="warn">{t.plan.lighter}</Chip></>}
        </div>
      </div>
      <Button variant="ghost" small onClick={onSwap}>{t.plan.swap}</Button>
      <details className={styles.why}>
        <summary>{t.plan.why}</summary>
        <ul>
          {reasons.map((r) => <li key={r}>{r}</li>)}
          <li>{t.rir[item.rir] ?? t.rir.compound}.</li>
        </ul>
      </details>
    </li>
  );
}
