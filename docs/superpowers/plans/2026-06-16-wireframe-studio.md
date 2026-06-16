# Wireframe Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone checked-in-asset Wireframe Studio that previews OBJ plus optional `.wire.json` files with Neon Cabinet's Phaser wireframe/vector-shader look and orbit/zoom controls.

**Architecture:** Add `apps/wireframe-studio` as a Vite React app patterned after `apps/vector-studio`. Keep data parsing in browser-safe modules, React responsible for selection/controls, and a Phaser preview controller responsible for rendering, orbit camera state, zoom, overlays, and auto-orbit.

**Tech Stack:** React 19, Vite, Vitest, Phaser 3, `@neon-cabinet/shaders`, `@neon-cabinet/studio-registry`, Nx.

---

### Task 1: Scaffold The App

**Files:**

- Create: `apps/wireframe-studio/package.json`
- Create: `apps/wireframe-studio/index.html`
- Create: `apps/wireframe-studio/vite.config.mts`
- Create: `apps/wireframe-studio/tsconfig.json`
- Create: `apps/wireframe-studio/tsconfig.app.json`
- Create: `apps/wireframe-studio/tsconfig.spec.json`
- Create: `apps/wireframe-studio/src/main.tsx`
- Create: `apps/wireframe-studio/src/App.tsx`
- Create: `apps/wireframe-studio/src/styles.css`

- [x] Create app files by mirroring Vector Studio's Vite/React/Nx conventions and using port `4301`.
- [x] Add a minimal `App` shell with left asset browser, central preview stage placeholder, and right inspector placeholder.
- [x] Run `bunx nx test wireframe-studio --skip-nx-cache` and confirm the project is discovered.
- [x] Run `bunx nx build wireframe-studio --skip-nx-cache` and confirm the empty app builds.

### Task 2: Add Browser-Safe OBJ And Sidecar Parsing

**Files:**

- Create: `apps/wireframe-studio/src/assets/obj-parser.ts`
- Create: `apps/wireframe-studio/src/assets/obj-parser.test.ts`
- Create: `apps/wireframe-studio/src/assets/wire-sidecar.ts`
- Create: `apps/wireframe-studio/src/assets/wire-sidecar.test.ts`

- [x] Write failing tests for parsing `v`, `l`, `f`, `o`, `g`, `usemtl`, and source-order edge context from OBJ text.
- [x] Implement `parseObjSource(source: string): ParsedObjModel`.
- [x] Write failing tests for sidecar fallback color, material color, part color, explicit edge fingerprint override, missing sidecar, and invalid JSON warning behavior.
- [x] Implement `applyWireSidecar(parsed, sidecarSource, fallbackColor): WireframePreviewModelResult`.
- [x] Run the parser and sidecar tests until green.

### Task 3: Add Checked-In Asset Manifest

**Files:**

- Create: `apps/wireframe-studio/src/assets/wireframe-assets.ts`
- Create: `apps/wireframe-studio/src/assets/wireframe-assets.test.ts`

- [x] Write failing tests for manifest creation from Vite glob records, grouped assets by folder, and URL selection resolution.
- [x] Implement Vite glob discovery for `apps/*/src/game/models/**/*.obj` and optional sibling `.wire.json`.
- [x] Ensure Battle Tanks checked-in OBJ assets appear in the manifest.
- [x] Run manifest tests until green.

### Task 4: Build The Phaser Preview Controller

**Files:**

- Create: `apps/wireframe-studio/src/preview/vector3d.ts`
- Create: `apps/wireframe-studio/src/preview/wireframe-model.ts`
- Create: `apps/wireframe-studio/src/preview/wireframe-renderer.ts`
- Create: `apps/wireframe-studio/src/preview/wireframe-preview-controller.ts`
- Create: `apps/wireframe-studio/src/preview/wireframe-preview-controller.test.ts`

- [x] Write failing tests for model bounds, framing distance, orbit state updates, zoom clamping, and auto-orbit pause/resume behavior.
- [x] Implement local preview primitives that preserve the game renderer's wireframe projection, edge color, depth alpha, and vector shader assumptions.
- [x] Implement `WireframePreviewController` with `previewModel`, `clearModel`, `setYaw`, `setPitch`, `setZoom`, `resetCamera`, `setAutoOrbit`, `setShaderEnabled`, `setGridEnabled`, `setAxesEnabled`, and `setEdgeColorsEnabled`.
- [x] Run preview controller tests until green.

### Task 5: Connect The React UI

**Files:**

- Modify: `apps/wireframe-studio/src/App.tsx`
- Modify: `apps/wireframe-studio/src/styles.css`
- Create: `apps/wireframe-studio/src/App.test.tsx`

- [x] Write failing UI tests that the app renders the Wireframe Studio shell, lists checked-in assets, and exposes an auto-orbit toggle.
- [x] Connect asset selection to OBJ/sidecar fetch and preview loading.
- [x] Add inspector readouts for source path, vertices, edges, bounds, sidecar status, and warnings.
- [x] Add controls for auto-orbit, reset, shader, grid, axes, edge colors, and zoom.
- [x] Run UI tests until green.

### Task 6: Verify Build And Browser Behavior

**Files:**

- No committed source changes expected unless verification finds a bug.

- [x] Run `bunx nx test wireframe-studio --skip-nx-cache`.
- [x] Run `bunx nx build wireframe-studio --skip-nx-cache`.
- [x] Start or reuse a local dev server for `wireframe-studio`.
- [x] Use the in-app Browser to load the app, confirm the first asset renders, capture a screenshot, toggle auto-orbit, verify yaw changes, exercise zoom/reset, and check console errors.
- [x] Fix any render or interaction failures with new tests first where practical.
- [x] Run `git diff --check`.
