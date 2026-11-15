import { useMemo } from "react";
import { EXERCISE_BY_ID } from "../data/exercises.ts";
import { DICTS, textOf } from "../i18n/index.ts";
import { exerciseText, type LocalExercise } from "../i18n/exercises.ts";
import { fmtDate, fmtNum } from "../lib/format.ts";
import type { Lang, Text } from "../lib/types.ts";
import { useAppState } from "./useAppState.tsx";

export function i18nFor(lang: Lang) {
  const t = DICTS[lang];
  return {
    lang,
    t,
    /** Exercise name, note and instructions in this language (null for unknown ids). */
    ex: (id: string): LocalExercise | null => {
      const e = EXERCISE_BY_ID.get(id);
      return e ? exerciseText(e, lang) : null;
    },
    exName: (id: string): string => {
      const e = EXERCISE_BY_ID.get(id);
      return e ? exerciseText(e, lang).name : id;
    },
    date: (iso: string) => fmtDate(iso, t.locale),
    num: (n: number) => fmtNum(n, t.locale),
    text: (x: Text) => textOf(t, x),
  };
}

export type I18n = ReturnType<typeof i18nFor>;

/** Text and formatting in the language chosen in Settings. */
export function useI18n(): I18n {
  const { settings } = useAppState();
  return useMemo(() => i18nFor(settings.lang), [settings.lang]);
}
