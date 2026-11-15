import { useI18n } from "../../hooks/useI18n.ts";
import { Panel } from "../common/Panel.tsx";
import styles from "./ProgressionTips.module.css";

export function ProgressionTips() {
  const { t } = useI18n();
  return (
    <Panel label={t.plan.progressTitle}>
      <ul className={styles.list}>
        {t.plan.progressTips.map((tip) => <li key={tip}>{tip}</li>)}
      </ul>
    </Panel>
  );
}
