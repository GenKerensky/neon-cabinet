/// <reference types='vitest' />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import * as path from "path";
import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";

export default defineConfig({
  root: __dirname,
  cacheDir: "../../node_modules/.vite/apps/space-defender",
  server: {
    port: 4200,
    host: "localhost",
  },
  plugins: [
    react(),
    nxViteTsPaths(),
    dts({
      entryRoot: "src",
      tsconfigPath: path.join(__dirname, "tsconfig.lib.json"),
      outDir: "dist",
      rollupTypes: true,
      insertTypesEntry: true,
    }),
  ],
  // Configuration for building your library.
  // See: https://vite.dev/guide/build.html#library-mode
  build: {
    outDir: "dist",
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      // Could also be a dictionary or array of multiple entry points.
      entry: "src/PhaserGame.tsx",
      name: "space-defender",
      fileName: (format) => `space-defender.${format}.js`,
      // Change this to the formats you want to support.
      // Don't forget to update your package.json as well.
      formats: ["es"],
    },
    rollupOptions: {
      // External packages that should not be bundled into your library.
      external: ["react", "react-dom", "react/jsx-runtime", "phaser"],
    },
    minify: "terser",
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
});
