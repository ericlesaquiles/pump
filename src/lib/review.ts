// Optional AI review of a plan. Text only, opt-in, never applied automatically.
// The Anthropic SDK is loaded lazily (its own chunk) only when a review is requested.
import { MUSCLES, MUSCLE_KEYS, JOINTS, MOVEMENTS, GOALS, EXPERIENCE, PRIORITY_GROUPS, WEEKDAYS } from "./constants.ts";
import { indexExercises } from "./generator.ts";
import type { Exercise, Joint, Plan, ReviewFinding } from "./types.ts";

export const MODEL = "claude-opus-5-5";

export const SYSTEM_PROMPT = `You review weekly strength-training plans produced by a rule-based app.
Judge the plan against current evidence on resistance training for the person's goal and experience.
Check, in this order:
1. Weekly hard sets per muscle against the targets given (roughly 10+ for growth, fewer for beginners and small muscles).
2. Balance: pushing vs pulling sets, quads vs hamstrings, enough rear-delt and upper-back work.
3. Injuries and painful movements: does any exercise load a limited joint or use a movement the person said hurts?
4. Exercise choices: suitable for the equipment and experience, sensible order (compound lifts first), no redundant picks.
5. Time: does each session fit the stated length?
6. Swaps the person made: did any of them leave a gap?
Be specific and practical. Name exercises exactly as they appear in the plan. Only suggest exercises that fit the person's equipment.
Do not diagnose injuries; for anything medical, say to consult a physiotherapist or doctor.
If the plan is sound, say so and keep the findings list short.`;

export const REVIEW_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "findings"],
  properties: {
    summary: { type: "string", description: "Two or three sentences on the plan overall." },
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["severity", "title", "explanation", "suggestion"],
        properties: {
          severity: { type: "string", enum: ["high", "medium", "low", "info"] },
          title: { type: "string" },
          explanation: { type: "string" },
          suggestion: { type: "string", description: "A concrete change, or an empty string if none." },
        },
      },
    },
  },
} as const;

export interface ReviewInput {
  person: {
    goal: string;
    experience: string;
    daysPerWeek: number;
    sessionMinutes: number;
    equipment: string[];
    limitations: string[];
    painfulMovements: string[];
    priorities: string[];
    age?: number;
  };
  split: string;
  days: { day: string; estimatedMinutes: number; exercises: { name: string; sets: number; reps: string; restSeconds: number; swappedByUser?: boolean }[] }[];
  weeklySetsPerMuscle: Record<string, { sets: number; target: number; minimum: number }>;
  appWarnings: string[];
}

export interface ReviewResult { summary: string; findings: ReviewFinding[]; model: string }

/** The exact data that would be sent: answers + plan as plain text fields. */
export function buildReviewInput(plan: Plan, exercises: Exercise[]): ReviewInput {
  const byId = indexExercises(exercises);
  const a = plan.answers;
  return {
    person: {
      goal: GOALS[a.goal],
      experience: EXPERIENCE[a.experience],
      daysPerWeek: a.days,
      sessionMinutes: a.minutes,
      equipment: a.equipment,
      limitations: (Object.entries(a.injuries) as [Joint, string][]).map(([j, s]) => `${JOINTS[j]}: ${s}`),
      painfulMovements: a.painful.map((m) => MOVEMENTS[m]),
      priorities: a.priorities.map((p) => PRIORITY_GROUPS[p].label),
      ...(a.age ? { age: a.age } : {}),
    },
    split: plan.splitName,
    days: plan.days.map((d) => ({
      day: `${WEEKDAYS[d.weekday]} – ${d.name}`,
      estimatedMinutes: d.estMinutes,
      exercises: d.exercises.filter((s) => s.sets > 0).map((s) => ({
        name: byId.get(s.exId)?.name ?? s.exId,
        sets: s.sets,
        reps: `${s.reps[0]}–${s.reps[1]}`,
        restSeconds: s.rest,
        ...(s.reasons.some((r) => r.startsWith("Swapped in by you")) ? { swappedByUser: true } : {}),
      })),
    })),
    weeklySetsPerMuscle: Object.fromEntries(MUSCLE_KEYS.map((m) => [MUSCLES[m], { sets: plan.weekly[m], target: plan.targets[m].target, minimum: plan.targets[m].floor }])),
    appWarnings: plan.warnings.map((w) => w.text),
  };
}

/** Plain-text prompt for pasting into any chatbot (offline fallback). */
export function reviewPromptText(input: ReviewInput): string {
  return `${SYSTEM_PROMPT}

Reply with a short summary, then a list of findings. For each finding give a severity (high, medium, low or info), a title, an explanation and a concrete suggestion.

Here is the plan as JSON:

${JSON.stringify(input, null, 2)}`;
}

export type ReviewErrorCode = "offline" | "sdk" | "auth" | "rate" | "request" | "network" | "api" | "unknown" | "refusal" | "truncated" | "parse";

export class ReviewError extends Error {
  readonly code: ReviewErrorCode;
  constructor(code: ReviewErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

/** Calls the Claude API with the user's own key. */
export async function requestReview(apiKey: string, input: ReviewInput): Promise<ReviewResult> {
  if (!navigator.onLine) throw new ReviewError("offline", "You're offline. Use “Copy review prompt” instead, or try again when connected.");
  let Anthropic: typeof import("@anthropic-ai/sdk").default;
  try {
    ({ default: Anthropic } = await import("@anthropic-ai/sdk"));
  } catch {
    throw new ReviewError("sdk", "Couldn't load the review module. Reload the page and try again.");
  }
  // The key is the user's own and is sent only to api.anthropic.com.
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  let response;
  try {
    response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: { type: "json_schema", schema: REVIEW_SCHEMA } },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Review this plan:\n\n${JSON.stringify(input)}` }],
    });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) throw new ReviewError("auth", "The API key was rejected. Check it in Settings.");
    if (error instanceof Anthropic.PermissionDeniedError) throw new ReviewError("auth", "This API key isn't allowed to use this model.");
    if (error instanceof Anthropic.RateLimitError) throw new ReviewError("rate", "Too many requests right now. Wait a minute and try again.");
    if (error instanceof Anthropic.BadRequestError) throw new ReviewError("request", `The review request was rejected: ${error.message}`);
    if (error instanceof Anthropic.APIConnectionError) throw new ReviewError("network", "Couldn't reach the Claude API. Check your connection.");
    if (error instanceof Anthropic.APIError) throw new ReviewError("api", `The Claude API returned an error (${error.status}). Try again later.`);
    throw new ReviewError("unknown", "Something went wrong while requesting the review.");
  }
  if (response.stop_reason === "refusal") throw new ReviewError("refusal", "The model declined to review this plan.");
  if (response.stop_reason === "max_tokens") throw new ReviewError("truncated", "The review was cut off. Try again.");
  let text = "";
  for (const block of response.content) if (block.type === "text") text += block.text;
  try {
    const parsed = JSON.parse(text) as Omit<ReviewResult, "model">;
    return { summary: parsed.summary, findings: parsed.findings, model: response.model };
  } catch {
    throw new ReviewError("parse", "The review came back in an unexpected format. Try again.");
  }
}
