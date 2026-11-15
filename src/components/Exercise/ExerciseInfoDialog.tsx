import { EXERCISE_BY_ID } from "../../data/exercises.ts";
import { useAppState } from "../../hooks/useAppState.tsx";
import { useI18n } from "../../hooks/useI18n.ts";
import { historyFor, topSetSeries } from "../../lib/progression.ts";
import type { Equipment, Joint, Muscle } from "../../lib/types.ts";
import { Callout } from "../common/Callout.tsx";
import { Dialog } from "../common/Dialog.tsx";
import { Sparkline } from "../common/Sparkline.tsx";
import styles from "./ExerciseInfoDialog.module.css";

export function ExerciseInfoDialog({ exId, onClose }: { exId: string; onClose: () => void }) {
  const { sessions } = useAppState();
  const { t, ex: local } = useI18n();
  const ex = EXERCISE_BY_ID.get(exId);
  const text = local(exId);
  if (!ex || !text) return null;

  const muscles = (Object.entries(ex.muscles) as [Muscle, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([m, w]) => `${t.muscles[m]}${w >= 1 ? ` (${t.exercise.main})` : ""}`)
    .join(", ");
  const equipment = ex.equipment.length
    ? ex.equipment.map((i) => t.exercise.or(i.split("|").map((e) => t.equipment[e as Equipment]))).join(", ")
    : t.exercise.none;
  const joints = (Object.entries(ex.joints) as [Joint, number][]).map(([j, s]) => `${t.joints[j]}: ${t.stress[s]}`).join(", ") || t.exercise.lowOverall;
  const hist = historyFor(sessions, ex.id);
  const lastUnit = hist[hist.length - 1]?.unit;
  const video = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${text.name} ${t.exercise.videoQuery}`)}`;

  return (
    <Dialog eyebrow={`${t.patterns[ex.pattern]} · ${t.exType[ex.type]} · ${t.skill[ex.skill]}`} title={text.name} onClose={onClose}>
      <dl className={styles.kv}>
        <dt>{t.exercise.muscles}</dt><dd>{muscles}</dd>
        <dt>{t.exercise.equipment}</dt><dd>{equipment}</dd>
        <dt>{t.exercise.joints}</dt><dd>{joints}</dd>
      </dl>
      {text.note && <Callout small>{text.note}</Callout>}
      {text.instructions.length > 0 && (
        <div>
          <div className={styles.label}>{t.exercise.how}</div>
          <ol className={styles.steps}>{text.instructions.map((s) => <li key={s}>{s}</li>)}</ol>
        </div>
      )}
      {lastUnit && (
        <div>
          <div className={styles.label}>{t.exercise.topSet}</div>
          <Sparkline series={topSetSeries(hist)} unit={lastUnit} />
        </div>
      )}
      <p className={styles.small}>
        <a href={video} target="_blank" rel="noopener noreferrer">{t.exercise.video}</a> <span className={styles.muted}>{t.exercise.needsNet}</span>
      </p>
      <p className={styles.credit}>{t.exercise.credit}</p>
    </Dialog>
  );
}
