// Data shapes shared by the plan logic, storage and the UI.

export type Muscle =
  | "chest" | "front_delt" | "side_delt" | "rear_delt" | "lats" | "upper_back"
  | "biceps" | "triceps" | "quads" | "hamstrings" | "glutes" | "calves" | "abs";

export type Pattern =
  | "horizontal_push" | "incline_push" | "vertical_push" | "chest_fly" | "triceps_ext"
  | "horizontal_pull" | "vertical_pull" | "rear_delt" | "lateral_raise" | "biceps_curl"
  | "squat" | "lunge" | "hinge" | "hip_thrust" | "knee_ext" | "knee_flex" | "calf_raise" | "core";

export type Equipment =
  | "barbell" | "rack" | "bench" | "dumbbell" | "kettlebell" | "cable" | "machine" | "pullup_bar" | "dip_bars" | "bands";

export type Joint = "shoulder" | "elbow" | "wrist" | "lower_back" | "hip" | "knee" | "ankle";
export type Severity = "mild" | "avoid" | "injured";
export type Movement = "overhead" | "deep_knee" | "spinal_load" | "heavy_grip";
export type Goal = "muscle" | "strength" | "fat_loss" | "general";
export type Experience = "beginner" | "intermediate" | "advanced";
export type PriorityGroup = "chest" | "back" | "shoulders" | "arms" | "quads" | "hamstrings" | "glutes" | "calves" | "abs";
export type DayKey = "full_a" | "full_b" | "full_c" | "upper" | "lower" | "push" | "pull" | "legs";
export type Unit = "kg" | "lb";

export interface Exercise {
  id: string;
  order: number;
  name: string;
  sourceName: string | null;
  pattern: Pattern;
  type: "compound" | "isolation";
  muscles: Partial<Record<Muscle, number>>;
  /** Every item is required; "a|b" means either a or b. */
  equipment: string[];
  skill: Experience;
  joints: Partial<Record<Joint, number>>;
  moves: Movement[];
  staple: boolean;
  note: string | null;
  instructions: string[];
}

export interface Answers {
  days: number;
  weekdays: number[];
  minutes: number;
  goal: Goal;
  experience: Experience;
  equipment: Equipment[];
  injuries: Partial<Record<Joint, Severity>>;
  painful: Movement[];
  priorities: PriorityGroup[];
  dislikes: string[];
  age: number | null;
}

/** Input to normalizeAnswers: anything may be missing or loosely typed. */
export type RawAnswers = Partial<Omit<Answers, "weekdays" | "age">> & { weekdays?: number[] | null; age?: number | string | null };

export interface PlanExercise {
  slot: number;
  pattern: Pattern;
  optional: boolean;
  exId: string;
  sets: number;
  reasons: string[];
  reps: [number, number];
  rest: number;
  rir: string;
  /** Joints with a mild limitation that this exercise loads (lighter load, more reps). */
  lighter: Joint[];
}

export interface PlanDay {
  key: DayKey;
  name: string;
  focus: string;
  weekday: number;
  estMinutes: number;
  exercises: PlanExercise[];
}

export interface MuscleTarget {
  target: number;
  floor: number;
  priority: boolean;
}

export interface PlanWarning {
  kind: "volume" | "balance" | "time";
  muscle?: Muscle;
  text: string;
}

export interface ReviewFinding {
  severity: "high" | "medium" | "low" | "info";
  title: string;
  explanation: string;
  suggestion: string;
}

export interface PlanReview {
  summary: string;
  findings: ReviewFinding[];
  model: string;
  at: string;
  status: Record<number, "done" | "ignored">;
}

export interface Plan {
  id: string;
  createdAt: string;
  splitName: string;
  answers: Answers;
  targets: Record<Muscle, MuscleTarget>;
  days: PlanDay[];
  notices: string[];
  weekly: Record<Muscle, number>;
  warnings: PlanWarning[];
  review?: PlanReview;
}

export interface LoggedSet {
  w: number | null;
  r: number | null;
  hurt: boolean;
}

export interface SessionEntry {
  slot: number;
  plannedExId: string;
  exId: string;
  sets: { w: number; r: number; hurt: boolean }[];
}

export interface Session {
  id: string;
  planId: string;
  date: string;
  dayIdx: number;
  dayKey: DayKey;
  dayName: string;
  unit: Unit;
  entries: SessionEntry[];
  note: string;
  savedAt: string;
}

/** The in-progress workout being edited (also stored as a draft). */
export interface WorkoutDraft {
  id: string;
  planId: string;
  date: string;
  dayIdx: number;
  unit: Unit;
  entries: { slot: number; plannedExId: string; exId: string; sets: LoggedSet[] }[];
  note: string;
  saved: boolean;
}

export interface Settings {
  unit: Unit;
  aiEnabled: boolean;
  apiKey: string;
}
