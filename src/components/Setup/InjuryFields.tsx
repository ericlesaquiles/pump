import { JOINTS, SEVERITY } from "../../lib/constants.ts";
import type { Answers, Joint, Severity } from "../../lib/types.ts";
import styles from "./InjuryFields.module.css";

interface Props {
  value: Answers["injuries"];
  onChange: (value: Answers["injuries"]) => void;
}

/** One severity dropdown per joint. */
export function InjuryFields({ value, onChange }: Props) {
  const set = (joint: Joint, sev: string) => {
    const next = { ...value };
    if (sev === "none") delete next[joint];
    else next[joint] = sev as Severity;
    onChange(next);
  };
  return (
    <div className={styles.grid}>
      {(Object.keys(JOINTS) as Joint[]).map((j) => (
        <label key={j} className={styles.field}>
          {JOINTS[j]}
          <select value={value[j] ?? "none"} onChange={(e) => set(j, e.target.value)}>
            {Object.entries(SEVERITY).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
        </label>
      ))}
    </div>
  );
}
