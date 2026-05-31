/// <reference types='vitest' />
import { defineConfig } from "vite";
import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";
import * as path from "path";

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: "../../node_modules/.vite/apps/vector-studio",
  server: {
    port: 4300,
    host: "localhost",
    fs: {
      allow: ["../.."],
    },
  },
  preview: {
    port: 4300,
    host: "localhost",
  },
  plugins: [nxViteTsPaths()],
  define: {
    CANVAS_RENDERER: JSON.stringify(true),
    WEBGL_RENDERER: JSON.stringify(true),
    WORKSPACE_ROOT: JSON.stringify(path.resolve(import.meta.dirname, "../../")),
  },
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [],
  // },
  build: {
    outDir: "./dist",
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
}));
