import { useEffect, useRef } from "react";
import { AppStateProvider, useAppState } from "./hooks/useAppState.tsx";
import { useRoute, type Route } from "./hooks/useRoute.ts";
import { useSwipeTabs } from "./hooks/useSwipeTabs.ts";
import { ToastProvider } from "./hooks/useToast.tsx";
import { RestTimerProvider } from "./hooks/useRestTimer.tsx";
import { TopBar } from "./components/Layout/TopBar.tsx";
import { SetupView } from "./components/Setup/SetupView.tsx";
import { PlanView } from "./components/Plan/PlanView.tsx";
import { WorkoutView } from "./components/Workout/WorkoutView.tsx";
import { HistoryView } from "./components/History/HistoryView.tsx";
import { SettingsView } from "./components/Settings/SettingsView.tsx";
import styles from "./App.module.css";

function Screens() {
  const { plan } = useAppState();
  const [hashRoute] = useRoute();
  // Without a plan, everything except Settings leads to the questionnaire.
  const route: Route = !plan && hashRoute !== "settings" ? "setup" : hashRoute ?? "plan";
  const main = useRef<HTMLElement>(null);
  // Swipe between tabs once there's a plan (the questionnaire isn't a tab).
  useSwipeTabs(route, Boolean(plan) && route !== "setup");

  useEffect(() => {
    main.current?.focus({ preventScroll: true });
  }, [route]);

  return (
    <>
      <TopBar route={route} />
      <main ref={main} className={styles.main} tabIndex={-1}>
        {route === "setup" && <SetupView />}
        {route === "plan" && plan && <PlanView plan={plan} />}
        {route === "log" && plan && <WorkoutView plan={plan} />}
        {route === "history" && plan && <HistoryView plan={plan} />}
        {route === "settings" && <SettingsView />}
      </main>
    </>
  );
}

export function App() {
  return (
    <AppStateProvider>
      <ToastProvider>
        <RestTimerProvider>
          <Screens />
        </RestTimerProvider>
      </ToastProvider>
    </AppStateProvider>
  );
}
