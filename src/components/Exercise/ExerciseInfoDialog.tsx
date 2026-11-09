import { EXERCISE_BY_ID } from "../../data/exercises.ts";
import { useAppState } from "../../hooks/useAppState.tsx";
import { EQUIPMENT, JOINTS, MUSCLES, PATTERNS } from "../../lib/constants.ts";
import { historyFor, topSetSeries } from "../../lib/progression.ts";
import type { Equipment, Joint, Muscle } from "../../lib/types.ts";
import { Callout } from "../common/Callout.tsx";
import { Dialog } from "../common/Dialog.tsx";
import { Sparkline } from "../common/Sparkline.tsx";
import styles from "./ExerciseInfoDialog.module.css";

const SKILL = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" } as const;
const STRESS: Record<number, string> = { 1: "low", 2: "medium", 3: "high" };

export function ExerciseInfoDialog({ exId, onClose }: { exId: string; onClose: () => void }) {
  const { sessions } = useAppState();
  const ex = EXERCISE_BY_ID.get(exId);
  if (!ex) return null;

  const muscles = (Object.entries(ex.muscles) as [Muscle, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([m, w]) => `${MUSCLES[m]}${w >= 1 ? " (main)" : ""}`)
    .join(", ");
  const equipment = ex.equipment.length
    ? ex.equipment.map((i) => i.split("|").map((e) => EQUIPMENT[e as Equipment]).join(" or ")).join(", ")
    : "None";
  const joints = (Object.entries(ex.joints) as [Joint, number][]).map(([j, s]) => `${JOINTS[j]}: ${STRESS[s]}`).join(", ") || "Low overall";
  const hist = historyFor(sessions, ex.id);
  const lastUnit = hist[hist.length - 1]?.unit;
  const video = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${ex.name} exercise technique`)}`;

  return (
    <Dialog eyebrow={`${PATTERNS[ex.pattern].label} · ${ex.type} · ${SKILL[ex.skill]}`} title={ex.name} onClose={onClose}>
      <dl className={styles.kv}>
        <dt>Muscles</dt><dd>{muscles}</dd>
        <dt>Equipment</dt><dd>{equipment}</dd>
        <dt>Joint stress</dt><dd>{joints}</dd>
      </dl>
      {ex.note && <Callout small>{ex.note}</Callout>}
      {ex.instructions.length > 0 && (
        <div>
          <div className={styles.label}>How to do it</div>
          <ol className={styles.steps}>{ex.instructions.map((s) => <li key={s}>{s}</li>)}</ol>
        </div>
      )}
      {lastUnit && (
        <div>
          <div className={styles.label}>Your top set over time</div>
          <Sparkline series={topSetSeries(hist)} unit={lastUnit} />
        </div>
      )}
      <p className={styles.small}>
        <a href={video} target="_blank" rel="noopener noreferrer">Find a video on YouTube</a> <span className={styles.muted}>(needs internet)</span>
      </p>
      <p className={styles.credit}>Instructions from free-exercise-db (public domain). Exercise tags by Pump.</p>
    </Dialog>
  );
}
