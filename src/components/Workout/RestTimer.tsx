import { fmtClock, cx } from "../../lib/format.ts";
import styles from "./RestTimer.module.css";

interface Props {
  seconds: number;
  done: boolean;
  onAdd: () => void;
  onStop: () => void;
}

export function RestTimer({ seconds, done, onAdd, onStop }: Props) {
  return (
    <div className={cx(styles.timer, done && styles.done)} role="timer" aria-live={done ? "assertive" : "off"}>
      <span className={styles.label}>{done ? "Rest over" : "Rest"}</span>
      <span className={styles.time}>{fmtClock(seconds)}</span>
      <button type="button" className={styles.btn} onClick={onAdd}>+30 s</button>
      <button type="button" className={styles.btn} onClick={onStop}>Done</button>
    </div>
  );
}
