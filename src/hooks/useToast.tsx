import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Toast } from "../components/common/Toast.tsx";

const Ctx = createContext<(msg: string) => void>(() => {});

/** Short confirmation messages ("Workout saved"). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const show = useCallback((m: string) => {
    setMsg(m);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(null), 2600);
  }, []);
  return (
    <Ctx.Provider value={show}>
      {children}
      <Toast message={msg} />
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
