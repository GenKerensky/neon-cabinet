/// <reference types='vitest' />
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import * as path from "path";

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: "../../node_modules/.vite/libs/audio-tools",
  plugins: [
    dts({
      entryRoot: "src",
      tsconfigPath: path.join(import.meta.dirname, "tsconfig.lib.json"),
      insertTypesEntry: true,
    }),
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    reportCompressedSize: true,
    lib: {
      entry: "src/index.ts",
      name: "audio-tools",
      fileName: "index",
      formats: ["es" as const],
    },
    minify: false,
  },
  test: {
    name: "audio-tools",
    watch: false,
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    reporters: ["default"],
  },
}));
