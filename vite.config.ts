import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
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
        navigateFallback: "index.html",
      },
    }),
  ],
  test: {
    include: ["test/**/*.test.ts"],
  },
});
