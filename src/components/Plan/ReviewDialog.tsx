import { useState } from "react";
import { requestReview, type ReviewInput, type ReviewResult } from "../../lib/review.ts";
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasHealth = input.person.limitations.length > 0 || input.person.painfulMovements.length > 0;

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      onDone(await requestReview(apiKey, input));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong while requesting the review.");
      setBusy(false);
    }
  };

  return (
    <Dialog
      eyebrow="Before sending"
      title="AI review"
      closeLabel="Cancel"
      onClose={onClose}
      footer={<Button onClick={send} disabled={busy}>{busy ? "Reviewing…" : "Send for review"}</Button>}
    >
      <p className={styles.text}>
        Pump will send the text below to Anthropic's Claude API with your API key. Nothing else is sent.
        {hasHealth && <strong> It includes your injury and pain answers.</strong>}
      </p>
      <pre className={styles.preview}>{JSON.stringify(input, null, 2)}</pre>
      {busy && <p className={styles.status}>Reviewing… this can take up to a minute.</p>}
      {error && <p className={styles.error} role="alert">{error}</p>}
    </Dialog>
  );
}
