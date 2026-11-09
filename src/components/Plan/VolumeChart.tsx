import { MUSCLES, MUSCLE_KEYS } from "../../lib/constants.ts";
import { fmtNum } from "../../lib/format.ts";
import type { Plan } from "../../lib/types.ts";
import styles from "./VolumeChart.module.css";

const W = 320, ROW = 26, LABEL_W = 100, VALUE_W = 52, BAR_H = 10, TOP = 4;

/** Weekly sets per muscle against target (tick) and minimum (faint tick), drawn to scale. */
export function VolumeChart({ plan }: { plan: Plan }) {
  const scaleMax = Math.max(...MUSCLE_KEYS.map((m) => Math.max(plan.weekly[m], plan.targets[m].target * 1.3)));
  const barW = W - LABEL_W - VALUE_W;
  const X = (v: number) => LABEL_W + (v / scaleMax) * barW;
  const H = TOP * 2 + MUSCLE_KEYS.length * ROW;

  return (
    <div className={styles.wrap}>
      <svg className={styles.chart} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Weekly sets per muscle compared with targets">
        {MUSCLE_KEYS.map((m, i) => {
          const v = plan.weekly[m];
          const t = plan.targets[m];
          const y = TOP + i * ROW;
          const mid = y + ROW / 2;
          const low = v + 1e-9 < t.floor;
          return (
            <g key={m}>
              <title>{`${MUSCLES[m]}: ${v} sets a week, target ${t.target}, minimum ${t.floor}`}</title>
              <text className={styles.label} x={0} y={mid + 4}>{t.priority ? "★ " : ""}{MUSCLES[m]}</text>
              <rect className={styles.track} x={LABEL_W} y={mid - BAR_H / 2} width={barW} height={BAR_H} rx={BAR_H / 2} />
              <rect className={low ? styles.fillLow : styles.fill} x={LABEL_W} y={mid - BAR_H / 2} width={Math.max(0, X(v) - LABEL_W)} height={BAR_H} rx={BAR_H / 2} />
              {t.floor > 0 && <line className={styles.floor} x1={X(t.floor)} x2={X(t.floor)} y1={mid - BAR_H / 2 - 2} y2={mid + BAR_H / 2 + 2} />}
              <line className={styles.target} x1={X(t.target)} x2={X(t.target)} y1={mid - BAR_H / 2 - 3} y2={mid + BAR_H / 2 + 3} />
              <text className={styles.value} x={W} y={mid + 4} textAnchor="end">{fmtNum(v)}/{t.target}</text>
            </g>
          );
        })}
      </svg>
      <div className={styles.legend}>
        <span><i className={styles.keyFill} />sets</span>
        <span><i className={styles.keyTarget} />target</span>
        <span><i className={styles.keyFloor} />minimum</span>
        <span>★ priority</span>
      </div>
    </div>
  );
}
