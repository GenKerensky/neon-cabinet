/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import * as path from "path";
import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: "../../node_modules/.vite/apps/starfighter-assault",
  server: {
    port: 4205,
    host: "localhost",
  },
  plugins: [
    react(),
    nxViteTsPaths(),
    dts({
      entryRoot: "src",
      tsconfigPath: path.join(import.meta.dirname, "tsconfig.lib.json"),
      rollupTypes: true,
      insertTypesEntry: true,
    }),
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      entry: "src/PhaserGame.tsx",
      name: "starfighter-assault",
      fileName: "index",
      formats: ["es" as const],
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime", "phaser"],
    },
    minify: "terser" as const,
    terserOptions: {
      compress: {
        passes: 2,
      },
      mangle: true,
      format: {
        comments: false,
      },
    },
  },
  test: {
    name: "starfighter-assault",
    watch: false,
    globals: true,
    environment: "happy-dom",
    include: ["{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    reporters: ["default"],
    coverage: {
      reportsDirectory: "./test-output/vitest/coverage",
      provider: "v8" as const,
    },
  },
}));
