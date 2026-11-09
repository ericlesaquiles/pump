import type { ReactNode } from "react";
import styles from "./Panel.module.css";

/** A bordered card with an optional small uppercase label. */
export function Panel({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <section className={styles.panel}>
      {label && <div className={styles.label}>{label}</div>}
      {children}
    </section>
  );
}
