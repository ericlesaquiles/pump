import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { initStorage } from "./lib/storage.ts";
import { isNative } from "./lib/platform.ts";
import { setupAndroid } from "./lib/native.ts";
import "./styles/tokens.css";
import "./styles/base.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");

async function start(el: HTMLElement) {
  await initStorage();

  if (isNative) {
    setupAndroid();
  } else {
    // Offline support in the browser. Not needed in the Android app, which ships its files.
    import("virtual:pwa-register").then(({ registerSW }) => registerSW({ immediate: true })).catch(() => {});
  }

  createRoot(el).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void start(root);
