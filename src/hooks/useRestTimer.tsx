import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { RestTimer } from "../components/Workout/RestTimer.tsx";
import { buzz, cancelRestEnd, scheduleRestEnd } from "../lib/native.ts";
import { useI18n } from "./useI18n.ts";

interface TimerActions {
  /** Start (or restart) a countdown. `key` says which exercise started it, so its button can show it. */
  start: (seconds: number, key?: string) => void;
  stop: () => void;
}

export interface TimerState {
  key: string | null;
  /** Seconds left (0 when finished). */
  left: number;
  /** Length of the current countdown, for progress bars. */
  total: number;
  running: boolean;
  done: boolean;
}

const IDLE: TimerState = { key: null, left: 0, total: 0, running: false, done: false };
const Actions = createContext<TimerActions>({ start: () => {}, stop: () => {} });
// Separate context so only the timer displays re-render every tick, not whole screens.
const State = createContext<TimerState>(IDLE);

/** One rest timer for the whole app: shown on the exercise that started it and as a floating pill. */
export function RestTimerProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [run, setRun] = useState<{ end: number; total: number; key: string | null } | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!run) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [run]);

  const left = run ? Math.max(0, Math.ceil((run.end - now) / 1000)) : 0;
  const done = run !== null && left === 0;

  useEffect(() => {
    if (done) void buzz();
  }, [done]);

  const start = useCallback((seconds: number, key?: string) => {
    const at = Date.now();
    setNow(at);
    setRun({ end: at + seconds * 1000, total: seconds, key: key ?? null });
    // On Android, also notify when rest ends in case the phone is locked.
    void scheduleRestEnd(seconds, { title: t.workout.notifTitle, body: t.workout.notifBody });
  }, [t]);

  const stop = useCallback(() => {
    setRun(null);
    void cancelRestEnd();
  }, []);

  const actions = useMemo(() => ({ start, stop }), [start, stop]);
  const state = useMemo<TimerState>(
    () => (run ? { key: run.key, left, total: run.total, running: !done, done } : IDLE),
    [run, left, done],
  );

  return (
    <Actions.Provider value={actions}>
      <State.Provider value={state}>
        {children}
        {run && (
          <RestTimer
            seconds={left}
            done={done}
            onAdd={() => setRun((r) => (r ? { ...r, end: Math.max(r.end, Date.now()) + 30_000, total: r.total + 30 } : r))}
            onStop={stop}
          />
        )}
      </State.Provider>
    </Actions.Provider>
  );
}

export const useRestTimer = () => useContext(Actions);
export const useRestTimerState = () => useContext(State);
