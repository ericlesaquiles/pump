import { rmSync } from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

/**
 * Exercise GIFs (© Gym visual) live in public/media/gymvisual only on the developer's machine.
 * PUMP_NO_GIFS=1 builds leave them out, for anything that will be shared or published.
 */
function dropGifs(): Plugin {
  let outDir = "dist";
  return {
    name: "pump-drop-gifs",
    apply: "build",
    configResolved(c) { outDir = path.resolve(c.root, c.build.outDir); },
    closeBundle() {
      if (process.env.PUMP_NO_GIFS === "1") rmSync(path.join(outDir, "media/gymvisual"), { recursive: true, force: true });
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    dropGifs(),
    VitePWA({
      registerType: "autoUpdate",
      // Registered from main.tsx, and only in the browser (not in the Android app).
      injectRegister: null,
      includeAssets: ["icon.svg"],
      manifest: {
        name: "Pump",
        short_name: "Pump",
        description: "Build a weekly strength-training plan, log your sessions and swap exercises. Works offline.",
        start_url: "./#plan",
        scope: "./",
        display: "standalone",
        background_color: "#eef1f4",
        theme_color: "#1f2a36",
        icons: [{ src: "icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }],
      },
      workbox: {
        // Everything the app needs offline, including the lazily loaded AI-review chunk.
        globPatterns: ["**/*.{js,css,html,svg,json,webmanifest}"],
        // GIFs are optional and large: cached as they're viewed, never precached.
        globIgnores: ["media/**"],
        runtimeCaching: [{ urlPattern: /\/media\/gymvisual\//, handler: "CacheFirst", options: { cacheName: "exercise-gifs" } }],
        navigateFallback: "index.html",
      },
    }),
  ],
  test: {
    include: ["test/**/*.test.ts"],
  },
});
