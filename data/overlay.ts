// Hand-curated overlay on free-exercise-db (public domain text).
//
// Each entry: x(baseId, pattern, muscles, equipment, skill, joints, opts)
//   muscles   – fraction of a set each muscle gets (main 1.0, secondary 0.5)
//   equipment – every item is required; "a|b" means either a or b
//   skill     – beginner | intermediate | advanced (our rating, not the dataset's)
//   joints    – stress per joint 1 (low) .. 3 (high); keys s e w lb h k a
//   opts      – { type: "compound"|"isolation", moves: [...], staple, note, name }
//
// IMPORTANT: joint-stress tags are first-pass estimates written for v1. They
// must be reviewed by a physiotherapist or strength coach before the app is
// shared with anyone (see the design doc, "Injury handling").

import type { Experience, Joint, Movement, Muscle, Pattern } from "../src/lib/types.ts";

const J = { s: "shoulder", e: "elbow", w: "wrist", lb: "lower_back", h: "hip", k: "knee", a: "ankle" } as const satisfies Record<string, Joint>;
type JointKey = keyof typeof J;
type Muscles = Partial<Record<Muscle, number>>;

export interface OverlayEntry {
  id: string;
  pattern: Pattern;
  muscles: Muscles;
  equipment: string[];
  skill: Experience;
  joints: Partial<Record<Joint, number>>;
  type?: "compound" | "isolation";
  moves?: Movement[];
  staple?: boolean;
  note?: string;
  name?: string;
}

type Opts = Pick<OverlayEntry, "type" | "moves" | "staple" | "note" | "name">;

function x(id: string, pattern: Pattern, muscles: Muscles, equipment: string[], skill: Experience, joints: Partial<Record<JointKey, number>> = {}, opts: Opts = {}): OverlayEntry {
  const jointStress: Partial<Record<Joint, number>> = {};
  for (const [k, v] of Object.entries(joints) as [JointKey, number][]) jointStress[J[k]] = v;
  return { id, pattern, muscles, equipment, skill, joints: jointStress, ...opts };
}

const PRESS: Muscles = { chest: 1, front_delt: 0.5, triceps: 0.5 };
const OHP: Muscles = { front_delt: 1, side_delt: 0.5, triceps: 0.5 };
const ROW: Muscles = { upper_back: 1, lats: 0.5, rear_delt: 0.5, biceps: 0.5 };
const PULLDOWN: Muscles = { lats: 1, upper_back: 0.5, biceps: 0.5 };
const SQUAT: Muscles = { quads: 1, glutes: 0.5 };
const HINGE: Muscles = { hamstrings: 1, glutes: 0.5 };
const THRUST: Muscles = { glutes: 1, hamstrings: 0.5 };

export const OVERLAY: OverlayEntry[] = [
  // Horizontal press
  x("Barbell_Bench_Press_-_Medium_Grip", "horizontal_push", PRESS, ["barbell", "bench", "rack"], "beginner", { s: 2, e: 1, w: 1 }, { staple: true, name: "Barbell bench press" }),
  x("Dumbbell_Bench_Press", "horizontal_push", PRESS, ["dumbbell", "bench"], "beginner", { s: 1, e: 1, w: 1 }, { staple: true, name: "Dumbbell bench press" }),
  x("Dumbbell_Bench_Press_with_Neutral_Grip", "horizontal_push", PRESS, ["dumbbell", "bench"], "beginner", { s: 1, e: 1 }, { name: "Neutral-grip dumbbell press" }),
  x("Machine_Bench_Press", "horizontal_push", PRESS, ["machine"], "beginner", { s: 1, e: 1 }, { name: "Machine chest press" }),
  x("Smith_Machine_Bench_Press", "horizontal_push", PRESS, ["machine", "bench"], "beginner", { s: 2, e: 1, w: 1 }, { name: "Smith machine bench press" }),
  x("Pushups", "horizontal_push", PRESS, [], "beginner", { s: 1, w: 2 }, { name: "Push-up" }),
  x("Push-Ups_With_Feet_Elevated", "horizontal_push", PRESS, ["bench"], "beginner", { s: 2, w: 2 }, { name: "Feet-elevated push-up" }),
  x("Bench_Press_-_With_Bands", "horizontal_push", PRESS, ["bands"], "beginner", { s: 1, w: 1 }, { name: "Band chest press" }),
  x("Dips_-_Chest_Version", "horizontal_push", { chest: 1, triceps: 0.5, front_delt: 0.5 }, ["dip_bars"], "intermediate", { s: 3, e: 2, w: 1 }, { name: "Chest dip" }),
  x("Close-Grip_Barbell_Bench_Press", "horizontal_push", { triceps: 1, chest: 0.5, front_delt: 0.5 }, ["barbell", "bench", "rack"], "intermediate", { s: 1, e: 2, w: 2 }, { name: "Close-grip bench press" }),

  // Incline press
  x("Barbell_Incline_Bench_Press_-_Medium_Grip", "incline_push", PRESS, ["barbell", "bench", "rack"], "beginner", { s: 2, e: 1, w: 1 }, { staple: true, name: "Incline barbell press" }),
  x("Incline_Dumbbell_Press", "incline_push", PRESS, ["dumbbell", "bench"], "beginner", { s: 1, e: 1, w: 1 }, { staple: true, name: "Incline dumbbell press" }),
  x("Incline_Dumbbell_Bench_With_Palms_Facing_In", "incline_push", PRESS, ["dumbbell", "bench"], "beginner", { s: 1, e: 1 }, { name: "Neutral-grip incline dumbbell press" }),
  x("Leverage_Incline_Chest_Press", "incline_push", PRESS, ["machine"], "beginner", { s: 1, e: 1 }, { name: "Incline machine press" }),
  x("Smith_Machine_Incline_Bench_Press", "incline_push", PRESS, ["machine", "bench"], "beginner", { s: 2, e: 1, w: 1 }, { name: "Smith machine incline press" }),
  x("Incline_Cable_Chest_Press", "incline_push", PRESS, ["cable", "bench"], "beginner", { s: 1, e: 1 }, { name: "Incline cable press" }),
  x("Incline_Push-Up", "incline_push", PRESS, ["bench"], "beginner", { s: 1, w: 1 }, { name: "Incline push-up (hands on bench)", note: "Easier than a floor push-up; mostly lower chest despite the name." }),

  // Overhead press
  x("Standing_Military_Press", "vertical_push", OHP, ["barbell", "rack"], "intermediate", { s: 3, lb: 2, w: 1 }, { staple: true, moves: ["overhead", "spinal_load"], name: "Standing barbell overhead press" }),
  x("Seated_Barbell_Military_Press", "vertical_push", OHP, ["barbell", "bench", "rack"], "intermediate", { s: 3, w: 1 }, { moves: ["overhead"], name: "Seated barbell overhead press" }),
  x("Dumbbell_Shoulder_Press", "vertical_push", OHP, ["dumbbell", "bench"], "beginner", { s: 2, e: 1 }, { staple: true, moves: ["overhead"], name: "Seated dumbbell shoulder press" }),
  x("Arnold_Dumbbell_Press", "vertical_push", OHP, ["dumbbell", "bench"], "intermediate", { s: 3, e: 1 }, { moves: ["overhead"], name: "Arnold press" }),
  x("Machine_Shoulder_Military_Press", "vertical_push", OHP, ["machine"], "beginner", { s: 2, e: 1 }, { moves: ["overhead"], name: "Machine shoulder press" }),
  x("Shoulder_Press_-_With_Bands", "vertical_push", OHP, ["bands"], "beginner", { s: 2 }, { moves: ["overhead"], name: "Band shoulder press" }),
  x("Two-Arm_Kettlebell_Military_Press", "vertical_push", OHP, ["kettlebell"], "intermediate", { s: 2, w: 1 }, { moves: ["overhead"], name: "Kettlebell overhead press" }),

  // Chest fly
  x("Cable_Crossover", "chest_fly", { chest: 1 }, ["cable"], "beginner", { s: 2 }, { staple: true, name: "Cable fly" }),
  x("Low_Cable_Crossover", "chest_fly", { chest: 1, front_delt: 0.5 }, ["cable"], "beginner", { s: 1 }, { name: "Low-to-high cable fly" }),
  x("Butterfly", "chest_fly", { chest: 1 }, ["machine"], "beginner", { s: 1 }, { name: "Pec deck (machine fly)" }),
  x("Dumbbell_Flyes", "chest_fly", { chest: 1 }, ["dumbbell", "bench"], "beginner", { s: 2, e: 1 }, { name: "Dumbbell fly" }),
  x("Incline_Cable_Flye", "chest_fly", { chest: 1 }, ["cable", "bench"], "intermediate", { s: 2 }, { name: "Incline cable fly" }),

  // Triceps
  x("Triceps_Pushdown", "triceps_ext", { triceps: 1 }, ["cable"], "beginner", { e: 1 }, { staple: true, name: "Cable pushdown" }),
  x("Triceps_Pushdown_-_Rope_Attachment", "triceps_ext", { triceps: 1 }, ["cable"], "beginner", { e: 1 }, { name: "Rope pushdown" }),
  x("Cable_Rope_Overhead_Triceps_Extension", "triceps_ext", { triceps: 1 }, ["cable"], "beginner", { e: 2, s: 2 }, { staple: true, moves: ["overhead"], name: "Overhead cable triceps extension" }),
  x("Standing_Dumbbell_Triceps_Extension", "triceps_ext", { triceps: 1 }, ["dumbbell"], "beginner", { e: 2, s: 2 }, { moves: ["overhead"], name: "Overhead dumbbell triceps extension" }),
  x("EZ-Bar_Skullcrusher", "triceps_ext", { triceps: 1 }, ["barbell", "bench"], "intermediate", { e: 3, w: 1 }, { name: "EZ-bar skull crusher" }),
  x("Tricep_Dumbbell_Kickback", "triceps_ext", { triceps: 1 }, ["dumbbell"], "beginner", { e: 1 }, { name: "Dumbbell kickback" }),
  x("Machine_Triceps_Extension", "triceps_ext", { triceps: 1 }, ["machine"], "beginner", { e: 1 }, { name: "Machine triceps extension" }),
  x("Band_Skull_Crusher", "triceps_ext", { triceps: 1 }, ["bands"], "beginner", { e: 1 }, { name: "Band triceps extension" }),
  x("Dips_-_Triceps_Version", "triceps_ext", { triceps: 1, chest: 0.5, front_delt: 0.5 }, ["dip_bars"], "intermediate", { s: 3, e: 2, w: 1 }, { type: "compound", name: "Triceps dip" }),
  x("Bench_Dips", "triceps_ext", { triceps: 1, front_delt: 0.5 }, ["bench"], "beginner", { s: 3, e: 2, w: 2 }, { type: "compound", name: "Bench dip" }),

  // Rows
  x("Bent_Over_Barbell_Row", "horizontal_pull", ROW, ["barbell"], "intermediate", { lb: 3, e: 1, w: 1 }, { staple: true, moves: ["spinal_load", "heavy_grip"], name: "Barbell row" }),
  x("Seated_Cable_Rows", "horizontal_pull", ROW, ["cable"], "beginner", { e: 1, lb: 1 }, { staple: true, name: "Seated cable row" }),
  x("One-Arm_Dumbbell_Row", "horizontal_pull", ROW, ["dumbbell", "bench"], "beginner", { e: 1, lb: 1 }, { staple: true, name: "Single-arm dumbbell row" }),
  x("Dumbbell_Incline_Row", "horizontal_pull", ROW, ["dumbbell", "bench"], "beginner", { e: 1 }, { name: "Chest-supported dumbbell row" }),
  x("Leverage_Iso_Row", "horizontal_pull", ROW, ["machine"], "beginner", { e: 1 }, { name: "Machine row" }),
  x("T-Bar_Row_with_Handle", "horizontal_pull", ROW, ["barbell"], "intermediate", { lb: 2, e: 1 }, { moves: ["spinal_load", "heavy_grip"], name: "T-bar row" }),
  x("Bent_Over_Two-Dumbbell_Row", "horizontal_pull", ROW, ["dumbbell"], "beginner", { lb: 2, e: 1 }, { name: "Bent-over dumbbell row" }),
  x("Inverted_Row", "horizontal_pull", ROW, ["rack"], "beginner", { s: 1, e: 1 }, { name: "Inverted row", note: "Use a bar set in a rack or a sturdy table edge." }),
  x("Two-Arm_Kettlebell_Row", "horizontal_pull", ROW, ["kettlebell"], "intermediate", { lb: 2, e: 1 }, { name: "Kettlebell row" }),

  // Pulldowns and pull-ups
  x("Wide-Grip_Lat_Pulldown", "vertical_pull", PULLDOWN, ["cable"], "beginner", { s: 1, e: 1 }, { staple: true, name: "Lat pulldown" }),
  x("Close-Grip_Front_Lat_Pulldown", "vertical_pull", PULLDOWN, ["cable"], "beginner", { s: 1, e: 1 }, { name: "Close-grip pulldown" }),
  x("Underhand_Cable_Pulldowns", "vertical_pull", { lats: 1, biceps: 0.5, upper_back: 0.5 }, ["cable"], "beginner", { s: 1, e: 2 }, { name: "Underhand pulldown" }),
  x("Pullups", "vertical_pull", PULLDOWN, ["pullup_bar"], "intermediate", { s: 2, e: 1 }, { staple: true, moves: ["heavy_grip"], name: "Pull-up" }),
  x("Chin-Up", "vertical_pull", { lats: 1, biceps: 0.5, upper_back: 0.5 }, ["pullup_bar"], "intermediate", { s: 1, e: 2 }, { moves: ["heavy_grip"], name: "Chin-up" }),
  x("Band_Assisted_Pull-Up", "vertical_pull", PULLDOWN, ["pullup_bar", "bands"], "beginner", { s: 1, e: 1 }, { moves: ["heavy_grip"], name: "Band-assisted pull-up" }),
  x("One_Arm_Lat_Pulldown", "vertical_pull", PULLDOWN, ["cable"], "beginner", { s: 1, e: 1 }, { name: "Single-arm pulldown" }),
  x("Straight-Arm_Pulldown", "vertical_pull", { lats: 1 }, ["cable"], "beginner", { s: 1 }, { type: "isolation", name: "Straight-arm pulldown" }),

  // Rear delts
  x("Face_Pull", "rear_delt", { rear_delt: 1, upper_back: 0.5 }, ["cable"], "beginner", { s: 1 }, { staple: true, name: "Face pull" }),
  x("Reverse_Machine_Flyes", "rear_delt", { rear_delt: 1, upper_back: 0.5 }, ["machine"], "beginner", { s: 1 }, { name: "Reverse pec deck" }),
  x("Cable_Rear_Delt_Fly", "rear_delt", { rear_delt: 1 }, ["cable"], "beginner", { s: 1 }, { name: "Cable rear-delt fly" }),
  x("Reverse_Flyes", "rear_delt", { rear_delt: 1, upper_back: 0.5 }, ["dumbbell"], "beginner", { s: 1, lb: 1 }, { name: "Bent-over reverse fly" }),
  x("Seated_Bent-Over_Rear_Delt_Raise", "rear_delt", { rear_delt: 1 }, ["dumbbell", "bench"], "beginner", { s: 1 }, { name: "Seated rear-delt raise" }),
  x("Back_Flyes_-_With_Bands", "rear_delt", { rear_delt: 1, upper_back: 0.5 }, ["bands"], "beginner", { s: 1 }, { name: "Band pull-apart / reverse fly" }),

  // Lateral raises
  x("Side_Lateral_Raise", "lateral_raise", { side_delt: 1 }, ["dumbbell"], "beginner", { s: 1 }, { staple: true, name: "Dumbbell lateral raise" }),
  x("Cable_Seated_Lateral_Raise", "lateral_raise", { side_delt: 1 }, ["cable"], "beginner", { s: 1 }, { staple: true, name: "Cable lateral raise" }),
  x("One-Arm_Side_Laterals", "lateral_raise", { side_delt: 1 }, ["dumbbell"], "beginner", { s: 1 }, { name: "Single-arm lateral raise" }),
  x("Lateral_Raise_-_With_Bands", "lateral_raise", { side_delt: 1 }, ["bands"], "beginner", { s: 1 }, { name: "Band lateral raise" }),

  // Biceps
  x("Barbell_Curl", "biceps_curl", { biceps: 1 }, ["barbell"], "beginner", { e: 1, w: 2 }, { name: "Barbell curl" }),
  x("EZ-Bar_Curl", "biceps_curl", { biceps: 1 }, ["barbell"], "beginner", { e: 1, w: 1 }, { staple: true, name: "EZ-bar curl" }),
  x("Dumbbell_Bicep_Curl", "biceps_curl", { biceps: 1 }, ["dumbbell"], "beginner", { e: 1 }, { staple: true, name: "Dumbbell curl" }),
  x("Hammer_Curls", "biceps_curl", { biceps: 1 }, ["dumbbell"], "beginner", { e: 1 }, { name: "Hammer curl" }),
  x("Incline_Dumbbell_Curl", "biceps_curl", { biceps: 1 }, ["dumbbell", "bench"], "beginner", { e: 1, s: 1 }, { staple: true, name: "Incline dumbbell curl" }),
  x("Standing_Biceps_Cable_Curl", "biceps_curl", { biceps: 1 }, ["cable"], "beginner", { e: 1 }, { name: "Cable curl" }),
  x("Cable_Hammer_Curls_-_Rope_Attachment", "biceps_curl", { biceps: 1 }, ["cable"], "beginner", { e: 1 }, { name: "Rope hammer curl" }),
  x("Preacher_Curl", "biceps_curl", { biceps: 1 }, ["barbell", "bench"], "beginner", { e: 2 }, { name: "Preacher curl" }),
  x("Machine_Preacher_Curls", "biceps_curl", { biceps: 1 }, ["machine"], "beginner", { e: 2 }, { name: "Machine preacher curl" }),
  x("Close-Grip_EZ-Bar_Curl_with_Band", "biceps_curl", { biceps: 1 }, ["bands"], "beginner", { e: 1 }, { name: "Band curl" }),

  // Squat pattern
  x("Barbell_Squat", "squat", SQUAT, ["barbell", "rack"], "intermediate", { k: 2, h: 2, lb: 2 }, { staple: true, moves: ["deep_knee", "spinal_load"], name: "Barbell back squat" }),
  x("Front_Barbell_Squat", "squat", SQUAT, ["barbell", "rack"], "advanced", { k: 2, lb: 1, w: 2 }, { moves: ["deep_knee", "spinal_load"], name: "Front squat" }),
  x("Box_Squat", "squat", SQUAT, ["barbell", "rack", "bench"], "intermediate", { k: 1, h: 2, lb: 2 }, { moves: ["spinal_load"], name: "Box squat" }),
  x("Leg_Press", "squat", SQUAT, ["machine"], "beginner", { k: 2, h: 1 }, { staple: true, name: "Leg press" }),
  x("Hack_Squat", "squat", SQUAT, ["machine"], "beginner", { k: 3, h: 1 }, { staple: true, moves: ["deep_knee"], name: "Hack squat" }),
  x("Smith_Machine_Squat", "squat", SQUAT, ["machine"], "beginner", { k: 2, lb: 1 }, { moves: ["deep_knee"], name: "Smith machine squat" }),
  x("Goblet_Squat", "squat", SQUAT, ["dumbbell|kettlebell"], "beginner", { k: 2, h: 1 }, { staple: true, moves: ["deep_knee"], name: "Goblet squat" }),
  x("Dumbbell_Squat", "squat", SQUAT, ["dumbbell"], "beginner", { k: 2, lb: 1 }, { moves: ["deep_knee"], name: "Dumbbell squat" }),
  x("Bodyweight_Squat", "squat", SQUAT, [], "beginner", { k: 1 }, { name: "Bodyweight squat" }),
  x("Squats_-_With_Bands", "squat", SQUAT, ["bands"], "beginner", { k: 1 }, { name: "Band squat" }),

  // Single-leg
  x("Split_Squat_with_Dumbbells", "lunge", SQUAT, ["dumbbell"], "beginner", { k: 2, h: 1, a: 1 }, { staple: true, name: "Dumbbell split squat", note: "Rear foot on a bench turns this into a Bulgarian split squat." }),
  x("Dumbbell_Rear_Lunge", "lunge", { quads: 1, glutes: 1 }, ["dumbbell"], "beginner", { k: 1, h: 1, a: 1 }, { name: "Dumbbell reverse lunge" }),
  x("Dumbbell_Lunges", "lunge", SQUAT, ["dumbbell"], "beginner", { k: 2, a: 1 }, { name: "Dumbbell lunge" }),
  x("Barbell_Lunge", "lunge", SQUAT, ["barbell", "rack"], "intermediate", { k: 2, lb: 1, a: 1 }, { moves: ["spinal_load"], name: "Barbell lunge" }),
  x("Smith_Single-Leg_Split_Squat", "lunge", SQUAT, ["machine"], "beginner", { k: 2, h: 1 }, { name: "Smith machine split squat" }),
  x("Bodyweight_Walking_Lunge", "lunge", SQUAT, [], "beginner", { k: 2, a: 1 }, { name: "Walking lunge" }),

  // Hinge
  x("Romanian_Deadlift", "hinge", HINGE, ["barbell"], "intermediate", { lb: 2, h: 1 }, { staple: true, moves: ["spinal_load", "heavy_grip"], name: "Romanian deadlift" }),
  x("Stiff-Legged_Dumbbell_Deadlift", "hinge", HINGE, ["dumbbell"], "beginner", { lb: 2, h: 1 }, { staple: true, name: "Dumbbell Romanian deadlift" }),
  x("Barbell_Deadlift", "hinge", { glutes: 1, hamstrings: 0.5, quads: 0.5, upper_back: 0.5 }, ["barbell"], "intermediate", { lb: 3, h: 2, k: 1 }, { moves: ["spinal_load", "heavy_grip"], name: "Deadlift" }),
  x("Good_Morning", "hinge", HINGE, ["barbell", "rack"], "advanced", { lb: 3, h: 1 }, { moves: ["spinal_load"], name: "Good morning" }),
  x("Smith_Machine_Stiff-Legged_Deadlift", "hinge", HINGE, ["machine"], "beginner", { lb: 2, h: 1 }, { name: "Smith machine Romanian deadlift" }),
  x("Kettlebell_One-Legged_Deadlift", "hinge", HINGE, ["dumbbell|kettlebell"], "intermediate", { lb: 1, a: 1 }, { name: "Single-leg Romanian deadlift" }),
  x("Hyperextensions_Back_Extensions", "hinge", { glutes: 0.5, hamstrings: 0.5 }, ["machine"], "beginner", { lb: 2 }, { type: "isolation", name: "Back extension" }),
  x("Band_Good_Morning", "hinge", HINGE, ["bands"], "beginner", { lb: 1 }, { name: "Band good morning" }),

  // Hip thrust / glutes
  x("Barbell_Hip_Thrust", "hip_thrust", THRUST, ["barbell", "bench"], "intermediate", { h: 1, lb: 1 }, { staple: true, name: "Barbell hip thrust" }),
  x("Barbell_Glute_Bridge", "hip_thrust", THRUST, ["barbell"], "beginner", { h: 1 }, { name: "Barbell glute bridge" }),
  x("Single_Leg_Glute_Bridge", "hip_thrust", THRUST, [], "beginner", { h: 1 }, { name: "Single-leg glute bridge" }),
  x("One-Legged_Cable_Kickback", "hip_thrust", { glutes: 1 }, ["cable"], "beginner", { h: 1 }, { type: "isolation", name: "Cable glute kickback" }),
  x("Hip_Extension_with_Bands", "hip_thrust", { glutes: 1 }, ["bands"], "beginner", { h: 1 }, { type: "isolation", name: "Band hip extension" }),

  // Leg extension / curl
  x("Leg_Extensions", "knee_ext", { quads: 1 }, ["machine"], "beginner", { k: 2 }, { staple: true, name: "Leg extension" }),
  x("Single-Leg_Leg_Extension", "knee_ext", { quads: 1 }, ["machine"], "beginner", { k: 2 }, { name: "Single-leg leg extension" }),
  x("Lying_Leg_Curls", "knee_flex", { hamstrings: 1 }, ["machine"], "beginner", { k: 1 }, { staple: true, name: "Lying leg curl" }),
  x("Seated_Leg_Curl", "knee_flex", { hamstrings: 1 }, ["machine"], "beginner", { k: 1 }, { staple: true, name: "Seated leg curl" }),
  x("Standing_Leg_Curl", "knee_flex", { hamstrings: 1 }, ["machine"], "beginner", { k: 1 }, { name: "Standing leg curl" }),
  x("Seated_Band_Hamstring_Curl", "knee_flex", { hamstrings: 1 }, ["bands"], "beginner", { k: 1 }, { name: "Band leg curl" }),

  // Calves
  x("Standing_Calf_Raises", "calf_raise", { calves: 1 }, ["machine"], "beginner", { a: 1 }, { staple: true, name: "Standing calf raise" }),
  x("Seated_Calf_Raise", "calf_raise", { calves: 1 }, ["machine"], "beginner", { a: 1, k: 1 }, { staple: true, name: "Seated calf raise" }),
  x("Calf_Press_On_The_Leg_Press_Machine", "calf_raise", { calves: 1 }, ["machine"], "beginner", { a: 1 }, { name: "Leg-press calf raise" }),
  x("Smith_Machine_Calf_Raise", "calf_raise", { calves: 1 }, ["machine"], "beginner", { a: 1 }, { name: "Smith machine calf raise" }),
  x("Standing_Dumbbell_Calf_Raise", "calf_raise", { calves: 1 }, ["dumbbell"], "beginner", { a: 1 }, { name: "Dumbbell calf raise" }),
  x("Calf_Raises_-_With_Bands", "calf_raise", { calves: 1 }, ["bands"], "beginner", { a: 1 }, { name: "Band calf raise" }),

  // Core
  x("Cable_Crunch", "core", { abs: 1 }, ["cable"], "beginner", { lb: 1 }, { staple: true, name: "Cable crunch" }),
  x("Hanging_Leg_Raise", "core", { abs: 1 }, ["pullup_bar"], "intermediate", { s: 1, lb: 1 }, { moves: ["heavy_grip"], name: "Hanging leg raise" }),
  x("Ab_Crunch_Machine", "core", { abs: 1 }, ["machine"], "beginner", { lb: 1 }, { name: "Machine crunch" }),
  x("Pallof_Press", "core", { abs: 1 }, ["cable"], "beginner", {}, { name: "Pallof press" }),
  x("Plank", "core", { abs: 1 }, [], "beginner", { lb: 1, s: 1 }, { name: "Plank", note: "Log seconds held in the reps field." }),
  x("Crunches", "core", { abs: 1 }, [], "beginner", { lb: 1 }, { name: "Crunch" }),
  x("Reverse_Crunch", "core", { abs: 1 }, [], "beginner", { lb: 1 }, { name: "Reverse crunch" }),
  x("Flat_Bench_Lying_Leg_Raise", "core", { abs: 1 }, ["bench"], "beginner", { lb: 1 }, { name: "Lying leg raise" }),
  x("Barbell_Ab_Rollout", "core", { abs: 1 }, ["barbell"], "advanced", { lb: 2, s: 2 }, { name: "Barbell rollout" }),
];
