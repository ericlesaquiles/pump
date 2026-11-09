import { useState } from "react";
import { EXERCISES, EXERCISE_BY_ID } from "../../data/exercises.ts";
import { PATTERNS } from "../../lib/constants.ts";
import styles from "./DislikePicker.module.css";

/** Search the exercise list and collect exercises to skip. */
export function DislikePicker({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const hits = q.length < 2 ? [] : EXERCISES
    .filter((x) => !value.includes(x.id) && (x.name.toLowerCase().includes(q) || PATTERNS[x.pattern].label.toLowerCase().includes(q)))
    .slice(0, 12);

  return (
    <div className={styles.picker}>
      <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search exercises, e.g. squat" aria-label="Search exercises to skip" autoComplete="off" />
      {hits.length > 0 && (
        <div className={styles.results}>
          {hits.map((x) => (
            <button key={x.id} type="button" className={styles.result} onClick={() => { onChange([...value, x.id]); setQuery(""); }}>
              {x.name} <span className={styles.muted}>· {PATTERNS[x.pattern].label}</span>
            </button>
          ))}
        </div>
      )}
      {value.length > 0 && (
        <div className={styles.chips}>
          {value.map((id) => {
            const name = EXERCISE_BY_ID.get(id)?.name ?? id;
            return (
              <button key={id} type="button" className={styles.chip} onClick={() => onChange(value.filter((x) => x !== id))} aria-label={`Remove ${name}`}>
                {name} ✕
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
