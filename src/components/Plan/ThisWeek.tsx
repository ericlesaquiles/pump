import { cx, isoDate, parseIsoDate } from "../../lib/format.ts";
import { dayLetter, nextDayIdx, sessionsByDate, weekDates } from "../../lib/rotation.ts";
import type { Plan, Session } from "../../lib/types.ts";
import { Button } from "../common/Button.tsx";
import { Plate } from "../common/Plate.tsx";
import styles from "./ThisWeek.module.css";

interface Props {
  plan: Plan;
  sessions: Session[];
  onStart: (dayIdx: number) => void;
}

/** This week's training days (any weekday) and the next workout in the rotation. */
export function ThisWeek({ plan, sessions, onStart }: Props) {
  const today = isoDate(new Date());
  const dates = weekDates(new Date());
  const byDate = sessionsByDate(sessions);
  const done = dates.reduce((n, d) => n + (byDate.get(d)?.length ?? 0), 0);
  const goal = plan.answers.days;
  const next = nextDayIdx(plan, sessions);
  const nextDay = plan.days[next];

  return (
    <section className={styles.box} aria-label="This week">
      <div className={styles.top}>
        <span className={styles.label}>This week</span>
        <span className={cx(styles.count, done >= goal && styles.met)}>{done} of {goal} workouts</span>
      </div>
      <ol className={styles.week}>
        {dates.map((d) => {
          const list = byDate.get(d) ?? [];
          const date = parseIsoDate(d);
          const s = list[list.length - 1];
          return (
            <li key={d} className={cx(styles.day, list.length > 0 && styles.on, d === today && styles.today)}>
              <span>{date.toLocaleDateString(undefined, { weekday: "short" })}</span>
              <span className={styles.num}>{date.getDate()}</span>
              {s ? (
                <span className={styles.done}>
                  <Plate day={s.dayKey} />
                  <span>{list.map((x) => dayLetter(x.dayIdx)).join("+")}</span>
                </span>
              ) : (
                <span className={styles.rest} aria-hidden="true">·</span>
              )}
            </li>
          );
        })}
      </ol>
      {nextDay && (
        <div className={styles.next}>
          <span>
            <span className={styles.label}>Up next</span>{" "}
            <strong>Workout {dayLetter(next)} · {nextDay.name}</strong>
          </span>
          <Button small onClick={() => onStart(next)}>Start workout {dayLetter(next)}</Button>
        </div>
      )}
    </section>
  );
}
