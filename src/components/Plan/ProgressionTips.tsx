import { Panel } from "../common/Panel.tsx";
import styles from "./ProgressionTips.module.css";

export function ProgressionTips() {
  return (
    <Panel label="How to progress">
      <ul className={styles.list}>
        <li>When every set reaches the top of the rep range, add weight next time: about 2.5 kg / 5 lb for upper body, 5 kg / 10 lb for lower body.</li>
        <li>Otherwise keep the weight and beat your reps.</li>
        <li>Every 6–8 weeks, or after two weeks without progress, take a lighter week with about half the sets.</li>
      </ul>
    </Panel>
  );
}
