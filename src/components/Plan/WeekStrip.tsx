import { WEEKDAYS } from "../../lib/constants.ts";
import { cx } from "../../lib/format.ts";
import type { PlanDay } from "../../lib/types.ts";
import { Plate } from "../common/Plate.tsx";
import styles from "./WeekStrip.module.css";

const ORDER = [1, 2, 3, 4, 5, 6, 0];

/** Monday-to-Sunday overview of training and rest days. */
export function WeekStrip({ days }: { days: PlanDay[] }) {
  const today = new Date().getDay();
  return (
    <div className={styles.week} aria-label="Weekly schedule">
      {ORDER.map((wd) => {
        const d = days.find((x) => x.weekday === wd);
        return (
          <div key={wd} className={cx(styles.day, d && styles.on, wd === today && styles.today)}>
            <span>{WEEKDAYS[wd]}</span>
            <Plate day={d?.key ?? null} />
            <small className={styles.name}>{d ? d.name : "Rest"}</small>
          </div>
        );
      })}
    </div>
  );
}
