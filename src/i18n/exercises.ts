// Exercise names, notes and instructions in the user's language.
// English comes from exercises.json; Portuguese from exercises.pt.json, falling back to English.
import { EXERCISE_BY_ID } from "../data/exercises.ts";
import ptData from "../data/exercises.pt.json";
import type { Exercise, Lang } from "../lib/types.ts";

interface ExerciseText { name: string; note?: string; instructions?: string[] }

const PT = ptData as Record<string, ExerciseText | undefined>;

export interface LocalExercise { name: string; note: string | null; instructions: string[] }

export function exerciseText(ex: Exercise, lang: Lang): LocalExercise {
  const tr = lang === "pt" ? PT[ex.id] : undefined;
  return {
    name: tr?.name ?? ex.name,
    note: tr?.note ?? ex.note,
    instructions: tr?.instructions ?? ex.instructions,
  };
}

export const exNamePt = (id: string): string => PT[id]?.name ?? EXERCISE_BY_ID.get(id)?.name ?? id;
