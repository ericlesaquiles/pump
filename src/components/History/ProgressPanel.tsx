import { useState } from "react";
import { EXERCISE_BY_ID } from "../../data/exercises.ts";
import { useI18n } from "../../hooks/useI18n.ts";
import { historyFor, topSetSeries } from "../../lib/progression.ts";
import type { Session } from "../../lib/types.ts";
import { Panel } from "../common/Panel.tsx";
import { Sparkline } from "../common/Sparkline.tsx";
import styles from "./ProgressPanel.module.css";

/** Top-set chart for one exercise the user has logged. */
export function ProgressPanel({ sessions }: { sessions: Session[] }) {
  const { t, exName: nameOf } = useI18n();
  const logged = [...new Set(sessions.flatMap((s) => s.entries.map((e) => e.exId)))]
    .filter((id) => EXERCISE_BY_ID.has(id))
    .sort((a, b) => nameOf(a).localeCompare(nameOf(b), t.locale));
  const [picked, setPicked] = useState<string | null>(null);
  const sel = picked && logged.includes(picked) ? picked : logged[0];
  const hist = sel ? historyFor(sessions, sel) : [];
  const unit = hist[hist.length - 1]?.unit;

  return (
    <Panel label={t.history.progress}>
      {sel && unit ? (
        <>
          <select className={styles.select} value={sel} onChange={(e) => setPicked(e.target.value)} aria-label={t.history.exercise}>
            {logged.map((id) => <option key={id} value={id}>{nameOf(id)}</option>)}
          </select>
          <Sparkline series={topSetSeries(hist)} unit={unit} />
        </>
      ) : (
        <p className={styles.empty}>{t.history.noCharts}</p>
      )}
    </Panel>
  );
}
