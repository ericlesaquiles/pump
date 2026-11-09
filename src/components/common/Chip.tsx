import type { ReactNode } from "react";
import { cx } from "../../lib/format.ts";
import styles from "./Chip.module.css";

export type ChipTone = "good" | "warn" | "danger" | "quiet";

export function Chip({ tone = "quiet", children }: { tone?: ChipTone; children: ReactNode }) {
  return <span className={cx(styles.chip, styles[tone])}>{children}</span>;
}
