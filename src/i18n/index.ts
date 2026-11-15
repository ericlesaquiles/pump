// Language selection and helpers shared by the UI and the AI review.
import type { Lang, Text } from "../lib/types.ts";
import { en, type Dict } from "./en.ts";
import { pt } from "./pt.ts";

export type { Dict };
export const DICTS: Record<Lang, Dict> = { en, pt };
export const LANGS: Lang[] = ["pt", "en"];

/** Portuguese if the phone or browser is set to any Portuguese, otherwise English. */
export function detectLang(): Lang {
  try {
    const tags = navigator.languages?.length ? navigator.languages : [navigator.language];
    return tags[0]?.toLowerCase().startsWith("pt") ? "pt" : "en";
  } catch {
    return "en";
  }
}

/** A stored plan sentence in the given language (old plans hold English strings). */
export const textOf = (t: Dict, x: Text): string => (typeof x === "string" ? x : t.msg(x));
