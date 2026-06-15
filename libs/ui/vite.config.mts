/// <reference types='vitest' />
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import * as path from "path";

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: "../../node_modules/.vite/libs/ui",
  plugins: [
    dts({
      entryRoot: "src",
      tsconfigPath: path.join(import.meta.dirname, "tsconfig.lib.json"),
    }),
  ],
  build: {
    outDir: "./dist",
    emptyOutDir: true,
    reportCompressedSize: true,
    lib: {
      entry: "src/index.ts",
      name: "@neon-cabinet/ui",
      fileName: "index",
      formats: ["es" as const],
    },
    rollupOptions: {
      external: [
        "@fontsource-variable/geist",
        "class-variance-authority",
        "clsx",
        "lucide-react",
        "radix-ui",
        "react",
        "react-dom",
        "tailwind-merge",
      ],
    },
  },
  test: {
    name: "ui",
    watch: false,
    globals: true,
    environment: "happy-dom",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    reporters: ["default"],
  },
}));
