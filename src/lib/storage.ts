// Local persistence. Everything stays on this device.
import type { Answers, Plan, Session, Settings, WorkoutDraft } from "./types.ts";

const KEYS = {
  answers: "pump:answers",
  plan: "pump:plan",
  sessions: "pump:sessions",
  settings: "pump:settings",
  draft: "pump:draft",
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): boolean {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const DEFAULT_SETTINGS: Settings = { unit: "kg", aiEnabled: false, apiKey: "" };

export interface Backup {
  app: "pump";
  version: 1;
  exportedAt: string;
  answers: Answers | null;
  plan: Plan | null;
  sessions: Session[];
  settings: Omit<Settings, "apiKey">;
}

export const store = {
  getAnswers: () => read<Answers | null>(KEYS.answers, null),
  setAnswers: (a: Answers | null) => write(KEYS.answers, a),
  getPlan: () => read<Plan | null>(KEYS.plan, null),
  setPlan: (p: Plan | null) => write(KEYS.plan, p),
  getSessions: () => read<Session[]>(KEYS.sessions, []),
  setSessions: (s: Session[]) => write(KEYS.sessions, s),
  getSettings: (): Settings => ({ ...DEFAULT_SETTINGS, ...read<Partial<Settings>>(KEYS.settings, {}) }),
  setSettings: (s: Settings) => write(KEYS.settings, s),
  getDraft: (id: string) => read<WorkoutDraft | null>(`${KEYS.draft}:${id}`, null),
  setDraft: (id: string, d: WorkoutDraft | null) => write(`${KEYS.draft}:${id}`, d),

  /** Backup without the API key. */
  exportAll(): Backup {
    const { apiKey: _omit, ...settings } = this.getSettings();
    return { app: "pump", version: 1, exportedAt: new Date().toISOString(), answers: this.getAnswers(), plan: this.getPlan(), sessions: this.getSessions(), settings };
  },
  importAll(data: unknown): void {
    const b = data as Partial<Backup> | null;
    if (!b || b.app !== "pump") throw new Error("This file isn't a Pump backup.");
    if (b.answers) this.setAnswers(b.answers);
    if (b.plan) this.setPlan(b.plan);
    if (Array.isArray(b.sessions)) this.setSessions(b.sessions);
    if (b.settings) this.setSettings({ ...this.getSettings(), ...b.settings, apiKey: this.getSettings().apiKey });
  },
  clearAll(): void {
    try {
      for (const k of Object.keys(localStorage)) if (k.startsWith("pump:")) localStorage.removeItem(k);
    } catch { /* storage unavailable */ }
  },
};
