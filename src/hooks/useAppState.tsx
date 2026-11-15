import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { EXERCISES } from "../data/exercises.ts";
import { generatePlan, migratePlan } from "../lib/generator.ts";
import { store } from "../lib/storage.ts";
import { isoDate } from "../lib/format.ts";
import { nextDayIdx } from "../lib/rotation.ts";
import type { Answers, Plan, Session, Settings } from "../lib/types.ts";

/** Which workout the Workout screen shows. */
export interface LogSelection { dayIdx: number; date: string }

interface AppState {
  answers: Answers | null;
  plan: Plan | null;
  sessions: Session[];
  settings: Settings;
  logSel: LogSelection | null;
  /** Save answers and build a fresh plan from them. */
  buildPlan: (answers: Answers) => void;
  /** Rebuild the plan from its current answers. */
  rebuildPlan: () => void;
  updatePlan: (plan: Plan) => void;
  saveSession: (session: Session) => void;
  deleteSession: (id: string) => void;
  saveSettings: (settings: Settings) => void;
  setLogSel: (sel: LogSelection | null) => void;
  importBackup: (data: unknown) => void;
  eraseAll: () => void;
}

const Ctx = createContext<AppState | null>(null);

/** The saved plan, upgraded (and re-saved) if an older version of the app wrote it. */
function loadPlan(): Plan | null {
  const saved = store.getPlan();
  if (!saved || saved.v === 2) return saved;
  const plan = migratePlan(saved, EXERCISES);
  store.setPlan(plan);
  return plan;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [answers, setAnswers] = useState<Answers | null>(() => store.getAnswers());
  const [plan, setPlan] = useState<Plan | null>(loadPlan);
  const [sessions, setSessions] = useState<Session[]>(() => store.getSessions());
  const [settings, setSettings] = useState<Settings>(() => store.getSettings());
  const [logSel, setLogSel] = useState<LogSelection | null>(null);

  const updatePlan = useCallback((p: Plan) => {
    store.setPlan(p);
    setPlan(p);
    setAnswers(p.answers);
    store.setAnswers(p.answers);
  }, []);

  const buildPlan = useCallback((a: Answers) => updatePlan(generatePlan(a, EXERCISES)), [updatePlan]);

  const rebuildPlan = useCallback(() => {
    if (plan) updatePlan(generatePlan(plan.answers, EXERCISES));
  }, [plan, updatePlan]);

  const saveSession = useCallback((s: Session) => {
    setSessions((prev) => {
      const next = [...prev.filter((x) => x.id !== s.id), s];
      store.setSessions(next);
      return next;
    });
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => {
      const next = prev.filter((x) => x.id !== id);
      store.setSessions(next);
      return next;
    });
  }, []);

  const saveSettings = useCallback((s: Settings) => {
    store.setSettings(s);
    setSettings(s);
  }, []);

  const reloadAll = useCallback(() => {
    setAnswers(store.getAnswers());
    setPlan(loadPlan());
    setSessions(store.getSessions());
    setSettings(store.getSettings());
    setLogSel(null);
  }, []);

  const importBackup = useCallback((data: unknown) => {
    store.importAll(data);
    reloadAll();
  }, [reloadAll]);

  const eraseAll = useCallback(() => {
    store.clearAll();
    reloadAll();
  }, [reloadAll]);

  // Screen readers and the Android keyboard follow the page language.
  useEffect(() => {
    document.documentElement.lang = settings.lang === "pt" ? "pt-BR" : "en";
  }, [settings.lang]);

  const value = useMemo<AppState>(() => ({
    answers, plan, sessions, settings, logSel,
    buildPlan, rebuildPlan, updatePlan, saveSession, deleteSession, saveSettings, setLogSel, importBackup, eraseAll,
  }), [answers, plan, sessions, settings, logSel, buildPlan, rebuildPlan, updatePlan, saveSession, deleteSession, saveSettings, importBackup, eraseAll]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppState must be used inside <AppStateProvider>");
  return ctx;
}

/**
 * Which workout to show on the Workout screen: one already logged today under
 * this plan (so it can be edited), otherwise the next one in the rotation.
 */
export function defaultLogSelection(plan: Plan, sessions: Session[]): LogSelection {
  const today = isoDate(new Date());
  const done = sessions.filter((s) => s.planId === plan.id && s.date === today && s.dayIdx < plan.days.length);
  const latest = done.sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1))[0];
  return { dayIdx: latest ? latest.dayIdx : nextDayIdx(plan, sessions), date: today };
}
