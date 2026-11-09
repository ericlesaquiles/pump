import { useMemo, useState } from "react";
import { EXERCISES, EXERCISE_BY_ID } from "../../data/exercises.ts";
import { MUSCLES } from "../../lib/constants.ts";
import { fmtNum } from "../../lib/format.ts";
import { QUICK_FILTERS, swapCandidates, swapImpact, type QuickFilter, type SwapScope } from "../../lib/swap.ts";
import type { Plan } from "../../lib/types.ts";
import { Button } from "../common/Button.tsx";
import { Callout } from "../common/Callout.tsx";
import { Dialog } from "../common/Dialog.tsx";
import { OptionGroup } from "../common/OptionGroup.tsx";
import styles from "./SwapDialog.module.css";

const TIER_LABEL = { 1: "Same movement", 2: "Same muscle, different movement", 3: "Shifts the work to other muscles" } as const;

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
  const slot = plan.days[dayIdx]?.exercises[exIdx];
  const current = slot ? EXERCISE_BY_ID.get(slot.exId) : undefined;
  const [filter, setFilter] = useState<QuickFilter | "all">("all");
  const [scope, setScope] = useState<SwapScope>("plan");
  const candidates = useMemo(
    () => swapCandidates(plan, dayIdx, exIdx, EXERCISES, { filter: filter === "all" ? null : filter }).slice(0, 30),
    [plan, dayIdx, exIdx, filter],
  );
  const [picked, setPicked] = useState<string | null>(null);
  const selected = picked && candidates.some((c) => c.ex.id === picked) ? picked : candidates[0]?.ex.id ?? null;
  const impact = useMemo(() => (mode === "plan" && selected ? swapImpact(plan, dayIdx, exIdx, selected, EXERCISES) : []), [mode, selected, plan, dayIdx, exIdx]);

  if (!slot || !current) return null;
  const warn = impact.filter((c) => c.belowFloor);

  return (
    <Dialog
      eyebrow={mode === "today" ? "Swap for this workout only" : "Swap exercise"}
      title={current.name}
      closeLabel="Cancel"
      onClose={onClose}
      footer={<Button disabled={!selected} onClick={() => selected && onPick(selected, scope)}>{mode === "today" ? "Use for today" : "Swap"}</Button>}
    >
      <OptionGroup
        label="Filter"
        options={[{ value: "all", label: "All" }, ...Object.entries(QUICK_FILTERS).map(([k, f]) => ({ value: k as QuickFilter, label: f.label }))]}
        value={filter}
        onChange={setFilter}
      />

      <div className={styles.list} role="radiogroup" aria-label="Replacement exercise">
        {candidates.length === 0 && <p className={styles.muted}>Nothing fits this slot with that filter. Try another filter.</p>}
        {candidates.map((c, i) => (
          <div key={c.ex.id} className={styles.group}>
            {(i === 0 || candidates[i - 1]?.tier !== c.tier) && <div className={styles.tier}>{TIER_LABEL[c.tier]}</div>}
            <label className={styles.cand}>
              <input type="radio" name="swap-candidate" checked={selected === c.ex.id} onChange={() => setPicked(c.ex.id)} />
              <strong>{c.ex.name}</strong>
              <small>{c.reason}</small>
            </label>
          </div>
        ))}
      </div>

      {mode === "plan" ? (
        <>
          <div className={styles.impact}>
            {impact.length ? (
              <>
                <span className={styles.muted}>Weekly sets: </span>
                {impact.map((c) => `${MUSCLES[c.muscle]} ${c.delta > 0 ? "+" : ""}${fmtNum(c.delta)}`).join(", ")}
              </>
            ) : (
              <span className={styles.muted}>Weekly sets per muscle stay the same.</span>
            )}
          </div>
          {warn.length > 0 && (
            <Callout tone="warn" small>
              {warn.map((c) => `${MUSCLES[c.muscle]} would drop to ${fmtNum(c.after)} sets a week, below the minimum of ${plan.targets[c.muscle].floor}.`).join(" ")} You can add a set elsewhere or pick another option.
            </Callout>
          )}
          <OptionGroup
            label="Swap scope"
            options={[{ value: "plan", label: "Rest of the plan" }, { value: "never", label: `Never suggest ${current.name} again` }]}
            value={scope}
            onChange={setScope}
          />
        </>
      ) : (
        <p className={styles.muted}>Your plan stays the same. The log records what you actually did.</p>
      )}
    </Dialog>
  );
}
