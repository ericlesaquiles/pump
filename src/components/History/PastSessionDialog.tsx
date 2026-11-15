import { useI18n } from "../../hooks/useI18n.ts";
import { fmtSets } from "../../lib/format.ts";
import type { Session } from "../../lib/types.ts";
import { Dialog } from "../common/Dialog.tsx";
import styles from "./PastSessionDialog.module.css";

/** Read-only view of a workout logged under an earlier plan. */
export function PastSessionDialog({ session, onClose }: { session: Session; onClose: () => void }) {
  const { t, date, exName } = useI18n();
  return (
    <Dialog eyebrow={t.history.earlier(date(session.date))} title={t.workoutFull(session.dayIdx, session.dayKey)} onClose={onClose}>
      {session.entries.map((e) => (
        <div key={`${e.slot}-${e.exId}`}>
          <strong>{exName(e.exId)}</strong>
          <div className={styles.sets}>{fmtSets(e.sets, t.locale)} {session.unit}</div>
        </div>
      ))}
      {session.note && <p className={styles.note}>{session.note}</p>}
    </Dialog>
  );
}
