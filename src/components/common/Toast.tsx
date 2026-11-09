import styles from "./Toast.module.css";

export function Toast({ message }: { message: string | null }) {
  return (
    <div className={styles.toast} role="status" aria-live="polite" hidden={!message}>
      {message}
    </div>
  );
}
