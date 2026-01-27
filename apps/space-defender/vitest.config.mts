import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: "../../node_modules/.vite/apps/space-defender",
  plugins: [react()],
  test: {
    name: "space-defender",
    watch: false,
    globals: true,
    environment: "jsdom",
    include: ["{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    reporters: ["default"],
    coverage: {
      reportsDirectory: "./test-output/vitest/coverage",
      provider: "v8" as const,
    },
  },
}));
