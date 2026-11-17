import { useI18n } from "../../hooks/useI18n.ts";
import { Dialog } from "../common/Dialog.tsx";
import { ExerciseDetails, useExerciseSummary } from "./ExerciseDetails.tsx";

export function ExerciseInfoDialog({ exId, onClose }: { exId: string; onClose: () => void }) {
  const { exName } = useI18n();
  const summary = useExerciseSummary(exId);
  return (
    <Dialog eyebrow={summary} title={exName(exId)} onClose={onClose}>
      <ExerciseDetails exId={exId} />
    </Dialog>
  );
}
