import { useState } from "react";
import { EXERCISES } from "../../data/exercises.ts";
import { useI18n } from "../../hooks/useI18n.ts";
import styles from "./DislikePicker.module.css";

/** Lowercase without accents, so "rosca" matches "Rosca" and "flexao" matches "Flexão". */
const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Search the exercise list and collect exercises to skip. */
export function DislikePicker({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
  const { t, exName } = useI18n();
  const [query, setQuery] = useState("");
  const q = fold(query.trim());
  const hits = q.length < 2 ? [] : EXERCISES
    .filter((x) => !value.includes(x.id) && [exName(x.id), x.name, t.patterns[x.pattern]].some((s) => fold(s).includes(q)))
    .slice(0, 12);

  return (
    <div className={styles.picker}>
      <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.setup.search} aria-label={t.setup.searchLabel} autoComplete="off" />
      {hits.length > 0 && (
        <div className={styles.results}>
          {hits.map((x) => (
            <button key={x.id} type="button" className={styles.result} onClick={() => { onChange([...value, x.id]); setQuery(""); }}>
              {exName(x.id)} <span className={styles.muted}>· {t.patterns[x.pattern]}</span>
            </button>
          ))}
        </div>
      )}
      {value.length > 0 && (
        <div className={styles.chips}>
          {value.map((id) => {
            const name = exName(id);
            return (
              <button key={id} type="button" className={styles.chip} onClick={() => onChange(value.filter((x) => x !== id))} aria-label={t.setup.remove(name)}>
                {name} ✕
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
