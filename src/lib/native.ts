// Android-only behaviour. Every function here is a no-op in the browser.
import { App } from "@capacitor/app";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Haptics } from "@capacitor/haptics";
import { KeepAwake } from "@capacitor-community/keep-awake";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Share } from "@capacitor/share";
import { isNative } from "./platform.ts";

/** Android back button: close an open dialog first, then go back a screen, then leave the app. */
export function setupAndroid(): void {
  void App.addListener("backButton", ({ canGoBack }) => {
    const dialog = document.querySelector("dialog[open]");
    if (dialog) {
      // Our Dialog component closes itself on the "cancel" event, like pressing Escape.
      dialog.dispatchEvent(new Event("cancel", { cancelable: true }));
      return;
    }
    if (canGoBack && window.location.hash && window.location.hash !== "#plan") window.history.back();
    else void App.exitApp();
  });
}

/** Save a backup file and open the Android share sheet (Drive, email, Files…). */
export async function shareBackup(filename: string, json: string): Promise<void> {
  const { uri } = await Filesystem.writeFile({ path: filename, data: json, directory: Directory.Cache, encoding: Encoding.UTF8 });
  await Share.share({ title: "Pump backup", files: [uri], dialogTitle: "Save your Pump backup" });
}

/** Keep the screen on while a workout is open. */
export async function setKeepAwake(on: boolean): Promise<void> {
  if (!isNative) return;
  try {
    if (on) await KeepAwake.keepAwake();
    else await KeepAwake.allowSleep();
  } catch { /* not critical */ }
}

export async function buzz(): Promise<void> {
  if (isNative) {
    try { await Haptics.vibrate({ duration: 400 }); } catch { /* no vibrator */ }
  } else {
    try { navigator.vibrate?.(300); } catch { /* not supported */ }
  }
}

const REST_NOTIFICATION_ID = 1;

/**
 * Notify when rest is over, so it works with the phone locked.
 * Asks for notification permission the first time; does nothing if refused.
 */
export async function scheduleRestEnd(seconds: number): Promise<void> {
  if (!isNative) return;
  try {
    let perm = await LocalNotifications.checkPermissions();
    if (perm.display === "prompt" || perm.display === "prompt-with-rationale") perm = await LocalNotifications.requestPermissions();
    if (perm.display !== "granted") return;
    await LocalNotifications.cancel({ notifications: [{ id: REST_NOTIFICATION_ID }] });
    await LocalNotifications.schedule({
      notifications: [{
        id: REST_NOTIFICATION_ID,
        title: "Rest over",
        body: "Time for your next set.",
        schedule: { at: new Date(Date.now() + seconds * 1000), allowWhileIdle: true },
      }],
    });
  } catch { /* notifications are a convenience */ }
}

export async function cancelRestEnd(): Promise<void> {
  if (!isNative) return;
  try { await LocalNotifications.cancel({ notifications: [{ id: REST_NOTIFICATION_ID }] }); } catch { /* nothing scheduled */ }
}
