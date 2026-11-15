import { useState, type FormEvent } from "react";
import { useAppState } from "../../hooks/useAppState.tsx";
import { useToast } from "../../hooks/useToast.tsx";
import { EQUIPMENT, EXPERIENCE, FULL_GYM, GOALS, MOVEMENTS, PRIORITY_GROUPS, SPLITS } from "../../lib/constants.ts";
import { DEFAULT_ANSWERS, normalizeAnswers } from "../../lib/generator.ts";
import type { Answers, Equipment, Experience, Goal, Movement, PriorityGroup } from "../../lib/types.ts";
import { Button, LinkButton } from "../common/Button.tsx";
import { Callout } from "../common/Callout.tsx";
import { OptionGroup } from "../common/OptionGroup.tsx";
import { PageHeader } from "../common/PageHeader.tsx";
import { DislikePicker } from "./DislikePicker.tsx";
import { InjuryFields } from "./InjuryFields.tsx";
import { Hint, Question } from "./Question.tsx";
import styles from "./SetupView.module.css";

const PRESETS: Record<string, { label: string; items: Equipment[] }> = {
  gym: { label: "Full gym", items: FULL_GYM },
  db: { label: "Dumbbells and bench", items: ["dumbbell", "bench"] },
  none: { label: "Bodyweight only", items: [] },
};

const keys = <K extends string>(o: Record<K, unknown>) => Object.keys(o) as K[];

export function SetupView() {
  const { answers: saved, plan, buildPlan } = useAppState();
  const toast = useToast();
  const editing = Boolean(plan);
  const [a, setA] = useState<Answers>(() => normalizeAnswers(saved ?? DEFAULT_ANSWERS));
  const set = <K extends keyof Answers>(k: K, v: Answers[K]) => setA((prev) => ({ ...prev, [k]: v }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    buildPlan(normalizeAnswers(a));
    window.location.hash = "#plan";
    toast("Plan ready");
  };

  return (
    <>
      <PageHeader
        eyebrow={editing ? "Edit your answers" : "About two minutes"}
        title={editing ? "Your answers" : "Build your plan"}
        actions={editing && <LinkButton href="#plan">Back to plan</LinkButton>}
      />
      {editing && <Callout small>Saving builds a new plan. Your logged workouts are kept.</Callout>}

      <form className={styles.form} onSubmit={submit} noValidate>
        <Question title="1. Workouts per week">
          <OptionGroup label="Workouts per week" options={[2, 3, 4, 5, 6].map((d) => ({ value: d, label: `${d}×` }))} value={a.days} onChange={(v) => set("days", v)} />
          <Hint>Split: {SPLITS[a.days]?.name}. Each muscle is trained about twice a week.</Hint>
          <Hint>Workouts aren't tied to weekdays: you do them in order (A, B, C…) on whichever days suit you, and the app suggests the next one.</Hint>
        </Question>

        <Question title="2. Session length">
          <OptionGroup label="Session length" options={[30, 45, 60, 75, 90].map((m) => ({ value: m, label: `${m} min` }))} value={a.minutes} onChange={(v) => set("minutes", v)} />
        </Question>

        <Question title="3. Main goal">
          <OptionGroup label="Main goal" options={keys(GOALS).map((g: Goal) => ({ value: g, label: GOALS[g] }))} value={a.goal} onChange={(v) => set("goal", v)} />
        </Question>

        <Question title="4. Experience" hint="How long have you trained consistently, at least twice a week?">
          <OptionGroup label="Experience" options={keys(EXPERIENCE).map((x: Experience) => ({ value: x, label: EXPERIENCE[x] }))} value={a.experience} onChange={(v) => set("experience", v)} />
        </Question>

        <Question title="5. Equipment you can use">
          <div className={styles.row}>
            {Object.entries(PRESETS).map(([k, p]) => (
              <Button key={k} variant="ghost" small onClick={() => set("equipment", p.items)}>{p.label}</Button>
            ))}
          </div>
          <OptionGroup multiple label="Equipment" options={keys(EQUIPMENT).map((e: Equipment) => ({ value: e, label: EQUIPMENT[e] }))} value={a.equipment} onChange={(v) => set("equipment", v)} />
        </Question>

        <Question title="6. Injuries or limitations" hint="Pump only avoids or eases exercises. It can't diagnose anything. If a joint is currently injured, check with a physio or doctor before training it.">
          <InjuryFields value={a.injuries} onChange={(v) => set("injuries", v)} />
          <Hint>Movements that hurt:</Hint>
          <OptionGroup multiple label="Movements that hurt" options={keys(MOVEMENTS).map((m: Movement) => ({ value: m, label: MOVEMENTS[m] }))} value={a.painful} onChange={(v) => set("painful", v)} />
        </Question>

        <Question title="7. Muscles to prioritize" hint="Up to 3. They get about 40% more weekly sets; the rest get a little less.">
          <OptionGroup multiple max={3} label="Muscles to prioritize" options={keys(PRIORITY_GROUPS).map((p: PriorityGroup) => ({ value: p, label: PRIORITY_GROUPS[p].label }))} value={a.priorities} onChange={(v) => set("priorities", v)} />
        </Question>

        <Question title="8. Exercises to skip (optional)">
          <DislikePicker value={a.dislikes} onChange={(v) => set("dislikes", v)} />
        </Question>

        <Question title="9. Age (optional)" hint="From about 50, weekly sets are a little lower to allow more recovery.">
          <input
            className={styles.age}
            type="number"
            min={13}
            max={100}
            inputMode="numeric"
            aria-label="Age"
            value={a.age ?? ""}
            onChange={(e) => set("age", e.target.value ? Number(e.target.value) : null)}
          />
        </Question>

        <div className={styles.foot}>
          <Button type="submit">{editing ? "Save and rebuild plan" : "Build my plan"}</Button>
        </div>
      </form>
    </>
  );
}
