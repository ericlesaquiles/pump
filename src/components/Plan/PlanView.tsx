import { useState } from "react";
import { EXERCISES } from "../../data/exercises.ts";
import { useAppState } from "../../hooks/useAppState.tsx";
import { useI18n } from "../../hooks/useI18n.ts";
import { useToast } from "../../hooks/useToast.tsx";
import { isoDate } from "../../lib/format.ts";
import { nextDayIdx } from "../../lib/rotation.ts";
import { setsThisWeek } from "../../lib/volume.ts";
import { applySwap } from "../../lib/swap.ts";
import type { Plan } from "../../lib/types.ts";
import { AskClaudeButton } from "../common/AskClaudeButton.tsx";
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
  const { t, text, exName } = useI18n();
  const [infoId, setInfoId] = useState<string | null>(null);
  const [swap, setSwap] = useState<{ dayIdx: number; exIdx: number } | null>(null);
  const a = plan.answers;
  const next = nextDayIdx(plan, sessions);
  const start = (dayIdx: number) => { setLogSel({ dayIdx, date: isoDate(new Date()) }); window.location.hash = "#log"; };

  return (
    <>
      <PageHeader
        eyebrow={t.plan.eyebrow(t.splits[a.days] ?? "", a.days, a.minutes, t.goals[a.goal])}
        title={t.plan.title}
        actions={
          <>
            <LinkButton href="#setup">{t.plan.editAnswers}</LinkButton>
            <Button variant="ghost" onClick={() => { rebuildPlan(); toast(t.plan.rebuilt); }}>{t.plan.rebuild}</Button>
          </>
        }
      />
      {plan.notices.length > 0 && <Callout tone="danger" items={plan.notices.map(text)} />}
      {plan.warnings.length > 0 && <Callout tone="warn" title={t.plan.warningsTitle} items={plan.warnings.map((w) => text(w.msg))} />}
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
          <Panel label={t.plan.weeklySets}>
            <VolumeChart plan={plan} done={setsThisWeek(sessions, EXERCISES)} />
            <p className={styles.note}>{t.plan.weeklyNote}</p>
          </Panel>
          <Panel label={t.ask.panel}>
            <p className={styles.note}>{t.ask.hint}</p>
            <div><AskClaudeButton focus={{ kind: "plan" }} variant="primary" /></div>
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
            toast(t.plan.swappedIn(exName(exId)));
          }}
        />
      )}
    </>
  );
}
