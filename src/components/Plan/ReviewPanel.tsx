import { useState } from "react";
import { EXERCISES } from "../../data/exercises.ts";
import { useAppState } from "../../hooks/useAppState.tsx";
import { useI18n } from "../../hooks/useI18n.ts";
import { useOnline } from "../../hooks/useOnline.ts";
import { useToast } from "../../hooks/useToast.tsx";
import { cx } from "../../lib/format.ts";
import { buildReviewInput, reviewPromptText, type ReviewInput } from "../../lib/review.ts";
import type { Plan, PlanReview } from "../../lib/types.ts";
import { Button, LinkButton } from "../common/Button.tsx";
import { Chip } from "../common/Chip.tsx";
import { Dialog } from "../common/Dialog.tsx";
import { Panel } from "../common/Panel.tsx";
import { ReviewDialog } from "./ReviewDialog.tsx";
import styles from "./ReviewPanel.module.css";

const TONE = { high: "danger", medium: "warn", low: "quiet", info: "quiet" } as const;

export function ReviewPanel({ plan }: { plan: Plan }) {
  const { settings, updatePlan } = useAppState();
  const online = useOnline();
  const toast = useToast();
  const { t, lang, date } = useI18n();
  const [sending, setSending] = useState<ReviewInput | null>(null);
  const [promptText, setPromptText] = useState<string | null>(null);
  const ai = settings.aiEnabled && Boolean(settings.apiKey);
  const review = plan.review;

  const setStatus = (i: number, status: "done" | "ignored" | null) => {
    if (!review) return;
    const next: PlanReview = { ...review, status: { ...review.status } };
    if (status) next.status[i] = status;
    else delete next.status[i];
    updatePlan({ ...plan, review: next });
  };

  const copyPrompt = async () => {
    const text = reviewPromptText(buildReviewInput(plan, EXERCISES, lang), t.review.replyIn);
    try {
      await navigator.clipboard.writeText(text);
      toast(t.review.copied);
    } catch {
      setPromptText(text);
    }
  };

  return (
    <Panel label={t.review.panel}>
      {review ? (
        <>
          <p>{review.summary}</p>
          {review.findings.map((f, i) => {
            const status = review.status[i];
            return (
              <div key={`${i}-${f.title}`} className={cx(styles.finding, styles[f.severity], status && styles.done)}>
                <div className={styles.row}><Chip tone={TONE[f.severity]}>{t.review.severity[f.severity] ?? f.severity}</Chip><strong>{f.title}</strong></div>
                <span className={styles.small}>{f.explanation}</span>
                {f.suggestion && <span className={styles.small}><strong>{t.review.suggestion}</strong> {f.suggestion}</span>}
                <div className={styles.row}>
                  {status ? (
                    <>
                      <Chip>{status === "done" ? t.review.done : t.review.ignored}</Chip>
                      <Button variant="link" small onClick={() => setStatus(i, null)}>{t.review.undo}</Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" small onClick={() => setStatus(i, "done")}>{t.review.markDone}</Button>
                      <Button variant="ghost" small onClick={() => setStatus(i, "ignored")}>{t.review.ignore}</Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          <p className={styles.meta}>{t.review.meta(date(review.at.slice(0, 10)), review.model)}</p>
        </>
      ) : (
        <p className={styles.small}>
          {ai ? t.review.introAi : t.review.introOff}
        </p>
      )}

      <div className={styles.row}>
        {ai ? (
          <Button small disabled={!online} onClick={() => setSending(buildReviewInput(plan, EXERCISES, lang))}>{review ? t.review.again : t.review.get}</Button>
        ) : (
          <LinkButton small href="#settings">{t.review.turnOn}</LinkButton>
        )}
        <Button variant="ghost" small onClick={copyPrompt}>{t.review.copy}</Button>
      </div>
      {ai && !online && <p className={styles.meta}>{t.review.offline}</p>}

      {sending && (
        <ReviewDialog
          input={sending}
          apiKey={settings.apiKey}
          onClose={() => setSending(null)}
          onDone={(r) => {
            updatePlan({ ...plan, review: { ...r, at: new Date().toISOString(), status: {} } });
            setSending(null);
            toast(t.review.ready);
          }}
        />
      )}
      {promptText && (
        <Dialog title={t.review.promptTitle} onClose={() => setPromptText(null)}>
          <p className={styles.small}>{t.review.promptHint}</p>
          <textarea className={styles.prompt} rows={14} readOnly value={promptText} onFocus={(e) => e.currentTarget.select()} />
        </Dialog>
      )}
    </Panel>
  );
}
