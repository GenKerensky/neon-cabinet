/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";
import * as path from "path";

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: "../../node_modules/.vite/apps/wireframe-studio",
  server: {
    port: 4301,
    host: "localhost",
    fs: {
      allow: ["../.."],
    },
  },
  preview: {
    port: 4301,
    host: "localhost",
  },
  plugins: [react(), nxViteTsPaths()],
  define: {
    CANVAS_RENDERER: JSON.stringify(true),
    WEBGL_RENDERER: JSON.stringify(true),
    WORKSPACE_ROOT: JSON.stringify(path.resolve(import.meta.dirname, "../../")),
  },
  build: {
    outDir: "./dist",
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  test: {
    name: "wireframe-studio",
    watch: false,
    globals: true,
    environment: "happy-dom",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    reporters: ["default"],
  },
}));
