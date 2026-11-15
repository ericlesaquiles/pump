import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { RestTimer } from "../components/Workout/RestTimer.tsx";
import { buzz, cancelRestEnd, scheduleRestEnd } from "../lib/native.ts";
import { useI18n } from "./useI18n.ts";

interface TimerApi { start: (seconds: number) => void }
const Ctx = createContext<TimerApi>({ start: () => {} });

/** One floating rest timer for the whole app. */
export function RestTimerProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [end, setEnd] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (end === null) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [end]);

  const left = end === null ? 0 : Math.max(0, Math.round((end - now) / 1000));
  const done = end !== null && left === 0;

  useEffect(() => {
    if (done) void buzz();
  }, [done]);

  const start = useCallback((seconds: number) => {
    setNow(Date.now());
    setEnd(Date.now() + seconds * 1000);
    // On Android, also notify when rest ends in case the phone is locked.
    void scheduleRestEnd(seconds, { title: t.workout.notifTitle, body: t.workout.notifBody });
  }, [t]);

  const stop = useCallback(() => {
    setEnd(null);
    void cancelRestEnd();
  }, []);

  return (
    <Ctx.Provider value={{ start }}>
      {children}
      {end !== null && (
        <RestTimer seconds={left} done={done} onAdd={() => start(left + 30)} onStop={stop} />
      )}
    </Ctx.Provider>
  );
}

export const useRestTimer = () => useContext(Ctx);
