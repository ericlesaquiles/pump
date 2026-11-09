import { fmtDate, fmtNum } from "../../lib/format.ts";
import type { Unit } from "../../lib/types.ts";
import styles from "./Sparkline.module.css";

const W = 560, H = 120, PAD_L = 40, PAD_R = 12, PAD_T = 12, PAD_B = 22;

/** Top-set weight over time, drawn to scale. */
export function Sparkline({ series, unit }: { series: { date: string; w: number }[]; unit: Unit }) {
  const first = series[0];
  const last = series[series.length - 1];
  if (!first || !last) return null;
  if (series.length < 2) {
    return <p className={styles.single}>{fmtDate(first.date)}: {fmtNum(first.w)} {unit}</p>;
  }
  const ws = series.map((p) => p.w);
  const min = Math.min(...ws);
  const max = Math.max(...ws);
  const span = max - min || 1;
  const X = (i: number) => PAD_L + (i * (W - PAD_L - PAD_R)) / (series.length - 1);
  const Y = (w: number) => PAD_T + (1 - (w - min) / span) * (H - PAD_T - PAD_B);
  const line = series.map((p, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(p.w).toFixed(1)}`).join(" ");
  const area = `${line} L${X(series.length - 1).toFixed(1)} ${H - PAD_B} L${X(0).toFixed(1)} ${H - PAD_B} Z`;

  return (
    <svg className={styles.spark} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Top set from ${fmtNum(first.w)} to ${fmtNum(last.w)} ${unit}`}>
      <line className={styles.grid} x1={PAD_L} x2={W - PAD_R} y1={Y(max)} y2={Y(max)} />
      <line className={styles.grid} x1={PAD_L} x2={W - PAD_R} y1={Y(min)} y2={Y(min)} />
      <text className={styles.label} x={PAD_L - 6} y={Y(max) + 4} textAnchor="end">{fmtNum(max)}</text>
      <text className={styles.label} x={PAD_L - 6} y={Y(min) + 4} textAnchor="end">{fmtNum(min)}</text>
      <path className={styles.area} d={area} />
      <path className={styles.line} d={line} />
      <circle className={styles.dot} cx={X(series.length - 1)} cy={Y(last.w)} r={4} />
      <text className={styles.label} x={PAD_L} y={H - 6}>{fmtDate(first.date)}</text>
      <text className={styles.label} x={W - PAD_R} y={H - 6} textAnchor="end">{fmtDate(last.date)}</text>
    </svg>
  );
}
