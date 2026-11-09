import { EXERCISE_BY_ID } from "../../data/exercises.ts";
import { fmtDate, fmtSets } from "../../lib/format.ts";
import type { Session } from "../../lib/types.ts";
import { Dialog } from "../common/Dialog.tsx";
import styles from "./PastSessionDialog.module.css";

/** Read-only view of a workout logged under an earlier plan. */
export function PastSessionDialog({ session, onClose }: { session: Session; onClose: () => void }) {
  return (
    <Dialog eyebrow={`${fmtDate(session.date)} · from an earlier plan`} title={session.dayName} onClose={onClose}>
      {session.entries.map((e) => (
        <div key={`${e.slot}-${e.exId}`}>
          <strong>{EXERCISE_BY_ID.get(e.exId)?.name ?? e.exId}</strong>
          <div className={styles.sets}>{fmtSets(e.sets)} {session.unit}</div>
        </div>
      ))}
      {session.note && <p className={styles.note}>{session.note}</p>}
    </Dialog>
  );
}
