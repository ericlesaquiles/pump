import { useState } from "react";
import { EXERCISES } from "../../data/exercises.ts";
import { useAppState } from "../../hooks/useAppState.tsx";
import { useOnline } from "../../hooks/useOnline.ts";
import { useToast } from "../../hooks/useToast.tsx";
import { fmtDate, cx } from "../../lib/format.ts";
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
    const text = reviewPromptText(buildReviewInput(plan, EXERCISES));
    try {
      await navigator.clipboard.writeText(text);
      toast("Review prompt copied");
    } catch {
      setPromptText(text);
    }
  };

  return (
    <Panel label="AI review (optional)">
      {review ? (
        <>
          <p>{review.summary}</p>
          {review.findings.map((f, i) => {
            const status = review.status[i];
            return (
              <div key={`${i}-${f.title}`} className={cx(styles.finding, styles[f.severity], status && styles.done)}>
                <div className={styles.row}><Chip tone={TONE[f.severity]}>{f.severity}</Chip><strong>{f.title}</strong></div>
                <span className={styles.small}>{f.explanation}</span>
                {f.suggestion && <span className={styles.small}><strong>Suggestion:</strong> {f.suggestion}</span>}
                <div className={styles.row}>
                  {status ? (
                    <>
                      <Chip>{status === "done" ? "Done" : "Ignored"}</Chip>
                      <Button variant="link" small onClick={() => setStatus(i, null)}>Undo</Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" small onClick={() => setStatus(i, "done")}>Mark done</Button>
                      <Button variant="ghost" small onClick={() => setStatus(i, "ignored")}>Ignore</Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          <p className={styles.meta}>Reviewed {fmtDate(review.at.slice(0, 10))} by {review.model}. Suggestions are not applied automatically; use Swap to make changes.</p>
        </>
      ) : (
        <p className={styles.small}>
          {ai
            ? "Ask Claude to check this plan for balance, volume, injuries and exercise choice. You'll see exactly what is sent first."
            : "You can ask an AI to check this plan. Turn it on in Settings, or copy a prompt to paste into any chatbot."}
        </p>
      )}

      <div className={styles.row}>
        {ai ? (
          <Button small disabled={!online} onClick={() => setSending(buildReviewInput(plan, EXERCISES))}>{review ? "Review again" : "Get AI review"}</Button>
        ) : (
          <LinkButton small href="#settings">Turn on in Settings</LinkButton>
        )}
        <Button variant="ghost" small onClick={copyPrompt}>Copy review prompt</Button>
      </div>
      {ai && !online && <p className={styles.meta}>You're offline. The review needs internet.</p>}

      {sending && (
        <ReviewDialog
          input={sending}
          apiKey={settings.apiKey}
          onClose={() => setSending(null)}
          onDone={(r) => {
            updatePlan({ ...plan, review: { ...r, at: new Date().toISOString(), status: {} } });
            setSending(null);
            toast("Review ready");
          }}
        />
      )}
      {promptText && (
        <Dialog title="Review prompt" onClose={() => setPromptText(null)}>
          <p className={styles.small}>Copy this text and paste it into any chatbot.</p>
          <textarea className={styles.prompt} rows={14} readOnly value={promptText} onFocus={(e) => e.currentTarget.select()} />
        </Dialog>
      )}
    </Panel>
  );
}
