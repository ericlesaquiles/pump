import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // The app's permanent id on Android. It can't change once published on Google Play.
  appId: "app.pump.planner",
  appName: "Pump",
  webDir: "dist",
  android: {
    // Don't let the WebView be inspected in release builds.
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_pump",
      iconColor: "#d3342c",
    },
  },
};

export default config;
