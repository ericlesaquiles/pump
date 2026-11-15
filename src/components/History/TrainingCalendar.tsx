import { useState } from "react";
import { cx, isoDate, parseIsoDate } from "../../lib/format.ts";
import { dayLetter, monthGrid, sessionsByDate, weekDates } from "../../lib/rotation.ts";
import type { Session } from "../../lib/types.ts";
import { Button } from "../common/Button.tsx";
import { Panel } from "../common/Panel.tsx";
import { Plate } from "../common/Plate.tsx";
import styles from "./TrainingCalendar.module.css";

interface Props {
  sessions: Session[];
  onOpen: (s: Session) => void;
}

/** Month view of the days you trained. Tap a marked day to open that workout. */
export function TrainingCalendar({ sessions, onOpen }: Props) {
  const now = new Date();
  const [month, setMonth] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const today = isoDate(now);
  const byDate = sessionsByDate(sessions);
  const weeks = monthGrid(month.y, month.m);
  const inMonth = weeks.flat().reduce((n, d) => n + (d ? byDate.get(d)?.length ?? 0 : 0), 0);
  const title = new Date(month.y, month.m, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const heads = weekDates(now).map((d) => parseIsoDate(d).toLocaleDateString(undefined, { weekday: "narrow" }));
  const shift = (k: number) => setMonth(({ y, m }) => ({ y: m + k < 0 ? y - 1 : m + k > 11 ? y + 1 : y, m: (m + k + 12) % 12 }));
  const isCurrent = month.y === now.getFullYear() && month.m === now.getMonth();

  return (
    <Panel label="Training days">
      <div className={styles.nav}>
        <Button variant="ghost" small onClick={() => shift(-1)} aria-label="Previous month">‹</Button>
        <div className={styles.title}>
          <strong>{title}</strong>
          <span className={styles.muted}>{inMonth} workout{inMonth === 1 ? "" : "s"}</span>
        </div>
        <Button variant="ghost" small onClick={() => shift(1)} disabled={isCurrent} aria-label="Next month">›</Button>
      </div>
      <table className={styles.cal}>
        <thead>
          <tr>{heads.map((h, i) => <th key={i} scope="col">{h}</th>)}</tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi}>
              {week.map((d, i) => {
                if (!d) return <td key={i} />;
                const list = byDate.get(d) ?? [];
                const s = list[list.length - 1];
                const label = parseIsoDate(d).getDate();
                return (
                  <td key={i}>
                    {s ? (
                      <button
                        type="button"
                        className={cx(styles.cell, styles.on, d === today && styles.today)}
                        onClick={() => onOpen(s)}
                        aria-label={`${parseIsoDate(d).toLocaleDateString()}: workout ${list.map((x) => dayLetter(x.dayIdx)).join(", ")}`}
                      >
                        <span>{label}</span>
                        <span className={styles.mark}><Plate day={s.dayKey} />{list.map((x) => dayLetter(x.dayIdx)).join("+")}</span>
                      </button>
                    ) : (
                      <span className={cx(styles.cell, d === today && styles.today, d > today && styles.future)}>{label}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}
