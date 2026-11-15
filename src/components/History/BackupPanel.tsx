import { useState, type ChangeEvent } from "react";
import { useAppState } from "../../hooks/useAppState.tsx";
import { useToast } from "../../hooks/useToast.tsx";
import { isoDate } from "../../lib/format.ts";
import { shareBackup } from "../../lib/native.ts";
import { isNative } from "../../lib/platform.ts";
import { store } from "../../lib/storage.ts";
import { Button } from "../common/Button.tsx";
import { Panel } from "../common/Panel.tsx";
import styles from "./BackupPanel.module.css";

export function BackupPanel() {
  const { importBackup } = useAppState();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);

  const exportBackup = async () => {
    const json = JSON.stringify(store.exportAll(), null, 2);
    const filename = `pump-backup-${isoDate(new Date())}.json`;
    if (isNative) {
      // Android: save to the app's cache and open the share sheet (Drive, email, Files…).
      try {
        await shareBackup(filename, json);
        setError(null);
      } catch (err) {
        // Closing the share sheet without choosing anything also lands here; only report real failures.
        const msg = err instanceof Error ? err.message : "";
        if (!/cancel/i.test(msg)) setError("Couldn't export the backup. Try again.");
      }
      return;
    }
    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.append(a);
    a.click();
    window.setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      importBackup(JSON.parse(await file.text()));
      setError(null);
      toast("Backup imported");
    } catch (err) {
      setError(err instanceof SyntaxError ? "That file isn't valid JSON." : err instanceof Error ? err.message : "Couldn't import that file.");
    }
  };

  return (
    <Panel label="Backup">
      <p className={styles.text}>Your data lives only in this browser. Export a backup file now and then. API keys are not included.</p>
      <div className={styles.row}>
        <Button variant="ghost" small onClick={() => void exportBackup()}>Export backup</Button>
        <label className={styles.import}>
          Import backup
          <input type="file" accept="application/json,.json" onChange={onFile} hidden />
        </label>
      </div>
      {error && <p className={styles.error} role="alert">{error}</p>}
    </Panel>
  );
}
