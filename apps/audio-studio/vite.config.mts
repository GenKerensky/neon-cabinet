/// <reference types='vitest' />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: "../../node_modules/.vite/apps/audio-studio",
  server: {
    port: 4310,
    host: "localhost",
  },
  preview: {
    port: 4310,
    host: "localhost",
  },
  plugins: [react(), nxViteTsPaths(), tailwindcss()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    reportCompressedSize: true,
  },
  test: {
    name: "audio-studio",
    watch: false,
    globals: true,
    environment: "happy-dom",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    setupFiles: ["./src/test-setup.ts"],
    reporters: ["default"],
  },
}));
