import { useI18n } from "../../hooks/useI18n.ts";
import { MUSCLE_KEYS } from "../../lib/constants.ts";
import type { Muscle, Plan } from "../../lib/types.ts";
import styles from "./VolumeChart.module.css";

const W = 340, ROW = 26, VALUE_W = 74, BAR_H = 10, DONE_H = 6, TOP = 4;

/**
 * Weekly sets per muscle: the plan's sets (pale bar) and the sets logged so far this
 * week (green bar on top), against the target (tick) and minimum (faint tick), to scale.
 */
export function VolumeChart({ plan, done }: { plan: Plan; done: Record<Muscle, number> }) {
  const { t, num, lang } = useI18n();
  // Portuguese muscle names are longer ("Posteriores de coxa").
  const LABEL_W = lang === "pt" ? 132 : 100;
  const scaleMax = Math.max(...MUSCLE_KEYS.map((m) => Math.max(plan.weekly[m], done[m], plan.targets[m].target * 1.3)));
  const barW = W - LABEL_W - VALUE_W;
  const X = (v: number) => LABEL_W + (Math.min(v, scaleMax) / scaleMax) * barW;
  const H = TOP * 2 + MUSCLE_KEYS.length * ROW;

  return (
    <div className={styles.wrap}>
      <svg className={styles.chart} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t.plan.chartLabel}>
        {MUSCLE_KEYS.map((m, i) => {
          const v = plan.weekly[m];
          const d = done[m];
          const goal = plan.targets[m];
          const y = TOP + i * ROW;
          const mid = y + ROW / 2;
          const low = v + 1e-9 < goal.floor;
          return (
            <g key={m}>
              <title>{t.plan.chartRow(t.muscles[m], v, goal.target, goal.floor, d)}</title>
              <text className={styles.label} x={0} y={mid + 4}>{goal.priority ? "★ " : ""}{t.muscles[m]}</text>
              <rect className={styles.track} x={LABEL_W} y={mid - BAR_H / 2} width={barW} height={BAR_H} rx={BAR_H / 2} />
              <rect className={low ? styles.fillLow : styles.fill} x={LABEL_W} y={mid - BAR_H / 2} width={Math.max(0, X(v) - LABEL_W)} height={BAR_H} rx={BAR_H / 2} />
              {d > 0 && <rect className={styles.done} x={LABEL_W} y={mid - DONE_H / 2} width={Math.max(DONE_H, X(d) - LABEL_W)} height={DONE_H} rx={DONE_H / 2} />}
              {goal.floor > 0 && <line className={styles.floor} x1={X(goal.floor)} x2={X(goal.floor)} y1={mid - BAR_H / 2 - 2} y2={mid + BAR_H / 2 + 2} />}
              <line className={styles.target} x1={X(goal.target)} x2={X(goal.target)} y1={mid - BAR_H / 2 - 3} y2={mid + BAR_H / 2 + 3} />
              <text className={styles.value} x={W} y={mid + 4} textAnchor="end">
                <tspan className={styles.doneText}>{num(d)}</tspan> · {num(v)}/{goal.target}
              </text>
            </g>
          );
        })}
      </svg>
      <div className={styles.legend}>
        <span><i className={styles.keyDone} />{t.plan.legend.done}</span>
        <span><i className={styles.keyFill} />{t.plan.legend.sets}</span>
        <span><i className={styles.keyTarget} />{t.plan.legend.target}</span>
        <span><i className={styles.keyFloor} />{t.plan.legend.floor}</span>
        <span>★ {t.plan.legend.priority}</span>
      </div>
    </div>
  );
}
