import type { ReactNode } from "react";
import styles from "./Question.module.css";

/** One numbered question card in the questionnaire. */
export function Question({ title, hint, children }: { title: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <fieldset className={styles.q}>
      <legend className={styles.legend}>{title}</legend>
      {hint && <p className={styles.hint}>{hint}</p>}
      {children}
    </fieldset>
  );
}

export function Hint({ children }: { children: ReactNode }) {
  return <p className={styles.hint}>{children}</p>;
}
