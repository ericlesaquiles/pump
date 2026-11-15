// Local persistence. Everything stays on this device.
//
// In a browser the data lives in localStorage. In the Android app it lives in
// Capacitor Preferences (Android SharedPreferences), because Android may clear a
// web view's localStorage. Preferences is async, so on Android every pump:* key
// is loaded into memory once at startup (initStorage) and writes go to memory
// first, then to Preferences in the background. The `store` API stays synchronous.
import { Preferences } from "@capacitor/preferences";
import { isNative } from "./platform.ts";
import type { Answers, Plan, Session, Settings, WorkoutDraft } from "./types.ts";

const PREFIX = "pump:";
const KEYS = {
  answers: "pump:answers",
  plan: "pump:plan",
  sessions: "pump:sessions",
  settings: "pump:settings",
  draft: "pump:draft",
} as const;

interface Backend {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
  keys(): string[];
}

const webBackend: Backend = {
  get: (k) => localStorage.getItem(k),
  set: (k, v) => localStorage.setItem(k, v),
  remove: (k) => localStorage.removeItem(k),
  keys: () => Object.keys(localStorage),
};

const memory = new Map<string, string>();
const nativeBackend: Backend = {
  get: (k) => memory.get(k) ?? null,
  set: (k, v) => {
    memory.set(k, v);
    Preferences.set({ key: k, value: v }).catch((e: unknown) => console.error("Pump: couldn't save", k, e));
  },
  remove: (k) => {
    memory.delete(k);
    Preferences.remove({ key: k }).catch((e: unknown) => console.error("Pump: couldn't remove", k, e));
  },
  keys: () => [...memory.keys()],
};

const backend: Backend = isNative ? nativeBackend : webBackend;

/** Load saved data before the app renders. Needed on Android; instant in a browser. */
export async function initStorage(): Promise<void> {
  if (!isNative) return;
  const { keys } = await Preferences.keys();
  const pumpKeys = keys.filter((k) => k.startsWith(PREFIX));
  const values = await Promise.all(pumpKeys.map((key) => Preferences.get({ key })));
  pumpKeys.forEach((k, i) => {
    const v = values[i]?.value;
    if (v != null) memory.set(k, v);
  });
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = backend.get(key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): boolean {
  try {
    if (value == null) backend.remove(key);
    else backend.set(key, JSON.stringify(value));
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
      for (const k of backend.keys()) if (k.startsWith(PREFIX)) backend.remove(k);
    } catch { /* storage unavailable */ }
  },
};
