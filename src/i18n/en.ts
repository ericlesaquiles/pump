// English text. pt.ts must have the same shape (checked by the compiler via `Dict`).
import { EXERCISE_BY_ID } from "../data/exercises.ts";
import { DAY_TEMPLATES, EQUIPMENT, EXPERIENCE, GOALS, JOINTS, MOVEMENTS, MUSCLES, PATTERNS, PRIORITY_GROUPS, SEVERITY, SPLITS } from "../lib/constants.ts";
import type { DayKey, Equipment, Joint, Msg, Pattern, PriorityGroup, Severity, Why } from "../lib/types.ts";
import type { CueKind } from "../lib/progression.ts";
import type { ReviewErrorCode } from "../lib/review.ts";
import type { EquipmentNeed, QuickFilter, SwapReason } from "../lib/swap.ts";

const map = <K extends string, V, R>(o: Record<K, V>, f: (v: V) => R) =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => [k, f(v as V)])) as Record<K, R>;
const lc = (s: string) => s.toLowerCase();
const and = (items: string[]) => new Intl.ListFormat("en", { type: "conjunction" }).format(items);
const or = (items: string[]) => new Intl.ListFormat("en", { type: "disjunction" }).format(items);
const letter = (i: number) => String.fromCharCode(65 + i);
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

const days = map(DAY_TEMPLATES, (t) => ({ name: t.name, focus: t.focus }));
const workoutFull = (i: number, key: DayKey) => `Workout ${letter(i)} · ${days[key].name}`;
const workoutParen = (i: number, key: DayKey) => `Workout ${letter(i)} (${days[key].name})`;

const EQUIP_WORDS: Record<Equipment, string> = {
  barbell: "a barbell", dumbbell: "dumbbells", cable: "a cable", machine: "a machine", bands: "bands",
  kettlebell: "a kettlebell", pullup_bar: "a pull-up bar", dip_bars: "dip bars", bench: "a bench", rack: "a rack",
};

const why = (w: Why): string => {
  switch (w.k) {
    case "dislike": return "it's on your skip list";
    case "injured": return `it loads your injured ${lc(JOINTS[w.joint])}`;
    case "avoid": return `it loads your ${lc(JOINTS[w.joint])}`;
    case "move": return `it involves ${lc(MOVEMENTS[w.move])}`;
    case "skill": return "it needs more experience";
    case "equipment": return "it needs equipment you don't have";
  }
};

const joints = (js: Joint[]) => and(js.map((j) => lc(JOINTS[j])));

export const en = {
  locale: "en-US",
  langName: "English",

  // ---------- vocabulary ----------
  muscles: MUSCLES,
  joints: JOINTS,
  severity: SEVERITY as Record<Severity | "none", string>,
  movements: MOVEMENTS,
  goals: GOALS,
  experience: EXPERIENCE,
  equipment: EQUIPMENT,
  priorities: map(PRIORITY_GROUPS, (p) => p.label) as Record<PriorityGroup, string>,
  patterns: map(PATTERNS, (p) => p.label) as Record<Pattern, string>,
  days,
  splits: map(SPLITS, (s) => s.name) as Record<number, string>,
  skill: { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" },
  exType: { compound: "compound", isolation: "isolation" },
  stress: { 1: "low", 2: "medium", 3: "high" } as Record<number, string>,
  workoutFull,
  rir: { compound: "1–2 reps in reserve", iso: "1–2 reps in reserve; last set may go to failure" },

  // ---------- messages stored in plans ----------
  msg: (m: Msg): string => {
    switch (m.k) {
      case "reason.fallback": return `No ${lc(PATTERNS[m.want].label)} exercise fits your equipment or limits, so this uses a ${lc(PATTERNS[m.got].label)} instead.`;
      case "reason.slot": return `${PATTERNS[m.pattern].label} slot for ${lc(MUSCLES[PATTERNS[m.pattern].main])}${m.staple ? "; a well-proven staple" : ""}.`;
      case "reason.insteadOf": return `Instead of ${en.ex(m.ex)}: ${why(m.why)}.`;
      case "reason.lighter": return `Lighter load and 3 more reps per set to go easy on your ${joints(m.joints)}.`;
      case "reason.swapped": return `Swapped in by you (replaced ${en.ex(m.ex)}).`;
      case "reason.replacedSkipped": return `Replaced ${en.ex(m.ex)}, which you chose to skip.`;
      case "notice.injured": return `Your ${lc(JOINTS[m.joint])} is marked as injured, so every exercise that loads it is left out. Get this plan checked by a physio or doctor before training that area.`;
      case "notice.slotMissing": return `${workoutParen(m.day, m.key)}: no ${lc(PATTERNS[m.pattern].label)} exercise fits your equipment and limits, so that slot is left out.`;
      case "notice.dayEmpty": return `${m.days.length > 1 ? `Workouts ${and(m.days.map(letter))} (${days[m.key].name}) have` : `${workoutParen(m.days[0] ?? 0, m.key)} has`} no exercises that fit your equipment and limits. Adding a pull-up bar, resistance bands or dumbbells would fill ${m.days.length > 1 ? "them" : "it"}.`;
      case "warn.volume": return `${MUSCLES[m.muscle]}: ${m.sets} sets a week, below the minimum of ${m.floor}.`;
      case "warn.pushPull": return `Pushing (${m.push} sets) outweighs pulling (${m.pull} sets). Aim for at least as much pulling.`;
      case "warn.hamQuad": return `Hamstrings (${m.h} sets) get less than half the work of quads (${m.q} sets).`;
      case "warn.time": return `${workoutParen(m.day, m.key)} takes about ${m.minutes} min, over your ${m.limit} min.`;
      case "warn.full": return "Every session is already full, which is why several muscles fall short. Longer sessions or one more training day would cover them.";
    }
  },
  /** Exercise name by id. */
  ex: (id: string): string => EXERCISE_BY_ID.get(id)?.name ?? id,

  // ---------- layout ----------
  nav: { plan: "Plan", log: "Workout", history: "History", settings: "Settings", home: "Pump home", main: "Main", offline: "Offline" },
  close: "Close",
  cancel: "Cancel",

  // ---------- questionnaire ----------
  setup: {
    eyebrowEdit: "Edit your answers",
    eyebrowNew: "About two minutes",
    titleEdit: "Your answers",
    titleNew: "Build your plan",
    backToPlan: "Back to plan",
    keepsWorkouts: "Saving builds a new plan. Your logged workouts are kept.",
    planReady: "Plan ready",
    q1: "1. Workouts per week",
    perWeek: (n: number) => `${n}×`,
    split: (name: string) => `Split: ${name}. Each muscle is trained about twice a week.`,
    rotation: "Workouts aren't tied to weekdays: you do them in order (A, B, C…) on whichever days suit you, and the app suggests the next one.",
    q2: "2. Session length",
    q3: "3. Main goal",
    q4: "4. Experience",
    q4hint: "How long have you trained consistently, at least twice a week?",
    q5: "5. Equipment you can use",
    presets: { gym: "Full gym", db: "Dumbbells and bench", none: "Bodyweight only" },
    q6: "6. Injuries or limitations",
    q6hint: "Pump only avoids or eases exercises. It can't diagnose anything. If a joint is currently injured, check with a physio or doctor before training it.",
    hurts: "Movements that hurt:",
    q7: "7. Muscles to prioritize",
    q7hint: "Up to 3. They get about 40% more weekly sets; the rest get a little less.",
    q8: "8. Exercises to skip (optional)",
    q9: "9. Age (optional)",
    q9hint: "From about 50, weekly sets are a little lower to allow more recovery.",
    age: "Age",
    submitEdit: "Save and rebuild plan",
    submitNew: "Build my plan",
    search: "Search exercises, e.g. squat",
    searchLabel: "Search exercises to skip",
    remove: (name: string) => `Remove ${name}`,
  },

  // ---------- plan ----------
  plan: {
    eyebrow: (split: string, days: number, minutes: number, goal: string) => `${split} · ${days}× a week · ${minutes} min · ${goal}`,
    title: "Your plan",
    editAnswers: "Edit answers",
    rebuild: "Rebuild plan",
    rebuilt: "Plan rebuilt",
    warningsTitle: "Things to know about this plan",
    weeklySets: "Weekly sets per muscle",
    weeklyNote: "Green: sets saved this week (Monday to Sunday). Pale bar: the plan's sets. Numbers: done · planned/target. Main muscle counts 1 set, secondary muscles ½.",
    swappedIn: (name: string) => `Swapped in ${name}`,
    thisWeek: "This week",
    weekCount: (done: number, goal: number) => `${done} of ${goal} workouts`,
    upNext: "Up next",
    startWorkout: (l: string) => `Start workout ${l}`,
    start: "Start workout",
    next: "next",
    about: (focus: string, min: number) => `${focus} · about ${min} min`,
    emptyDay: "No exercises fit your equipment and limits for this workout.",
    showExercises: (n: number) => `Show the ${n} exercises`,
    hideExercises: "Hide exercises",
    rest: "rest",
    lighter: "lighter load",
    swap: "Swap",
    why: "Why this exercise?",
    progressTitle: "How to progress",
    progressTips: [
      "When every set reaches the top of the rep range, add weight next time: about 2.5 kg / 5 lb for upper body, 5 kg / 10 lb for lower body.",
      "Otherwise keep the weight and beat your reps.",
      "Every 6–8 weeks, or after two weeks without progress, take a lighter week with about half the sets.",
    ],
    chartLabel: "Weekly sets per muscle compared with targets",
    chartRow: (muscle: string, v: number, target: number, floor: number, done: number) => `${muscle}: ${done} sets logged this week; the plan has ${v} a week, target ${target}, minimum ${floor}`,
    legend: { done: "done this week", sets: "planned", target: "target", floor: "minimum", priority: "priority" },
  },

  // ---------- AI review ----------
  review: {
    panel: "AI review (optional)",
    suggestion: "Suggestion:",
    severity: { high: "high", medium: "medium", low: "low", info: "info" },
    done: "Done",
    ignored: "Ignored",
    undo: "Undo",
    markDone: "Mark done",
    ignore: "Ignore",
    meta: (date: string, model: string) => `Reviewed ${date} by ${model}. Suggestions are not applied automatically; use Swap to make changes.`,
    introAi: "Ask Claude to check this plan for balance, volume, injuries and exercise choice. You'll see exactly what is sent first.",
    introOff: "You can ask an AI to check this plan. Turn it on in Settings, or copy a prompt to paste into any chatbot.",
    again: "Review again",
    get: "Get AI review",
    turnOn: "Turn on in Settings",
    copy: "Copy review prompt",
    copied: "Review prompt copied",
    offline: "You're offline. The review needs internet.",
    ready: "Review ready",
    promptTitle: "Review prompt",
    promptHint: "Copy this text and paste it into any chatbot.",
    before: "Before sending",
    title: "AI review",
    send: "Send for review",
    sending: "Reviewing…",
    willSend: "Pump will send the text below to Anthropic's Claude API with your API key. Nothing else is sent.",
    health: " It includes your injury and pain answers.",
    wait: "Reviewing… this can take up to a minute.",
    errors: {
      offline: "You're offline. Use “Copy review prompt” instead, or try again when connected.",
      sdk: "Couldn't load the review module. Reload the app and try again.",
      auth: "The API key was rejected, or it isn't allowed to use this model. Check it in Settings.",
      rate: "Too many requests right now. Wait a minute and try again.",
      request: "The review request was rejected.",
      network: "Couldn't reach the Claude API. Check your connection.",
      api: "The Claude API returned an error. Try again later.",
      unknown: "Something went wrong while requesting the review.",
      refusal: "The model declined to review this plan.",
      truncated: "The review was cut off. Try again.",
      parse: "The review came back in an unexpected format. Try again.",
    } satisfies Record<ReviewErrorCode, string>,
    /** Added to the system prompt so the reply comes back in this language ("" = English). */
    replyIn: "",
  },

  // ---------- exercise dialogs ----------
  exercise: {
    main: "main",
    none: "None",
    lowOverall: "Low overall",
    muscles: "Muscles",
    equipment: "Equipment",
    joints: "Joint stress",
    how: "How to do it",
    topSet: "Your top set over time",
    video: "Find a video on YouTube",
    videoQuery: "exercise technique",
    needsNet: "(needs internet)",
    credit: "Instructions from free-exercise-db (public domain). Exercise tags by Pump.",
    gifAlt: (name: string) => `Animation of ${name}`,
    or: (items: string[]) => or(items),
    sparkSingle: (date: string, w: string, unit: string) => `${date}: ${w} ${unit}`,
    sparkLabel: (from: string, to: string, unit: string) => `Top set from ${from} to ${to} ${unit}`,
  },
  swap: {
    tiers: { 1: "Same movement", 2: "Same muscle, different movement", 3: "Shifts the work to other muscles" } as Record<1 | 2 | 3, string>,
    filters: { all: "All", dumbbells: "Dumbbells only", no_bench: "No bench", machines: "Machines and cables" } as Record<QuickFilter | "all", string>,
    filter: "Filter",
    todayEyebrow: "Swap for this workout only",
    planEyebrow: "Swap exercise",
    useToday: "Use for today",
    swap: "Swap",
    listLabel: "Replacement exercise",
    nothing: "Nothing fits this slot with that filter. Try another filter.",
    weeklySets: "Weekly sets: ",
    same: "Weekly sets per muscle stay the same.",
    drop: (muscle: string, after: string, floor: number) => `${muscle} would drop to ${after} sets a week, below the minimum of ${floor}.`,
    dropHint: "You can add a set elsewhere or pick another option.",
    scope: "Swap scope",
    scopePlan: "Rest of the plan",
    scopeNever: (name: string) => `Never suggest ${name} again`,
    todayNote: "Your plan stays the same. The log records what you actually did.",
    reason: (r: SwapReason): string => {
      const equip = (e: EquipmentNeed) => e.kind === "none" ? "needs no equipment" : e.kind === "bench" ? "uses a bench" : `uses ${or(e.items.map((x) => EQUIP_WORDS[x]))}`;
      const parts = [
        r.tier === 1 ? `Same movement, ${equip(r.equipment)}` : r.tier === 2 ? `Different movement (${lc(PATTERNS[r.pattern].label)}), same main muscle` : `Trains ${lc(MUSCLES[r.main])} less directly`,
      ];
      if (r.easier.length) parts.push(`easier on your ${joints(r.easier)}`);
      if (r.more) parts.push(`more ${lc(MUSCLES[r.more])} work`);
      return parts.join("; ");
    },
  },

  // ---------- workout ----------
  workout: {
    eyebrow: "Workout",
    pick: "Workout",
    date: "Date",
    option: (l: string, name: string, next: boolean) => `${l} · ${name}${next ? " (next)" : ""}`,
    empty: "This workout has no exercises. Pick another one.",
    notes: "Notes",
    notesHint: "Sleep, energy, anything that felt off",
    save: "Save workout",
    update: "Update workout",
    saved: "Saved.",
    savedToast: "Workout saved",
    draft: "Unsaved changes are kept on this device as a draft.",
    needReps: "Nothing to save yet: enter reps for a set, or press Done on an exercise.",
    insteadOf: (name: string) => `today instead of ${name}`,
    rest: (time: string) => `Rest ${time}`,
    swap: "Swap",
    last: (date: string, sets: string) => `Last (${date}): ${sets}`,
    noPrevious: "No previous sets",
    addSet: "+ Add a set",
    details: "Details",
    skip: "Skip",
    done: "Done",
    doneLabel: "Done",
    skippedLabel: "Skipped this time · tap to reopen",
    reopen: (name: string) => `Reopen ${name}`,
    prefilled: "Filled in with last time's values. Change what's different, then press Done.",
    saveHint: "Exercises you marked Done or changed are saved; skipped ones and untouched pre-filled ones aren't.",
    cue: (kind: CueKind, c: { reps?: number; step?: number; unit?: string }): string => ({
      first: `No history yet. Start light and find a weight you can lift for ${c.reps} reps with 2 to spare.`,
      add: `Add ${c.step} ${c.unit}`,
      hold: "Same weight, beat your reps",
      stall: "Stalled for 2+ weeks: consider a lighter week or swapping this exercise",
    })[kind],
    reps: "reps",
    hurt: "Hurt",
    setWeight: (name: string, n: number) => `${name} set ${n} weight`,
    setReps: (name: string, n: number) => `${name} set ${n} reps`,
    hurtTitle: (names: string[]) => `You marked pain during ${and(names)}.`,
    hurtText: "If it keeps hurting, swap the exercise or add a limitation so the plan avoids it. See a physio or doctor if pain persists.",
    hurtSwap: (name: string) => `Swap ${name} in the plan`,
    addLimitation: "Add a limitation",
    dismiss: "Dismiss",
    restLabel: "Rest",
    restOver: "Rest over",
    timerDone: "Done",
    notifTitle: "Rest over",
    notifBody: "Time for your next set.",
  },

  // ---------- history ----------
  history: {
    title: "History",
    logged: (n: number) => `${plural(n, "workout", "workouts")} logged`,
    workouts: "Workouts",
    deleted: "Workout deleted",
    empty: "No workouts yet. Open the Workout tab, fill in your sets and press Save; they'll show up here.",
    meta: (sets: number, volume: string, unit: string) => `${plural(sets, "set", "sets")} · ${volume} ${unit} lifted`,
    delete: "Delete",
    confirm: "Confirm delete",
    earlier: (date: string) => `${date} · from an earlier plan`,
    progress: "Progress by exercise",
    exercise: "Exercise",
    noCharts: "Charts appear once you've logged an exercise.",
    calendar: "Training days",
    inMonth: (n: number) => plural(n, "workout", "workouts"),
    prevMonth: "Previous month",
    nextMonth: "Next month",
    dayLabel: (date: string, letters: string) => `${date}: workout ${letters}`,
    backup: "Backup",
    backupText: "Your data lives only on this device. Export a backup file now and then. API keys are not included.",
    export: "Export backup",
    import: "Import backup",
    imported: "Backup imported",
    badJson: "That file isn't valid JSON.",
    notBackup: "That file isn't a Pump backup.",
    importFailed: "Couldn't import that file.",
    exportFailed: "Couldn't export the backup. Try again.",
    shareTitle: "Pump backup",
    shareDialog: "Save your Pump backup",
  },

  // ---------- ask Claude (context shared to the Claude app) ----------
  ask: {
    button: "Ask Claude",
    aboutExercise: "Ask Claude about this exercise",
    aboutWorkout: "Ask Claude about this workout",
    panel: "Ask Claude",
    hint: "Opens your phone's share menu with your plan and recent training as text. Pick the Claude app, then type your question after it. Uses your Claude subscription; Pump sends nothing itself.",
    shareTitle: "Ask Claude",
    copied: "Context copied. Paste it into Claude and add your question.",
    failed: "Couldn't open the share menu.",
    intro: "I use a strength-training app called Pump. Here's my context from it; please take it into account in your answer.",
    me: "About me",
    goal: "Goal",
    experience: "Experience",
    schedule: (days: number, min: number) => `${days} workouts a week, about ${min} min each, done in rotation (A, B, C…) on whichever days suit me`,
    equipment: "Equipment",
    limits: "Injuries or limitations",
    hurts: "Movements that hurt",
    priorities: "Muscles I prioritize",
    age: "Age",
    recent: (n: number) => `Workouts logged in the last 4 weeks: ${n}`,
    none: "none",
    plan: (split: string) => `My current plan (${split})`,
    exercise: (name: string) => `The exercise I'm asking about: ${name}`,
    inPlan: "In my plan",
    notInPlan: "Not in my current plan",
    history: "My recent sets (weight × reps)",
    noHistory: "not logged yet",
    nextStep: "The app's suggestion for next time",
    hurtMark: "(marked as painful)",
    workout: (label: string, date: string) => `The workout I'm asking about: ${label}, ${date}`,
    planned: "planned",
    insteadOf: (name: string) => `(instead of ${name})`,
    notLogged: "not logged",
    skipped: "skipped this time",
    notes: "My notes",
    question: "My question",
  },

  // ---------- settings ----------
  settings: {
    eyebrow: "Stored only on this device",
    title: "Settings",
    language: "Language",
    units: "Units",
    unitsHint: "Applies to new workouts. Logged workouts keep their own unit.",
    ai: "AI review (optional)",
    aiShow: "Show the “Get AI review” button on the plan",
    key: "Anthropic API key",
    keyHint: "Your key is stored only on this device and sent only to api.anthropic.com. Reviews are billed to your Anthropic account, usually a few cents each. Before anything is sent, you see exactly what will go out. Get a key at",
    noKeyHint: "Without a key you can still use “Copy review prompt” on the plan and paste it into any chatbot.",
    needKey: "Add an API key to use the AI review, or turn it off.",
    save: "Save settings",
    saved: "Saved.",
    credits: "Credits",
    creditsText: "(public domain). Exercise tags, joint-stress ratings and the plan algorithm: Pump. Joint-stress ratings are first-pass estimates and haven't been reviewed by a professional yet.",
    creditsInstr: "Exercise instructions:",
    translation: "",
    medical: "Pump gives general training guidance, not medical advice.",
    erase: "Erase everything",
    eraseHint: "Deletes your answers, plan, workouts and settings from this device. Export a backup first if you want to keep them.",
    eraseConfirm: "Yes, erase everything",
    eraseAll: "Erase all data",
    erased: "All data erased",
  },
};

export type Dict = typeof en;
