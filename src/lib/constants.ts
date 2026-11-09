// Shared vocabulary for the plan generator, swapping and the UI.
import type { DayKey, Equipment, Experience, Goal, Joint, Movement, Muscle, Pattern, PriorityGroup } from "./types.ts";

export const MUSCLES: Record<Muscle, string> = {
  chest: "Chest",
  front_delt: "Front delts",
  side_delt: "Side delts",
  rear_delt: "Rear delts",
  lats: "Lats",
  upper_back: "Upper back",
  biceps: "Biceps",
  triceps: "Triceps",
  quads: "Quads",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  calves: "Calves",
  abs: "Abs",
};
export const MUSCLE_KEYS = Object.keys(MUSCLES) as Muscle[];

// Muscle groups the user can prioritize, mapped to the muscles they raise.
export const PRIORITY_GROUPS: Record<PriorityGroup, { label: string; muscles: Muscle[] }> = {
  chest: { label: "Chest", muscles: ["chest"] },
  back: { label: "Back", muscles: ["lats", "upper_back"] },
  shoulders: { label: "Shoulders", muscles: ["side_delt", "rear_delt"] },
  arms: { label: "Arms", muscles: ["biceps", "triceps"] },
  quads: { label: "Quads", muscles: ["quads"] },
  hamstrings: { label: "Hamstrings", muscles: ["hamstrings"] },
  glutes: { label: "Glutes", muscles: ["glutes"] },
  calves: { label: "Calves", muscles: ["calves"] },
  abs: { label: "Abs", muscles: ["abs"] },
};

export interface PatternInfo {
  label: string;
  main: Muscle;
  compound: boolean;
  group: "push" | "pull" | "legs" | "core";
  lower?: boolean;
  related: Pattern[];
}

// Movement patterns. `main` is the muscle a slot of this pattern is for;
// `related` patterns are fallbacks for filling and swapping.
export const PATTERNS: Record<Pattern, PatternInfo> = {
  horizontal_push: { label: "Horizontal press", main: "chest", compound: true, group: "push", related: ["incline_push", "chest_fly"] },
  incline_push: { label: "Incline press", main: "chest", compound: true, group: "push", related: ["horizontal_push", "vertical_push"] },
  vertical_push: { label: "Overhead press", main: "front_delt", compound: true, group: "push", related: ["incline_push"] },
  chest_fly: { label: "Chest fly", main: "chest", compound: false, group: "push", related: ["horizontal_push"] },
  triceps_ext: { label: "Triceps", main: "triceps", compound: false, group: "push", related: [] },
  horizontal_pull: { label: "Row", main: "upper_back", compound: true, group: "pull", related: ["vertical_pull", "rear_delt"] },
  vertical_pull: { label: "Pulldown / pull-up", main: "lats", compound: true, group: "pull", related: ["horizontal_pull"] },
  rear_delt: { label: "Rear delts", main: "rear_delt", compound: false, group: "pull", related: ["horizontal_pull"] },
  lateral_raise: { label: "Lateral raise", main: "side_delt", compound: false, group: "push", related: [] },
  biceps_curl: { label: "Biceps", main: "biceps", compound: false, group: "pull", related: [] },
  squat: { label: "Squat", main: "quads", compound: true, group: "legs", lower: true, related: ["lunge", "knee_ext"] },
  lunge: { label: "Single-leg", main: "quads", compound: true, group: "legs", lower: true, related: ["squat"] },
  hinge: { label: "Hip hinge", main: "hamstrings", compound: true, group: "legs", lower: true, related: ["knee_flex", "hip_thrust"] },
  hip_thrust: { label: "Hip thrust", main: "glutes", compound: true, group: "legs", lower: true, related: ["hinge"] },
  knee_ext: { label: "Leg extension", main: "quads", compound: false, group: "legs", lower: true, related: ["lunge", "squat"] },
  knee_flex: { label: "Leg curl", main: "hamstrings", compound: false, group: "legs", lower: true, related: ["hinge"] },
  calf_raise: { label: "Calves", main: "calves", compound: false, group: "legs", lower: true, related: [] },
  core: { label: "Core", main: "abs", compound: false, group: "core", related: [] },
};

export const EQUIPMENT: Record<Equipment, string> = {
  barbell: "Barbell (and plates)",
  rack: "Squat rack",
  bench: "Bench",
  dumbbell: "Dumbbells",
  kettlebell: "Kettlebells",
  cable: "Cable station",
  machine: "Machines (leg press, chest press, leg curl…)",
  pullup_bar: "Pull-up bar",
  dip_bars: "Dip bars",
  bands: "Resistance bands",
};

export const FULL_GYM: Equipment[] = ["barbell", "rack", "bench", "dumbbell", "cable", "machine", "pullup_bar", "dip_bars"];

export const JOINTS: Record<Joint, string> = {
  shoulder: "Shoulder",
  elbow: "Elbow",
  wrist: "Wrist",
  lower_back: "Lower back",
  hip: "Hip",
  knee: "Knee",
  ankle: "Ankle",
};

export const SEVERITY = {
  none: "No problem",
  mild: "Mild discomfort",
  avoid: "Avoid loading it",
  injured: "Injured / under medical care",
} as const;

export const MOVEMENTS: Record<Movement, string> = {
  overhead: "Overhead pressing",
  deep_knee: "Deep knee bending",
  spinal_load: "Heavy load on the spine",
  heavy_grip: "Hard gripping / hanging",
};

export const GOALS: Record<Goal, string> = {
  muscle: "Build muscle",
  strength: "Get stronger",
  fat_loss: "Lose fat",
  general: "General fitness",
};

export const EXPERIENCE: Record<Experience, string> = {
  beginner: "Beginner (under ~6 months)",
  intermediate: "Intermediate (6 months to 2+ years)",
  advanced: "Advanced (several years)",
};

export const SKILL_RANK: Record<Experience, number> = { beginner: 0, intermediate: 1, advanced: 2 };

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

// Default training weekdays per number of days (0 = Sunday).
export const DEFAULT_WEEKDAYS: Record<number, number[]> = {
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 4, 5, 6],
  6: [1, 2, 3, 4, 5, 6],
};

export interface SlotTemplate { p: Pattern; opt: boolean }
export interface DayTemplate { name: string; focus: string; slots: SlotTemplate[] }

// Slot lists per training day. `opt: true` slots are only used when the
// volume allocator needs them and time allows.
const S = (p: Pattern, opt = false): SlotTemplate => ({ p, opt });

export const DAY_TEMPLATES: Record<DayKey, DayTemplate> = {
  full_a: { name: "Full body A", focus: "Squat, press, pulldown", slots: [S("squat"), S("horizontal_push"), S("vertical_pull"), S("knee_flex"), S("lateral_raise", true), S("triceps_ext", true), S("calf_raise", true)] },
  full_b: { name: "Full body B", focus: "Hinge, incline, row", slots: [S("hinge"), S("incline_push"), S("horizontal_pull"), S("lunge", true), S("biceps_curl", true), S("rear_delt", true), S("core", true)] },
  full_c: { name: "Full body C", focus: "Legs, press, row", slots: [S("squat"), S("vertical_push"), S("horizontal_pull"), S("hip_thrust", true), S("knee_ext", true), S("chest_fly", true), S("biceps_curl", true), S("core", true)] },
  upper: { name: "Upper", focus: "Chest, back, shoulders, arms", slots: [S("horizontal_push"), S("horizontal_pull"), S("vertical_push"), S("vertical_pull"), S("lateral_raise", true), S("biceps_curl", true), S("triceps_ext", true), S("rear_delt", true)] },
  lower: { name: "Lower", focus: "Quads, hamstrings, glutes, calves", slots: [S("squat"), S("hinge"), S("lunge", true), S("knee_flex"), S("knee_ext", true), S("calf_raise"), S("core", true)] },
  push: { name: "Push", focus: "Chest, shoulders, triceps", slots: [S("incline_push"), S("horizontal_push"), S("lateral_raise"), S("vertical_push", true), S("chest_fly", true), S("triceps_ext")] },
  pull: { name: "Pull", focus: "Back, rear delts, biceps", slots: [S("vertical_pull"), S("horizontal_pull"), S("horizontal_pull", true), S("rear_delt"), S("biceps_curl"), S("biceps_curl", true)] },
  legs: { name: "Legs", focus: "Quads, hamstrings, glutes, calves", slots: [S("squat"), S("hinge"), S("lunge", true), S("hip_thrust", true), S("knee_ext", true), S("knee_flex"), S("calf_raise"), S("core", true)] },
};

export const SPLITS: Record<number, { name: string; days: DayKey[] }> = {
  2: { name: "Full body", days: ["full_a", "full_b"] },
  3: { name: "Full body", days: ["full_a", "full_b", "full_c"] },
  4: { name: "Upper / Lower", days: ["upper", "lower", "upper", "lower"] },
  5: { name: "Upper / Lower / Push / Pull / Legs", days: ["upper", "lower", "push", "pull", "legs"] },
  6: { name: "Push / Pull / Legs ×2", days: ["push", "pull", "legs", "push", "pull", "legs"] },
};

export interface Prescription { first: [number, number]; compound: [number, number]; isolation: [number, number]; restC: number; restI: number }

// Reps and rest by goal. `first` applies to the first compound lift of a day.
export const PRESCRIPTION: Record<Goal, Prescription> = {
  muscle: { first: [5, 8], compound: [6, 10], isolation: [10, 15], restC: 150, restI: 75 },
  strength: { first: [3, 5], compound: [4, 6], isolation: [8, 12], restC: 210, restI: 90 },
  fat_loss: { first: [6, 10], compound: [6, 12], isolation: [12, 15], restC: 105, restI: 60 },
  general: { first: [6, 10], compound: [8, 12], isolation: [12, 15], restC: 105, restI: 60 },
};

export const BASE_WEEKLY_SETS: Record<Experience, number> = { beginner: 9, intermediate: 13, advanced: 16 };
