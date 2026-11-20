import { useMemo, useState } from "react";
import { EXERCISES } from "../../data/exercises.ts";
import { useI18n } from "../../hooks/useI18n.ts";
import { QUICK_FILTERS, swapCandidates, swapImpact, type QuickFilter, type SwapScope } from "../../lib/swap.ts";
import type { Plan } from "../../lib/types.ts";
import { Button } from "../common/Button.tsx";
import { Callout } from "../common/Callout.tsx";
import { Dialog } from "../common/Dialog.tsx";
import { OptionGroup } from "../common/OptionGroup.tsx";
import { ExerciseDetails, useExerciseSummary } from "./ExerciseDetails.tsx";
import styles from "./SwapDialog.module.css";

interface Props {
  plan: Plan;
  dayIdx: number;
  exIdx: number;
  /** "plan" changes the plan; "today" only picks a substitute for one workout. */
  mode: "plan" | "today";
  onPick: (exId: string, scope: SwapScope) => void;
  onClose: () => void;
}

export function SwapDialog({ plan, dayIdx, exIdx, mode, onPick, onClose }: Props) {
  const { t, exName, num } = useI18n();
  const slot = plan.days[dayIdx]?.exercises[exIdx];
  const [filter, setFilter] = useState<QuickFilter | "all">("all");
  const [scope, setScope] = useState<SwapScope>("plan");
  const candidates = useMemo(
    () => swapCandidates(plan, dayIdx, exIdx, EXERCISES, { filter: filter === "all" ? null : filter }).slice(0, 30),
    [plan, dayIdx, exIdx, filter],
  );
  const [picked, setPicked] = useState<string | null>(null);
  // An option whose details are being looked at (replaces the list until "Back").
  const [preview, setPreview] = useState<string | null>(null);
  const previewSummary = useExerciseSummary(preview ?? "");
  const selected = picked && candidates.some((c) => c.ex.id === picked) ? picked : candidates[0]?.ex.id ?? null;
  const impact = useMemo(() => (mode === "plan" && selected ? swapImpact(plan, dayIdx, exIdx, selected, EXERCISES) : []), [mode, selected, plan, dayIdx, exIdx]);

  if (!slot) return null;
  const currentName = exName(slot.exId);
  const warn = impact.filter((c) => c.belowFloor);
  const previewed = preview ? candidates.find((c) => c.ex.id === preview) : undefined;

  if (previewed) {
    return (
      <Dialog
        eyebrow={`${t.swap.previewEyebrow(currentName)} · ${previewSummary}`}
        title={exName(previewed.ex.id)}
        closeLabel={t.cancel}
        onClose={onClose}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPreview(null)}>{t.swap.back}</Button>
            <Button onClick={() => { setPicked(previewed.ex.id); setPreview(null); }}>{t.swap.choose}</Button>
          </>
        }
      >
        <p className={styles.muted}>{t.swap.reason(previewed.reason)}</p>
        <ExerciseDetails exId={previewed.ex.id} />
      </Dialog>
    );
  }

  return (
    <Dialog
      eyebrow={mode === "today" ? t.swap.todayEyebrow : t.swap.planEyebrow}
      title={currentName}
      closeLabel={t.cancel}
      onClose={onClose}
      footer={<Button disabled={!selected} onClick={() => selected && onPick(selected, scope)}>{mode === "today" ? t.swap.useToday : t.swap.swap}</Button>}
    >
      <OptionGroup
        label={t.swap.filter}
        options={(["all", ...Object.keys(QUICK_FILTERS)] as (QuickFilter | "all")[]).map((k) => ({ value: k, label: t.swap.filters[k] }))}
        value={filter}
        onChange={setFilter}
      />

      <div className={styles.list} role="radiogroup" aria-label={t.swap.listLabel}>
        {candidates.length === 0 && <p className={styles.muted}>{t.swap.nothing}</p>}
        {candidates.map((c, i) => (
          <div key={c.ex.id} className={styles.group}>
            {(i === 0 || candidates[i - 1]?.tier !== c.tier) && <div className={styles.tier}>{t.swap.tiers[c.tier]}</div>}
            <div className={styles.row}>
              <label className={styles.cand}>
                <input type="radio" name="swap-candidate" checked={selected === c.ex.id} onChange={() => setPicked(c.ex.id)} />
                <strong>{exName(c.ex.id)}</strong>
                <small>{t.swap.reason(c.reason)}</small>
              </label>
              <Button variant="link" small className={styles.more} onClick={() => setPreview(c.ex.id)} aria-label={t.swap.detailsOf(exName(c.ex.id))}>
                {t.swap.details}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {mode === "plan" ? (
        <>
          <div className={styles.impact}>
            {impact.length ? (
              <>
                <span className={styles.muted}>{t.swap.weeklySets}</span>
                {impact.map((c) => `${t.muscles[c.muscle]} ${c.delta > 0 ? "+" : ""}${num(c.delta)}`).join(", ")}
              </>
            ) : (
              <span className={styles.muted}>{t.swap.same}</span>
            )}
          </div>
          {warn.length > 0 && (
            <Callout tone="warn" small>
              {warn.map((c) => t.swap.drop(t.muscles[c.muscle], num(c.after), plan.targets[c.muscle].floor)).join(" ")} {t.swap.dropHint}
            </Callout>
          )}
          <OptionGroup
            label={t.swap.scope}
            options={[{ value: "plan", label: t.swap.scopePlan }, { value: "never", label: t.swap.scopeNever(currentName) }]}
            value={scope}
            onChange={setScope}
          />
        </>
      ) : (
        <p className={styles.muted}>{t.swap.todayNote}</p>
      )}
    </Dialog>
  );
}
