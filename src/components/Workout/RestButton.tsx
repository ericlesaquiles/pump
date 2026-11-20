import { useI18n } from "../../hooks/useI18n.ts";
import { useRestTimer, useRestTimerState } from "../../hooks/useRestTimer.tsx";
import { cx, fmtClock, fmtRest } from "../../lib/format.ts";
import styles from "./RestButton.module.css";

/**
 * The rest timer for one exercise: tap to count down its rest time, tap again to stop.
 * While running it shows the time left and a progress bar; it turns green at zero.
 */
export function RestButton({ seconds, timerKey }: { seconds: number; timerKey: string }) {
  const { t } = useI18n();
  const timer = useRestTimer();
  const state = useRestTimerState();
  const mine = state.key === timerKey && (state.running || state.done);
  const progress = mine && state.total > 0 ? 1 - state.left / state.total : 0;

  return (
    <button
      type="button"
      className={cx(styles.btn, mine && styles.running, mine && state.done && styles.done)}
      onClick={() => (mine ? timer.stop() : timer.start(seconds, timerKey))}
      aria-label={mine ? (state.done ? t.workout.restOver : t.workout.stopRest(fmtClock(state.left))) : t.workout.startRest(fmtRest(seconds))}
    >
      <span className={styles.icon} aria-hidden="true">{mine ? (state.done ? "✓" : "■") : "▶"}</span>
      <span className={styles.text}>
        {mine ? (state.done ? t.workout.restOver : fmtClock(state.left)) : t.workout.rest(fmtRest(seconds))}
      </span>
      {mine && <span className={styles.bar} aria-hidden="true"><span className={styles.fill} data-p={Math.round(progress * 20)} /></span>}
    </button>
  );
}
