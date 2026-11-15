import { useI18n } from "../../hooks/useI18n.ts";
import { Button, LinkButton } from "../common/Button.tsx";
import { Callout } from "../common/Callout.tsx";
import styles from "./HurtCallout.module.css";

export interface HurtInfo { exIds: string[]; slots: { dayIdx: number; slot: number; exId: string }[] }

interface Props {
  info: HurtInfo;
  onSwap: (dayIdx: number, slot: number) => void;
  onDismiss: () => void;
}

/** Shown after saving a workout where a set was marked as painful. */
export function HurtCallout({ info, onSwap, onDismiss }: Props) {
  const { t, exName } = useI18n();
  return (
    <Callout tone="warn" title={t.workout.hurtTitle(info.exIds.map(exName))}>
      <span>{t.workout.hurtText}</span>
      <div className={styles.row}>
        {info.slots.map((s) => (
          <Button key={`${s.dayIdx}-${s.slot}`} small onClick={() => onSwap(s.dayIdx, s.slot)}>
            {t.workout.hurtSwap(exName(s.exId))}
          </Button>
        ))}
        <LinkButton small href="#setup">{t.workout.addLimitation}</LinkButton>
        <Button variant="ghost" small onClick={onDismiss}>{t.workout.dismiss}</Button>
      </div>
    </Callout>
  );
}
