import { useI18n } from "../../hooks/useI18n.ts";
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
  const { t } = useI18n();
  const today = isoDate(new Date());
  const dates = weekDates(new Date());
  const byDate = sessionsByDate(sessions);
  const done = dates.reduce((n, d) => n + (byDate.get(d)?.length ?? 0), 0);
  const goal = plan.answers.days;
  const next = nextDayIdx(plan, sessions);
  const nextDay = plan.days[next];

  return (
    <section className={styles.box} aria-label={t.plan.thisWeek}>
      <div className={styles.top}>
        <span className={styles.label}>{t.plan.thisWeek}</span>
        <span className={cx(styles.count, done >= goal && styles.met)}>{t.plan.weekCount(done, goal)}</span>
      </div>
      <ol className={styles.week}>
        {dates.map((d) => {
          const list = byDate.get(d) ?? [];
          const date = parseIsoDate(d);
          const s = list[list.length - 1];
          return (
            <li key={d} className={cx(styles.day, list.length > 0 && styles.on, d === today && styles.today)}>
              <span>{date.toLocaleDateString(t.locale, { weekday: "short" }).replace(".", "")}</span>
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
            <span className={styles.label}>{t.plan.upNext}</span>{" "}
            <strong>{t.workoutFull(next, nextDay.key)}</strong>
          </span>
          <Button small onClick={() => onStart(next)}>{t.plan.startWorkout(dayLetter(next))}</Button>
        </div>
      )}
    </section>
  );
}
