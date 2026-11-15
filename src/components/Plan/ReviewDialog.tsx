import { useState } from "react";
import { useI18n } from "../../hooks/useI18n.ts";
import { ReviewError, requestReview, type ReviewInput, type ReviewResult } from "../../lib/review.ts";
import { Button } from "../common/Button.tsx";
import { Dialog } from "../common/Dialog.tsx";
import styles from "./ReviewDialog.module.css";

interface Props {
  input: ReviewInput;
  apiKey: string;
  onDone: (result: ReviewResult) => void;
  onClose: () => void;
}

/** Shows exactly what will be sent, then sends it on the user's click. */
export function ReviewDialog({ input, apiKey, onDone, onClose }: Props) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasHealth = input.person.limitations.length > 0 || input.person.painfulMovements.length > 0;

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      onDone(await requestReview(apiKey, input, t.review.replyIn));
    } catch (err) {
      setError(err instanceof ReviewError ? t.review.errors[err.code] : t.review.errors.unknown);
      setBusy(false);
    }
  };

  return (
    <Dialog
      eyebrow={t.review.before}
      title={t.review.title}
      closeLabel={t.cancel}
      onClose={onClose}
      footer={<Button onClick={send} disabled={busy}>{busy ? t.review.sending : t.review.send}</Button>}
    >
      <p className={styles.text}>
        {t.review.willSend}
        {hasHealth && <strong>{t.review.health}</strong>}
      </p>
      <pre className={styles.preview}>{JSON.stringify(input, null, 2)}</pre>
      {busy && <p className={styles.status}>{t.review.wait}</p>}
      {error && <p className={styles.error} role="alert">{error}</p>}
    </Dialog>
  );
}
