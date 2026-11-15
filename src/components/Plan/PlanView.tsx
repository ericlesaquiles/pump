import { useState } from "react";
import { EXERCISES, EXERCISE_BY_ID } from "../../data/exercises.ts";
import { useAppState } from "../../hooks/useAppState.tsx";
import { useToast } from "../../hooks/useToast.tsx";
import { GOALS } from "../../lib/constants.ts";
import { isoDate } from "../../lib/format.ts";
import { nextDayIdx } from "../../lib/rotation.ts";
import { applySwap } from "../../lib/swap.ts";
import type { Plan } from "../../lib/types.ts";
import { Button, LinkButton } from "../common/Button.tsx";
import { Callout } from "../common/Callout.tsx";
import { PageHeader } from "../common/PageHeader.tsx";
import { Panel } from "../common/Panel.tsx";
import { ExerciseInfoDialog } from "../Exercise/ExerciseInfoDialog.tsx";
import { SwapDialog } from "../Exercise/SwapDialog.tsx";
import { DayCard } from "./DayCard.tsx";
import { ProgressionTips } from "./ProgressionTips.tsx";
import { ReviewPanel } from "./ReviewPanel.tsx";
import { VolumeChart } from "./VolumeChart.tsx";
import { ThisWeek } from "./ThisWeek.tsx";
import styles from "./PlanView.module.css";

export function PlanView({ plan }: { plan: Plan }) {
  const { sessions, rebuildPlan, updatePlan, setLogSel } = useAppState();
  const toast = useToast();
  const [infoId, setInfoId] = useState<string | null>(null);
  const [swap, setSwap] = useState<{ dayIdx: number; exIdx: number } | null>(null);
  const a = plan.answers;
  const next = nextDayIdx(plan, sessions);
  const start = (dayIdx: number) => { setLogSel({ dayIdx, date: isoDate(new Date()) }); window.location.hash = "#log"; };

  return (
    <>
      <PageHeader
        eyebrow={`${plan.splitName} · ${a.days}× a week · ${a.minutes} min · ${GOALS[a.goal]}`}
        title="Your plan"
        actions={
          <>
            <LinkButton href="#setup">Edit answers</LinkButton>
            <Button variant="ghost" onClick={() => { rebuildPlan(); toast("Plan rebuilt"); }}>Rebuild plan</Button>
          </>
        }
      />
      {plan.notices.length > 0 && <Callout tone="danger" items={plan.notices} />}
      {plan.warnings.length > 0 && <Callout tone="warn" title="Things to know about this plan" items={plan.warnings.map((w) => w.text)} />}
      <ThisWeek plan={plan} sessions={sessions} onStart={start} />

      <div className={styles.grid}>
        <div className={styles.stack}>
          {plan.days.map((day, dayIdx) => (
            <DayCard
              key={`${dayIdx}-${day.key}`}
              day={day}
              dayIdx={dayIdx}
              isNext={dayIdx === next}
              onStart={() => start(dayIdx)}
              onInfo={setInfoId}
              onSwap={(exIdx) => setSwap({ dayIdx, exIdx })}
            />
          ))}
        </div>
        <aside className={styles.stack}>
          <Panel label="Weekly sets per muscle">
            <VolumeChart plan={plan} />
            <p className={styles.note}>Main muscle counts 1 set, secondary muscles ½.</p>
          </Panel>
          <ReviewPanel plan={plan} />
          <ProgressionTips />
        </aside>
      </div>

      {infoId && <ExerciseInfoDialog exId={infoId} onClose={() => setInfoId(null)} />}
      {swap && (
        <SwapDialog
          plan={plan}
          dayIdx={swap.dayIdx}
          exIdx={swap.exIdx}
          mode="plan"
          onClose={() => setSwap(null)}
          onPick={(exId, scope) => {
            updatePlan(applySwap(plan, swap.dayIdx, swap.exIdx, exId, EXERCISES, scope));
            setSwap(null);
            toast(`Swapped in ${EXERCISE_BY_ID.get(exId)?.name ?? exId}`);
          }}
        />
      )}
    </>
  );
}
