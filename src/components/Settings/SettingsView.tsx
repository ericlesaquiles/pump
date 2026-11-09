import { useState } from "react";
import { useAppState } from "../../hooks/useAppState.tsx";
import { useToast } from "../../hooks/useToast.tsx";
import type { Settings, Unit } from "../../lib/types.ts";
import { Button } from "../common/Button.tsx";
import { OptionGroup } from "../common/OptionGroup.tsx";
import { PageHeader } from "../common/PageHeader.tsx";
import { Hint, Question } from "../Setup/Question.tsx";
import styles from "./SettingsView.module.css";

export function SettingsView() {
  const { settings, saveSettings, eraseAll } = useAppState();
  const toast = useToast();
  const [draft, setDraft] = useState<Settings>(settings);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [eraseArmed, setEraseArmed] = useState(false);

  const save = () => {
    const next = { ...draft, apiKey: draft.apiKey.trim() };
    if (next.aiEnabled && !next.apiKey) { setStatus({ ok: false, text: "Add an API key to use the AI review, or turn it off." }); return; }
    saveSettings(next);
    setStatus({ ok: true, text: "Saved." });
  };

  return (
    <>
      <PageHeader eyebrow="Stored only on this device" title="Settings" />
      <div className={styles.form}>
        <Question title="Units" hint="Applies to new workouts. Logged workouts keep their own unit.">
          <OptionGroup<Unit> label="Units" options={[{ value: "kg", label: "kg" }, { value: "lb", label: "lb" }]} value={draft.unit} onChange={(unit) => setDraft({ ...draft, unit })} />
        </Question>

        <Question title="AI review (optional)">
          <label className={styles.check}>
            <input type="checkbox" checked={draft.aiEnabled} onChange={(e) => setDraft({ ...draft, aiEnabled: e.target.checked })} />
            Show the “Get AI review” button on the plan
          </label>
          <label className={styles.field}>
            <span>Anthropic API key</span>
            <input type="password" value={draft.apiKey} placeholder="sk-ant-…" autoComplete="off" spellCheck={false} onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })} />
          </label>
          <Hint>
            Your key is stored only in this browser and sent only to api.anthropic.com. Reviews are billed to your Anthropic account, usually a few cents each. Before anything is sent, you see exactly what will go out. Get a key at{" "}
            <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer">console.anthropic.com</a>.
          </Hint>
          <Hint>Without a key you can still use “Copy review prompt” on the plan and paste it into any chatbot.</Hint>
        </Question>

        <div className={styles.foot}>
          <Button onClick={save}>Save settings</Button>
          {status && <span className={status.ok ? styles.ok : styles.error} role={status.ok ? "status" : "alert"}>{status.text}</span>}
        </div>

        <Question title="Credits">
          <p className={styles.text}>
            Exercise instructions: <a href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noopener noreferrer">free-exercise-db</a> (public domain). Exercise tags, joint-stress ratings and the plan algorithm: Pump. Joint-stress ratings are first-pass estimates and haven't been reviewed by a professional yet.
          </p>
          <p className={styles.text}>Pump gives general training guidance, not medical advice.</p>
        </Question>

        <Question title="Erase everything" hint="Deletes your answers, plan, workouts and settings from this browser. Export a backup first if you want to keep them.">
          <div>
            {eraseArmed ? (
              <Button variant="danger" onClick={() => { eraseAll(); setEraseArmed(false); setDraft({ unit: "kg", aiEnabled: false, apiKey: "" }); window.location.hash = "#setup"; toast("All data erased"); }}>
                Yes, erase everything
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setEraseArmed(true)}>Erase all data</Button>
            )}
          </div>
        </Question>
      </div>
    </>
  );
}
