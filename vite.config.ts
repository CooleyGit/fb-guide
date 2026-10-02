/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves this repository under /fb-guide/.
// Keep the base path in sync with the hash routes used by the app.
export default defineConfig({
  base: "/fb-guide/",
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    css: false,
    // Playwright specs live under e2e/ and must not be collected by Vitest.
    exclude: ["**/node_modules/**", "**/dist/**", "e2e/**"],
  },
});
