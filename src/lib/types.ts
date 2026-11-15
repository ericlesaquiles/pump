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
export type Lang = "en" | "pt";

/** Why an exercise can't be used (see exclusionReason). */
export type Why =
  | { k: "dislike" }
  | { k: "injured"; joint: Joint }
  | { k: "avoid"; joint: Joint }
  | { k: "move"; move: Movement }
  | { k: "skill" }
  | { k: "equipment" };

/**
 * A sentence stored in a plan as data, so it can be shown in any language.
 * `day` is a workout's index in the plan (0 = Workout A); `ex` is an exercise id.
 */
export type Msg =
  | { k: "reason.fallback"; want: Pattern; got: Pattern }
  | { k: "reason.slot"; pattern: Pattern; staple: boolean }
  | { k: "reason.insteadOf"; ex: string; why: Why }
  | { k: "reason.lighter"; joints: Joint[] }
  | { k: "reason.swapped"; ex: string }
  | { k: "reason.replacedSkipped"; ex: string }
  | { k: "notice.injured"; joint: Joint }
  | { k: "notice.slotMissing"; day: number; key: DayKey; pattern: Pattern }
  | { k: "notice.dayEmpty"; days: number[]; key: DayKey }
  | { k: "warn.volume"; muscle: Muscle; sets: number; floor: number }
  | { k: "warn.pushPull"; push: number; pull: number }
  | { k: "warn.hamQuad"; h: number; q: number }
  | { k: "warn.time"; day: number; key: DayKey; minutes: number; limit: number }
  | { k: "warn.full" };

/** Plans saved before version 2 hold plain English strings instead of messages. */
export type Text = string | Msg;

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
export type RawAnswers = Partial<Omit<Answers, "age">> & { age?: number | string | null };

export interface PlanExercise {
  slot: number;
  pattern: Pattern;
  optional: boolean;
  exId: string;
  sets: number;
  reasons: Text[];
  reps: [number, number];
  rest: number;
  rir: "iso" | "compound";
  /** Joints with a mild limitation that this exercise loads (lighter load, more reps). */
  lighter: Joint[];
}

export interface PlanDay {
  key: DayKey;
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
  msg: Msg;
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
  /** Data format; 2 = messages instead of text, workouts in rotation. Older plans are migrated on load. */
  v?: 2;
  id: string;
  createdAt: string;
  answers: Answers;
  targets: Record<Muscle, MuscleTarget>;
  days: PlanDay[];
  notices: Text[];
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
  /** Only in workouts saved by older versions. */
  dayName?: string;
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
  lang: Lang;
  unit: Unit;
  aiEnabled: boolean;
  apiKey: string;
}
