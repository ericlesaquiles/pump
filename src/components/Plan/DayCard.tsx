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
  const headingId = `day-${dayIdx}`;
  const active = day.exercises.map((item, exIdx) => ({ item, exIdx })).filter(({ item }) => item.sets > 0);
  return (
    <section className={styles.card} aria-labelledby={headingId}>
      <div className={styles.head}>
        <div className={styles.title}>
          <Plate day={day.key} />
          <div>
            <h2 id={headingId}>Workout {dayLetter(dayIdx)} · {day.name}</h2>
            <div className={styles.meta}>{day.focus} · about {day.estMinutes} min{isNext && <> · <Chip tone="good">next</Chip></>}</div>
          </div>
        </div>
        <Button small onClick={onStart}>Start workout</Button>
      </div>
      {active.length ? (
        <ul className={styles.list}>
          {active.map(({ item, exIdx }) => (
            <ExerciseRow key={`${exIdx}-${item.exId}`} item={item} onInfo={onInfo} onSwap={() => onSwap(exIdx)} />
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>No exercises fit your equipment and limits for this day.</p>
      )}
    </section>
  );
}
