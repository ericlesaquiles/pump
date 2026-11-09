import type { ReactNode } from "react";
import { cx } from "../../lib/format.ts";
import styles from "./Callout.module.css";

interface Props {
  tone?: "warn" | "danger" | "info";
  title?: string;
  items?: string[];
  children?: ReactNode;
  small?: boolean;
}

/** A tinted box for notices and warnings, optionally with a bullet list. */
export function Callout({ tone = "info", title, items, children, small }: Props) {
  return (
    <div className={cx(styles.callout, styles[tone], small && styles.small)} role={tone === "info" ? undefined : "note"}>
      {title && <strong>{title}</strong>}
      {items && items.length > 0 && (
        <ul className={styles.list}>
          {items.map((t) => <li key={t}>{t}</li>)}
        </ul>
      )}
      {children}
    </div>
  );
}
