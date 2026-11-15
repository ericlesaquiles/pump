import { useI18n } from "../../hooks/useI18n.ts";
import { cx } from "../../lib/format.ts";
import type { LoggedSet, Unit } from "../../lib/types.ts";
import styles from "./SetRow.module.css";

interface Props {
  index: number;
  set: LoggedSet;
  unit: Unit;
  /** Last session's values, shown as placeholders. */
  previous?: { w: number; r: number };
  topReps: number;
  exerciseName: string;
  onChange: (set: LoggedSet) => void;
}

const toNum = (v: string) => (v === "" || !Number.isFinite(Number(v)) ? null : Number(v));

export function SetRow({ index, set, unit, previous, topReps, exerciseName, onChange }: Props) {
  const { t } = useI18n();
  const n = index + 1;
  return (
    <div className={styles.row}>
      <span className={styles.n}>{n}</span>
      <label className={styles.inp}>
        <input
          type="number"
          inputMode="decimal"
          step="0.5"
          min="0"
          value={set.w ?? ""}
          placeholder={previous?.w ? String(previous.w) : ""}
          aria-label={t.workout.setWeight(exerciseName, n)}
          onChange={(e) => onChange({ ...set, w: toNum(e.target.value) })}
        />
        <span>{unit}</span>
      </label>
      <label className={styles.inp}>
        <input
          type="number"
          inputMode="numeric"
          step="1"
          min="0"
          className={cx((set.r ?? 0) >= topReps && styles.hit)}
          value={set.r ?? ""}
          placeholder={previous?.r ? String(previous.r) : ""}
          aria-label={t.workout.setReps(exerciseName, n)}
          onChange={(e) => onChange({ ...set, r: toNum(e.target.value) })}
        />
        <span>{t.workout.reps}</span>
      </label>
      <label className={styles.hurt}>
        <input type="checkbox" checked={set.hurt} onChange={(e) => onChange({ ...set, hurt: e.target.checked })} />
        {t.workout.hurt}
      </label>
    </div>
  );
}
