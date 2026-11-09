import { EXERCISE_BY_ID } from "../../data/exercises.ts";
import { Button, LinkButton } from "../common/Button.tsx";
import { Callout } from "../common/Callout.tsx";
import styles from "./HurtCallout.module.css";

export interface HurtInfo { names: string[]; slots: { dayIdx: number; slot: number; exId: string }[] }

interface Props {
  info: HurtInfo;
  onSwap: (dayIdx: number, slot: number) => void;
  onDismiss: () => void;
}

/** Shown after saving a workout where a set was marked as painful. */
export function HurtCallout({ info, onSwap, onDismiss }: Props) {
  return (
    <Callout tone="warn" title={`You marked pain during ${info.names.join(", ")}.`}>
      <span>If it keeps hurting, swap the exercise or add a limitation so the plan avoids it. See a physio or doctor if pain persists.</span>
      <div className={styles.row}>
        {info.slots.map((s) => (
          <Button key={`${s.dayIdx}-${s.slot}`} small onClick={() => onSwap(s.dayIdx, s.slot)}>
            Swap {EXERCISE_BY_ID.get(s.exId)?.name ?? s.exId} in the plan
          </Button>
        ))}
        <LinkButton small href="#setup">Add a limitation</LinkButton>
        <Button variant="ghost" small onClick={onDismiss}>Dismiss</Button>
      </div>
    </Callout>
  );
}
