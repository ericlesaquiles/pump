import type { DayKey } from "../../lib/types.ts";
import styles from "./Plate.module.css";

/** A small bumper-plate ring in the training day's colour. */
export function Plate({ day }: { day: DayKey | null }) {
  return <span className={styles.plate} data-day={day ?? "none"} aria-hidden="true" />;
}
