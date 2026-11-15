import { useState } from "react";
import { useAppState } from "../../hooks/useAppState.tsx";
import { useI18n } from "../../hooks/useI18n.ts";
import { useToast } from "../../hooks/useToast.tsx";
import type { Plan, Session } from "../../lib/types.ts";
import { PageHeader } from "../common/PageHeader.tsx";
import { Panel } from "../common/Panel.tsx";
import { BackupPanel } from "./BackupPanel.tsx";
import { PastSessionDialog } from "./PastSessionDialog.tsx";
import { ProgressPanel } from "./ProgressPanel.tsx";
import { SessionList } from "./SessionList.tsx";
import { TrainingCalendar } from "./TrainingCalendar.tsx";
import styles from "./HistoryView.module.css";

export function HistoryView({ plan }: { plan: Plan }) {
  const { sessions, deleteSession, setLogSel } = useAppState();
  const toast = useToast();
  const { t } = useI18n();
  const [past, setPast] = useState<Session | null>(null);
  const sorted = [...sessions].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const open = (s: Session) => {
    // Workouts from the current plan open in the editor; older ones read-only.
    if (s.planId !== plan.id || s.dayIdx >= plan.days.length) { setPast(s); return; }
    setLogSel({ dayIdx: s.dayIdx, date: s.date });
    window.location.hash = "#log";
  };

  return (
    <>
      <PageHeader eyebrow={t.history.logged(sessions.length)} title={t.history.title} />
      <div className={styles.grid}>
        <Panel label={t.history.workouts}>
          <SessionList sessions={sorted} onOpen={open} onDelete={(s) => { deleteSession(s.id); toast(t.history.deleted); }} />
        </Panel>
        <aside className={styles.stack}>
          <TrainingCalendar sessions={sessions} onOpen={open} />
          <ProgressPanel sessions={sessions} />
          <BackupPanel />
        </aside>
      </div>
      {past && <PastSessionDialog session={past} onClose={() => setPast(null)} />}
    </>
  );
}
