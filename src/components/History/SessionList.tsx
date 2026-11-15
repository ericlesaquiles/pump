import { useEffect, useState } from "react";
import { useI18n } from "../../hooks/useI18n.ts";
import type { Session } from "../../lib/types.ts";
import { Button } from "../common/Button.tsx";
import { Plate } from "../common/Plate.tsx";
import styles from "./SessionList.module.css";

const volume = (s: Session) => s.entries.reduce((a, e) => a + e.sets.reduce((b, x) => b + x.w * x.r, 0), 0);
const setCount = (s: Session) => s.entries.reduce((a, e) => a + e.sets.length, 0);

interface Props {
  sessions: Session[];
  onOpen: (s: Session) => void;
  onDelete: (s: Session) => void;
}

/** Logged workouts, newest first, with a two-step delete. */
export function SessionList({ sessions, onOpen, onDelete }: Props) {
  const { t, date } = useI18n();
  const [armed, setArmed] = useState<string | null>(null);
  useEffect(() => {
    if (!armed) return;
    const id = window.setTimeout(() => setArmed(null), 3000);
    return () => window.clearTimeout(id);
  }, [armed]);

  if (!sessions.length) {
    return <p className={styles.empty}>{t.history.empty}</p>;
  }
  return (
    <ul className={styles.list}>
      {sessions.map((s) => (
        <li key={s.id} className={styles.item}>
          <Plate day={s.dayKey} />
          <button type="button" className={styles.open} onClick={() => onOpen(s)}>
            <strong>{t.workoutFull(s.dayIdx, s.dayKey)}</strong> · {date(s.date)}
            <span className={styles.meta}>{t.history.meta(setCount(s), Math.round(volume(s)).toLocaleString(t.locale), s.unit)}</span>
          </button>
          {armed === s.id ? (
            <Button variant="danger" small onClick={() => { setArmed(null); onDelete(s); }}>{t.history.confirm}</Button>
          ) : (
            <Button variant="ghost" small onClick={() => setArmed(s.id)}>{t.history.delete}</Button>
          )}
        </li>
      ))}
    </ul>
  );
}
