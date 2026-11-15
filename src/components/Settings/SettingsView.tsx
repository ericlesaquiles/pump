import { useState } from "react";
import { useAppState } from "../../hooks/useAppState.tsx";
import { useI18n } from "../../hooks/useI18n.ts";
import { useToast } from "../../hooks/useToast.tsx";
import { DICTS, LANGS } from "../../i18n/index.ts";
import { defaultSettings } from "../../lib/storage.ts";
import type { Lang, Settings, Unit } from "../../lib/types.ts";
import { Button } from "../common/Button.tsx";
import { OptionGroup } from "../common/OptionGroup.tsx";
import { PageHeader } from "../common/PageHeader.tsx";
import { Hint, Question } from "../Setup/Question.tsx";
import styles from "./SettingsView.module.css";

export function SettingsView() {
  const { settings, saveSettings, eraseAll } = useAppState();
  const { t } = useI18n();
  const toast = useToast();
  const [draft, setDraft] = useState<Settings>(settings);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [eraseArmed, setEraseArmed] = useState(false);

  const save = () => {
    const next = { ...draft, apiKey: draft.apiKey.trim() };
    if (next.aiEnabled && !next.apiKey) { setStatus({ ok: false, text: t.settings.needKey }); return; }
    saveSettings(next);
    setStatus({ ok: true, text: t.settings.saved });
  };

  // The language applies right away (it doesn't wait for "Save settings").
  const setLang = (lang: Lang) => {
    setDraft({ ...draft, lang });
    saveSettings({ ...settings, lang });
    setStatus(null);
  };

  return (
    <>
      <PageHeader eyebrow={t.settings.eyebrow} title={t.settings.title} />
      <div className={styles.form}>
        <Question title={t.settings.language}>
          <OptionGroup<Lang> label={t.settings.language} options={LANGS.map((l) => ({ value: l, label: DICTS[l].langName }))} value={settings.lang} onChange={setLang} />
        </Question>

        <Question title={t.settings.units} hint={t.settings.unitsHint}>
          <OptionGroup<Unit> label={t.settings.units} options={[{ value: "kg", label: "kg" }, { value: "lb", label: "lb" }]} value={draft.unit} onChange={(unit) => setDraft({ ...draft, unit })} />
        </Question>

        <Question title={t.settings.ai}>
          <label className={styles.check}>
            <input type="checkbox" checked={draft.aiEnabled} onChange={(e) => setDraft({ ...draft, aiEnabled: e.target.checked })} />
            {t.settings.aiShow}
          </label>
          <label className={styles.field}>
            <span>{t.settings.key}</span>
            <input type="password" value={draft.apiKey} placeholder="sk-ant-…" autoComplete="off" spellCheck={false} onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })} />
          </label>
          <Hint>
            {t.settings.keyHint}{" "}
            <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer">console.anthropic.com</a>.
          </Hint>
          <Hint>{t.settings.noKeyHint}</Hint>
        </Question>

        <div className={styles.foot}>
          <Button onClick={save}>{t.settings.save}</Button>
          {status && <span className={status.ok ? styles.ok : styles.error} role={status.ok ? "status" : "alert"}>{status.text}</span>}
        </div>

        <Question title={t.settings.credits}>
          <p className={styles.text}>
            {t.settings.creditsInstr} <a href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noopener noreferrer">free-exercise-db</a> {t.settings.creditsText}
          </p>
          {t.settings.translation && <p className={styles.text}>{t.settings.translation}</p>}
          <p className={styles.text}>{t.settings.medical}</p>
        </Question>

        <Question title={t.settings.erase} hint={t.settings.eraseHint}>
          <div>
            {eraseArmed ? (
              <Button variant="danger" onClick={() => { eraseAll(); setEraseArmed(false); setDraft(defaultSettings()); window.location.hash = "#setup"; toast(t.settings.erased); }}>
                {t.settings.eraseConfirm}
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setEraseArmed(true)}>{t.settings.eraseAll}</Button>
            )}
          </div>
        </Question>
      </div>
    </>
  );
}
