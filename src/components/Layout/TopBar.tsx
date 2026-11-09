import type { Route } from "../../hooks/useRoute.ts";
import { useOnline } from "../../hooks/useOnline.ts";
import styles from "./TopBar.module.css";

const TABS: { route: Route; label: string }[] = [
  { route: "plan", label: "Plan" },
  { route: "log", label: "Workout" },
  { route: "history", label: "History" },
  { route: "settings", label: "Settings" },
];

export function TopBar({ route }: { route: Route }) {
  const online = useOnline();
  return (
    <header className={styles.bar}>
      <a className={styles.brand} href="#plan" aria-label="Pump home">
        <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
          <rect x="2" y="12" width="4" height="8" rx="1" />
          <rect x="6" y="8" width="5" height="16" rx="1.5" />
          <rect x="11" y="14.5" width="10" height="3" rx="1" />
          <rect x="21" y="8" width="5" height="16" rx="1.5" />
          <rect x="26" y="12" width="4" height="8" rx="1" />
        </svg>
        <span>Pump</span>
      </a>
      <nav className={styles.tabs} aria-label="Main">
        {TABS.map((t) => (
          <a key={t.route} href={`#${t.route}`} aria-current={route === t.route ? "page" : undefined}>{t.label}</a>
        ))}
      </nav>
      {!online && <span className={styles.offline}>Offline</span>}
    </header>
  );
}
