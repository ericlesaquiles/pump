import { useState } from "react";
import { useI18n } from "../../hooks/useI18n.ts";
import { cx } from "../../lib/format.ts";
import { dayLetter } from "../../lib/rotation.ts";
import type { PlanDay } from "../../lib/types.ts";
import { Button } from "../common/Button.tsx";
import { Chip } from "../common/Chip.tsx";
import { Plate } from "../common/Plate.tsx";
import { ExerciseRow } from "./ExerciseRow.tsx";
import styles from "./DayCard.module.css";

interface Props {
  day: PlanDay;
  dayIdx: number;
  /** This is the next workout in the rotation. */
  isNext: boolean;
  onStart: () => void;
  onInfo: (exId: string) => void;
  onSwap: (exIdx: number) => void;
}

export function DayCard({ day, dayIdx, isNext, onStart, onInfo, onSwap }: Props) {
  const { t } = useI18n();
  const headingId = `day-${dayIdx}`;
  const listId = `day-${dayIdx}-list`;
  // Exercise lists start collapsed so the plan fits on a phone screen.
  const [open, setOpen] = useState(false);
  const active = day.exercises.map((item, exIdx) => ({ item, exIdx })).filter(({ item }) => item.sets > 0);
  return (
    <section className={styles.card} aria-labelledby={headingId}>
      <div className={styles.head}>
        <div className={styles.title}>
          <Plate day={day.key} />
          <div>
            <h2 id={headingId}>{t.workoutFull(dayIdx, day.key)}</h2>
            <div className={styles.meta}>
              {t.plan.about(t.days[day.key].focus, day.estMinutes)}
              {isNext && <> · <Chip tone="good">{t.plan.next}</Chip></>}
            </div>
          </div>
        </div>
        <Button small onClick={onStart}>{t.plan.startWorkout(dayLetter(dayIdx))}</Button>
      </div>
      {active.length > 0 && (
        <button type="button" className={styles.toggle} onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls={listId}>
          <span className={cx(styles.chevron, open && styles.open)} aria-hidden="true">▸</span>
          {open ? t.plan.hideExercises : t.plan.showExercises(active.length)}
        </button>
      )}
      {active.length ? (
        open && <ul id={listId} className={styles.list}>
          {active.map(({ item, exIdx }) => (
            <ExerciseRow key={`${exIdx}-${item.exId}`} item={item} onInfo={onInfo} onSwap={() => onSwap(exIdx)} />
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>{t.plan.emptyDay}</p>
      )}
    </section>
  );
}
