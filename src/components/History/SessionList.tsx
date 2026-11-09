import { useEffect, useState } from "react";
import { fmtDate } from "../../lib/format.ts";
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
  const [armed, setArmed] = useState<string | null>(null);
  useEffect(() => {
    if (!armed) return;
    const t = window.setTimeout(() => setArmed(null), 3000);
    return () => window.clearTimeout(t);
  }, [armed]);

  if (!sessions.length) {
    return <p className={styles.empty}>No workouts yet. Open the Workout tab, fill in your sets and press Save; they'll show up here.</p>;
  }
  return (
    <ul className={styles.list}>
      {sessions.map((s) => (
        <li key={s.id} className={styles.item}>
          <Plate day={s.dayKey} />
          <button type="button" className={styles.open} onClick={() => onOpen(s)}>
            <strong>{s.dayName}</strong> · {fmtDate(s.date)}
            <span className={styles.meta}>{setCount(s)} sets · {Math.round(volume(s)).toLocaleString()} {s.unit} lifted</span>
          </button>
          {armed === s.id ? (
            <Button variant="danger" small onClick={() => { setArmed(null); onDelete(s); }}>Confirm delete</Button>
          ) : (
            <Button variant="ghost" small onClick={() => setArmed(s.id)}>Delete</Button>
          )}
        </li>
      ))}
    </ul>
  );
}
