import { useState, type FormEvent } from "react";
import { useAppState } from "../../hooks/useAppState.tsx";
import { useI18n } from "../../hooks/useI18n.ts";
import { useToast } from "../../hooks/useToast.tsx";
import { DICTS } from "../../i18n/index.ts";
import { FULL_GYM } from "../../lib/constants.ts";
import { DEFAULT_ANSWERS, normalizeAnswers } from "../../lib/generator.ts";
import type { Answers, Equipment } from "../../lib/types.ts";
import { Button, LinkButton } from "../common/Button.tsx";
import { Callout } from "../common/Callout.tsx";
import { OptionGroup } from "../common/OptionGroup.tsx";
import { PageHeader } from "../common/PageHeader.tsx";
import { DislikePicker } from "./DislikePicker.tsx";
import { InjuryFields } from "./InjuryFields.tsx";
import { Hint, Question } from "./Question.tsx";
import styles from "./SetupView.module.css";

const PRESETS: Record<"gym" | "db" | "none", Equipment[]> = {
  gym: FULL_GYM,
  db: ["dumbbell", "bench"],
  none: [],
};

const keys = <K extends string>(o: Record<K, unknown>) => Object.keys(o) as K[];
const options = <K extends string>(labels: Record<K, string>) => keys(labels).map((value) => ({ value, label: labels[value] }));

export function SetupView() {
  const { answers: saved, plan, buildPlan, settings, saveSettings } = useAppState();
  const { t, lang } = useI18n();
  const toast = useToast();
  const editing = Boolean(plan);
  const [a, setA] = useState<Answers>(() => normalizeAnswers(saved ?? DEFAULT_ANSWERS));
  const set = <K extends keyof Answers>(k: K, v: Answers[K]) => setA((prev) => ({ ...prev, [k]: v }));
  const other = lang === "pt" ? "en" : "pt";

  const submit = (e: FormEvent) => {
    e.preventDefault();
    buildPlan(normalizeAnswers(a));
    window.location.hash = "#plan";
    toast(t.setup.planReady);
  };

  return (
    <>
      <PageHeader
        eyebrow={editing ? t.setup.eyebrowEdit : t.setup.eyebrowNew}
        title={editing ? t.setup.titleEdit : t.setup.titleNew}
        actions={editing
          ? <LinkButton href="#plan">{t.setup.backToPlan}</LinkButton>
          : <Button variant="ghost" small lang={other === "pt" ? "pt-BR" : "en"} onClick={() => saveSettings({ ...settings, lang: other })}>{DICTS[other].langName}</Button>}
      />
      {editing && <Callout small>{t.setup.keepsWorkouts}</Callout>}

      <form className={styles.form} onSubmit={submit} noValidate>
        <Question title={t.setup.q1}>
          <OptionGroup label={t.setup.q1} options={[2, 3, 4, 5, 6].map((d) => ({ value: d, label: t.setup.perWeek(d) }))} value={a.days} onChange={(v) => set("days", v)} />
          <Hint>{t.setup.split(t.splits[a.days] ?? "")}</Hint>
          <Hint>{t.setup.rotation}</Hint>
        </Question>

        <Question title={t.setup.q2}>
          <OptionGroup label={t.setup.q2} options={[30, 45, 60, 75, 90].map((m) => ({ value: m, label: `${m} min` }))} value={a.minutes} onChange={(v) => set("minutes", v)} />
        </Question>

        <Question title={t.setup.q3}>
          <OptionGroup label={t.setup.q3} options={options(t.goals)} value={a.goal} onChange={(v) => set("goal", v)} />
        </Question>

        <Question title={t.setup.q4} hint={t.setup.q4hint}>
          <OptionGroup label={t.setup.q4} options={options(t.experience)} value={a.experience} onChange={(v) => set("experience", v)} />
        </Question>

        <Question title={t.setup.q5}>
          <div className={styles.row}>
            {keys(PRESETS).map((k) => (
              <Button key={k} variant="ghost" small onClick={() => set("equipment", PRESETS[k])}>{t.setup.presets[k]}</Button>
            ))}
          </div>
          <OptionGroup multiple label={t.setup.q5} options={options(t.equipment)} value={a.equipment} onChange={(v) => set("equipment", v)} />
        </Question>

        <Question title={t.setup.q6} hint={t.setup.q6hint}>
          <InjuryFields value={a.injuries} onChange={(v) => set("injuries", v)} />
          <Hint>{t.setup.hurts}</Hint>
          <OptionGroup multiple label={t.setup.hurts} options={options(t.movements)} value={a.painful} onChange={(v) => set("painful", v)} />
        </Question>

        <Question title={t.setup.q7} hint={t.setup.q7hint}>
          <OptionGroup multiple max={3} label={t.setup.q7} options={options(t.priorities)} value={a.priorities} onChange={(v) => set("priorities", v)} />
        </Question>

        <Question title={t.setup.q8}>
          <DislikePicker value={a.dislikes} onChange={(v) => set("dislikes", v)} />
        </Question>

        <Question title={t.setup.q9} hint={t.setup.q9hint}>
          <input
            className={styles.age}
            type="number"
            min={13}
            max={100}
            inputMode="numeric"
            aria-label={t.setup.age}
            value={a.age ?? ""}
            onChange={(e) => set("age", e.target.value ? Number(e.target.value) : null)}
          />
        </Question>

        <div className={styles.foot}>
          <Button type="submit">{editing ? t.setup.submitEdit : t.setup.submitNew}</Button>
        </div>
      </form>
    </>
  );
}
