# Starfighter Assault MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first playable `Starfighter Assault` MVP: a cockpit-view wireframe 3D rail shooter with opening crawl, mouse steering, dual lasers, torpedoes, constrained procedural segments, bounty upgrades, radar, and a capital ship finale.

**Architecture:** Use the existing Neon Cabinet Phaser/Vite app pattern and reuse the proven `battle-tanks` custom wireframe projection approach instead of introducing Three.js in the MVP. Keep pure game rules in `simulation`, path generation in `rail`, renderer-only code in Phaser scenes/objects, and projection/HUD math isolated so tests can cover the core loop without a browser.

**Tech Stack:** React 19, Phaser 3.90 catalog dependency, Vite, Vitest, Nx via `bunx nx`, Neon Cabinet `VectorShader`, custom wireframe renderer patterned after `apps/battle-tanks`.

---

## File Structure

Create the new game app under `apps/starfighter-assault`:

- `apps/starfighter-assault/package.json`: workspace package metadata and dependencies.
- `apps/starfighter-assault/vite.config.mts`: Vite library/test config using port `4205`.
- `apps/starfighter-assault/tsconfig.json`: project references.
- `apps/starfighter-assault/tsconfig.lib.json`: app TypeScript config.
- `apps/starfighter-assault/tsconfig.spec.json`: app test TypeScript config.
- `apps/starfighter-assault/src/App.tsx`: local standalone app shell.
- `apps/starfighter-assault/src/PhaserGame.tsx`: React-to-Phaser bridge.
- `apps/starfighter-assault/src/main.tsx`: standalone Vite entry.
- `apps/starfighter-assault/src/game/main.ts`: Phaser game initialization.
- `apps/starfighter-assault/src/game/EventBus.ts`: scene-ready bridge.
- `apps/starfighter-assault/src/game/config/crawl.ts`: opening narrative crawl copy and duration.
- `apps/starfighter-assault/src/game/config/theme.ts`: palette constants.
- `apps/starfighter-assault/src/game/engine/Vector3D.ts`: copied and owned 3D vector primitive.
- `apps/starfighter-assault/src/game/engine/Camera3D.ts`: copied and owned perspective camera.
- `apps/starfighter-assault/src/game/engine/WireframeModel.ts`: copied and owned wireframe model type.
- `apps/starfighter-assault/src/game/engine/WireframeRenderer.ts`: copied and owned line renderer.
- `apps/starfighter-assault/src/game/rail/SegmentTypes.ts`: segment role and constraint types.
- `apps/starfighter-assault/src/game/rail/RouteGenerator.ts`: seeded constrained sortie generator.
- `apps/starfighter-assault/src/game/simulation/RunState.ts`: run state, lives, shields, segment transitions, finale stages.
- `apps/starfighter-assault/src/game/simulation/Weapons.ts`: laser and torpedo firing rules.
- `apps/starfighter-assault/src/game/simulation/Bounties.ts`: bounty awards and streak math.
- `apps/starfighter-assault/src/game/simulation/Upgrades.ts`: upgrade catalog, costs, and purchases.
- `apps/starfighter-assault/src/game/hud/RadarProjection.ts`: forward-view radar dot mapping.
- `apps/starfighter-assault/src/game/objects/CockpitHud.ts`: cockpit frame, panels, radar, reticle, and cannon protrusions.
- `apps/starfighter-assault/src/game/objects/RailPlayer.ts`: mouse flight-box movement.
- `apps/starfighter-assault/src/game/objects/Threats.ts`: MVP threat entity models.
- `apps/starfighter-assault/src/game/scenes/Boot.ts`: shader setup.
- `apps/starfighter-assault/src/game/scenes/OpeningCrawl.ts`: skippable opening crawl.
- `apps/starfighter-assault/src/game/scenes/Title.ts`: title/attract start screen.
- `apps/starfighter-assault/src/game/scenes/Game.ts`: main gameplay scene.
- `apps/starfighter-assault/src/game/scenes/UpgradeShop.ts`: between-segment upgrade choice scene.
- `apps/starfighter-assault/src/game/scenes/GameOver.ts`: run end screen.
- `apps/starfighter-assault/src/game/scenes/Pause.ts`: pause overlay.
- `apps/starfighter-assault/src/utils/font.ts`: font helper matching existing game apps.
- `apps/starfighter-assault/src/utils/settings.ts`: dimensions and game constants.
- `apps/frontend/src/app/games/starfighter-assault/page.tsx`: frontend route.
- `apps/frontend/src/lib/games.ts`: mark Starfighter Assault available.
- `libs/studio-registry/src/lib/studio-registry.ts`: add Starfighter Assault metadata/theme after the game app exists.

## Verification Commands

Use Nx through Bun:

- `bunx nx test starfighter-assault`
- `bunx nx build starfighter-assault`
- `bunx nx test frontend`
- `bunx nx build frontend`

If Nx cannot infer the new package after scaffolding, run `bunx nx show projects` and verify `starfighter-assault` appears before continuing.

### Task 1: Scaffold The App Package

**Files:**
- Create: `apps/starfighter-assault/package.json`
- Create: `apps/starfighter-assault/vite.config.mts`
- Create: `apps/starfighter-assault/tsconfig.json`
- Create: `apps/starfighter-assault/tsconfig.lib.json`
- Create: `apps/starfighter-assault/tsconfig.spec.json`
- Create: `apps/starfighter-assault/src/App.tsx`
- Create: `apps/starfighter-assault/src/PhaserGame.tsx`
- Create: `apps/starfighter-assault/src/main.tsx`
- Create: `apps/starfighter-assault/src/game/EventBus.ts`
- Create: `apps/starfighter-assault/src/game/main.ts`
- Create: `apps/starfighter-assault/src/game/scenes/Boot.ts`
- Create: `apps/starfighter-assault/src/game/scenes/Title.ts`
- Create: `apps/starfighter-assault/src/game/scenes/Game.ts`
- Create: `apps/starfighter-assault/src/game/scenes/Pause.ts`
- Create: `apps/starfighter-assault/src/game/scenes/GameOver.ts`
- Create: `apps/starfighter-assault/src/utils/font.ts`
- Create: `apps/starfighter-assault/src/utils/settings.ts`

- [ ] **Step 1: Create package metadata**

Use this exact `apps/starfighter-assault/package.json`:

```json
{
  "name": "starfighter-assault",
  "version": "0.0.1",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js"
  },
  "dependencies": {
    "@neon-cabinet/shaders": "workspace:*",
    "@neon-cabinet/typed-event-emitter": "workspace:*",
    "phaser": "catalog:",
    "react": "catalog:",
    "react-dom": "catalog:"
  }
}
```

- [ ] **Step 2: Create Vite config**

Use this exact `apps/starfighter-assault/vite.config.mts`:

```ts
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
```

- [ ] **Step 3: Create TypeScript configs**

Use this exact `apps/starfighter-assault/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "files": [],
  "references": [
    {
      "path": "./tsconfig.lib.json"
    },
    {
      "path": "./tsconfig.spec.json"
    }
  ]
}
```

Use this exact `apps/starfighter-assault/tsconfig.lib.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "outDir": "./out-tsc/lib",
    "declarationMap": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["src/**/*.spec.ts", "src/**/*.test.ts"],
  "references": [
    {
      "path": "../../libs/typed-event-emitter/tsconfig.lib.json"
    },
    {
      "path": "../../libs/shaders/tsconfig.lib.json"
    }
  ]
}
```

Use this exact `apps/starfighter-assault/tsconfig.spec.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "outDir": "./out-tsc/spec",
    "types": ["vitest/globals"]
  },
  "include": ["src/**/*.spec.ts", "src/**/*.test.ts"],
  "references": [
    {
      "path": "./tsconfig.lib.json"
    }
  ]
}
```

- [ ] **Step 4: Create React/Phaser shell**

Use the existing `apps/battle-tanks/src/App.tsx`, `apps/battle-tanks/src/PhaserGame.tsx`, and `apps/battle-tanks/src/main.tsx` as direct patterns, replacing package-local imports with `./game/main` and `./game/EventBus`.

`apps/starfighter-assault/src/App.tsx`:

```tsx
import { useRef } from "react";
import type { Scene } from "phaser";
import { PhaserGame, type IRefPhaserGame } from "./PhaserGame";

function App() {
  const phaserRef = useRef<IRefPhaserGame>({
    game: undefined,
    scene: undefined,
  });

  const onCurrentActiveScene = (_scene: Scene) => {
    // Scene ready.
  };

  return (
    <div style={{ width: "100vw", height: "100vh", margin: 0, padding: 0 }}>
      <PhaserGame ref={phaserRef} currentActiveScene={onCurrentActiveScene} />
    </div>
  );
}

export default App;
```

`apps/starfighter-assault/src/PhaserGame.tsx`:

```tsx
import { forwardRef, useEffect, useLayoutEffect, useRef } from "react";
import type { Game, Scene } from "phaser";
import { EventBus } from "./game/EventBus";
import { initializeGame } from "./game/main";

export interface IRefPhaserGame {
  game: Game | undefined;
  scene: Scene | undefined;
}

interface IProps {
  currentActiveScene?: (scene: Scene) => void;
}

export const PhaserGame = forwardRef<IRefPhaserGame, IProps>(
  function PhaserGame({ currentActiveScene }, ref) {
    const game = useRef<Game | undefined>(undefined);

    useLayoutEffect(() => {
      if (game.current === undefined) {
        const phaserGame = initializeGame();
        game.current = phaserGame;

        if (typeof ref === "function") {
          ref({ game: game.current, scene: undefined });
        } else if (ref) {
          ref.current = { game: game.current, scene: undefined };
        }
      }

      return () => {
        if (game.current) {
          game.current.destroy(true);
          game.current = undefined;
        }
      };
    }, [ref]);

    useEffect(() => {
      const handleSceneReady = (sceneInstance: Scene) => {
        currentActiveScene?.(sceneInstance);

        if (typeof ref === "function") {
          ref({ game: game.current, scene: sceneInstance });
        } else if (ref) {
          ref.current = { game: game.current, scene: sceneInstance };
        }
      };

      EventBus.on("current-scene-ready", handleSceneReady);

      return () => {
        EventBus.removeListener("current-scene-ready", handleSceneReady);
      };
    }, [currentActiveScene, ref]);

    return (
      <div
        id="phaser-game"
        tabIndex={0}
        style={{ outline: "none", fontFamily: "Orbitron, sans-serif" }}
        onMouseDown={(event) => {
          event.currentTarget.focus();
        }}
      />
    );
  },
);
```

`apps/starfighter-assault/src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 5: Create minimal Phaser bootstrap**

`apps/starfighter-assault/src/game/EventBus.ts`:

```ts
import { TypedEventEmitter } from "@neon-cabinet/typed-event-emitter";
import type { Scene } from "phaser";

interface GameEvents {
  "current-scene-ready": (scene: Scene) => void;
}

export const EventBus = new TypedEventEmitter<GameEvents>();
```

`apps/starfighter-assault/src/utils/settings.ts`:

```ts
export const GAME_WIDTH = 1024;
export const GAME_HEIGHT = 768;
```

`apps/starfighter-assault/src/utils/font.ts`:

```ts
import type { Scene } from "phaser";

export function getFontFamily(_scene: Scene): string {
  return "Orbitron, monospace";
}
```

`apps/starfighter-assault/src/game/main.ts`:

```ts
import Phaser from "phaser";
import { VectorShader } from "@neon-cabinet/shaders";
import { GAME_HEIGHT, GAME_WIDTH } from "../utils/settings";
import { Boot } from "./scenes/Boot";
import { Title } from "./scenes/Title";
import { Game } from "./scenes/Game";
import { Pause } from "./scenes/Pause";
import { GameOver } from "./scenes/GameOver";

export function initializeGame(): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: "phaser-game",
    backgroundColor: "#020107",
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: false,
    },
    pipeline: {
      VectorShader,
    },
    scene: [Boot, Title, Game, Pause, GameOver],
  });
}
```

`apps/starfighter-assault/src/game/scenes/Boot.ts`:

```ts
import { Scene } from "phaser";

export class Boot extends Scene {
  constructor() {
    super("Boot");
  }

  create(): void {
    this.scene.start("Title");
  }
}
```

`apps/starfighter-assault/src/game/scenes/Title.ts`:

```ts
import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { getFontFamily } from "../../utils/font";

export class Title extends Scene {
  constructor() {
    super("Title");
  }

  create(): void {
    const { width, height } = this.cameras.main;
    const fontFamily = getFontFamily(this);
    this.cameras.main.setBackgroundColor(0x020107);
    this.cameras.main.setPostPipeline("VectorShader");

    this.add
      .text(width / 2, height * 0.36, "STARFIGHTER ASSAULT", {
        fontFamily,
        fontSize: "56px",
        color: "#ff43d6",
        stroke: "#4d2cff",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.54, "PRESS SPACE OR CLICK TO START", {
        fontFamily,
        fontSize: "22px",
        color: "#7be8ff",
      })
      .setOrigin(0.5);

    const startRun = () => this.scene.start("Game");
    this.input.keyboard?.once("keydown-SPACE", startRun);
    this.input.once("pointerdown", startRun);

    EventBus.emit("current-scene-ready", this);
  }
}
```

`apps/starfighter-assault/src/game/scenes/Game.ts`:

```ts
import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { getFontFamily } from "../../utils/font";

export class Game extends Scene {
  constructor() {
    super("Game");
  }

  create(): void {
    const { width, height } = this.cameras.main;
    this.cameras.main.setBackgroundColor(0x020107);
    this.cameras.main.setPostPipeline("VectorShader");

    this.add
      .text(width / 2, height / 2, "COCKPIT SYSTEMS ONLINE", {
        fontFamily: getFontFamily(this),
        fontSize: "28px",
        color: "#7be8ff",
      })
      .setOrigin(0.5);

    EventBus.emit("current-scene-ready", this);
  }
}
```

`apps/starfighter-assault/src/game/scenes/Pause.ts`:

```ts
import { Scene } from "phaser";

export class Pause extends Scene {
  constructor() {
    super("Pause");
  }
}
```

`apps/starfighter-assault/src/game/scenes/GameOver.ts`:

```ts
import { Scene } from "phaser";

export class GameOver extends Scene {
  constructor() {
    super("GameOver");
  }
}
```

- [ ] **Step 6: Run scaffold verification**

Run: `bunx nx show projects | rg "starfighter-assault"`

Expected: output contains `starfighter-assault`.

Run: `bunx nx test starfighter-assault`

Expected: command exits 0 with no test files or with the Vite test runner reporting success.

Run: `bunx nx build starfighter-assault`

Expected: command exits 0 and writes `apps/starfighter-assault/dist`.

- [ ] **Step 7: Commit scaffold**

```bash
git add apps/starfighter-assault
git commit -m "feat(starfighter-assault): scaffold game app" -m "- Add the React and Phaser shell for Starfighter Assault." -m "- Configure Vite, TypeScript, and workspace package metadata."
```

### Task 2: Opening Crawl Scene

**Files:**
- Create: `apps/starfighter-assault/src/game/config/crawl.ts`
- Create: `apps/starfighter-assault/src/game/config/crawl.test.ts`
- Create: `apps/starfighter-assault/src/game/scenes/OpeningCrawl.ts`
- Modify: `apps/starfighter-assault/src/game/main.ts`
- Modify: `apps/starfighter-assault/src/game/scenes/Title.ts`

- [ ] **Step 1: Write the failing crawl config test**

Create `apps/starfighter-assault/src/game/config/crawl.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  CRAWL_DURATION_MS,
  CRAWL_LINES,
  getCrawlText,
} from "./crawl";

describe("opening crawl config", () => {
  it("keeps the crawl short enough for repeat arcade runs", () => {
    expect(CRAWL_DURATION_MS).toBeGreaterThanOrEqual(10_000);
    expect(CRAWL_DURATION_MS).toBeLessThanOrEqual(15_000);
  });

  it("establishes the bounty hunter motive and capital ship target", () => {
    const text = getCrawlText();
    expect(text).toContain("OBSIDIAN CROWN");
    expect(text.toLowerCase()).toContain("bounty");
    expect(text.toLowerCase()).toContain("hunter");
    expect(text.toLowerCase()).toContain("flagship");
  });

  it("uses three short story beats", () => {
    expect(CRAWL_LINES).toHaveLength(3);
    expect(CRAWL_LINES.every((line) => line.length <= 150)).toBe(true);
  });
});
```

- [ ] **Step 2: Run the failing test**

Run: `bunx nx test starfighter-assault -- apps/starfighter-assault/src/game/config/crawl.test.ts`

Expected: FAIL because `./crawl` does not exist.

- [ ] **Step 3: Implement crawl config**

Create `apps/starfighter-assault/src/game/config/crawl.ts`:

```ts
export const CRAWL_DURATION_MS = 12_000;

export const CRAWL_LINES = [
  "On the edge of charted space, the dread carrier OBSIDIAN CROWN burns colonies from the void and vanishes before justice can answer.",
  "A bounty has crossed every outlaw channel: destroy the flagship, claim the fortune, end the terror.",
  "One hunter has followed its ion trail through dead systems and shattered moons. The last jump window is closing. The assault begins now.",
] as const;

export function getCrawlText(): string {
  return CRAWL_LINES.join("\n\n");
}
```

- [ ] **Step 4: Run crawl config test**

Run: `bunx nx test starfighter-assault -- apps/starfighter-assault/src/game/config/crawl.test.ts`

Expected: PASS.

- [ ] **Step 5: Add the scene**

Create `apps/starfighter-assault/src/game/scenes/OpeningCrawl.ts`:

```ts
import { Input, Scene } from "phaser";
import { CRAWL_DURATION_MS, CRAWL_LINES } from "../config/crawl";
import { EventBus } from "../EventBus";
import { getFontFamily } from "../../utils/font";

export class OpeningCrawl extends Scene {
  private hasAdvanced = false;

  constructor() {
    super("OpeningCrawl");
  }

  create(): void {
    const { width, height } = this.cameras.main;
    const fontFamily = getFontFamily(this);
    this.cameras.main.setBackgroundColor(0x020107);
    this.cameras.main.setPostPipeline("VectorShader");

    const text = this.add
      .text(width / 2, height + 80, CRAWL_LINES.join("\n\n"), {
        fontFamily,
        fontSize: "26px",
        align: "center",
        color: "#ff43d6",
        wordWrap: { width: Math.floor(width * 0.72) },
      })
      .setOrigin(0.5, 0);

    this.add
      .text(width / 2, height - 40, "CLICK OR SPACE TO SKIP", {
        fontFamily,
        fontSize: "14px",
        color: "#7be8ff",
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: text,
      y: -text.height - 80,
      duration: CRAWL_DURATION_MS,
      ease: "Linear",
      onComplete: () => this.advance(),
    });

    this.input.once("pointerdown", () => this.advance());
    this.input.keyboard?.once("keydown-SPACE", () => this.advance());
    this.input.keyboard?.once("keydown-ENTER", () => this.advance());
    this.input.keyboard?.once("keydown-ESC", () => this.advance());
    this.input.keyboard
      ?.addKey(Input.Keyboard.KeyCodes.S)
      .once("down", () => this.advance());

    EventBus.emit("current-scene-ready", this);
  }

  private advance(): void {
    if (this.hasAdvanced) return;
    this.hasAdvanced = true;
    this.scene.start("Game");
  }
}
```

- [ ] **Step 6: Wire scene flow**

Modify `apps/starfighter-assault/src/game/main.ts` so `OpeningCrawl` is imported and included between `Title` and `Game`:

```ts
import { OpeningCrawl } from "./scenes/OpeningCrawl";

// scene order:
scene: [Boot, Title, OpeningCrawl, Game, Pause, GameOver],
```

Modify `apps/starfighter-assault/src/game/scenes/Title.ts` start behavior:

```ts
const startRun = () => this.scene.start("OpeningCrawl");
```

- [ ] **Step 7: Run verification**

Run: `bunx nx test starfighter-assault`

Expected: PASS.

Run: `bunx nx build starfighter-assault`

Expected: PASS.

- [ ] **Step 8: Commit crawl**

```bash
git add apps/starfighter-assault/src/game/config apps/starfighter-assault/src/game/scenes/OpeningCrawl.ts apps/starfighter-assault/src/game/main.ts apps/starfighter-assault/src/game/scenes/Title.ts
git commit -m "feat(starfighter-assault): add opening crawl" -m "- Add skippable bounty hunter narrative crawl." -m "- Route title start through the crawl before gameplay."
```

### Task 3: Pure Run State And Finale Progression

**Files:**
- Create: `apps/starfighter-assault/src/game/simulation/RunState.ts`
- Create: `apps/starfighter-assault/src/game/simulation/RunState.test.ts`

- [ ] **Step 1: Write failing run state tests**

Create `apps/starfighter-assault/src/game/simulation/RunState.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  createInitialRunState,
  damageShield,
  finishSegment,
  getCurrentPhase,
  progressFinale,
} from "./RunState";

describe("run state", () => {
  it("starts every run with 3 lives and baseline combat resources", () => {
    const state = createInitialRunState(1234);
    expect(state.lives).toBe(3);
    expect(state.shields.current).toBe(state.shields.max);
    expect(state.weapons.torpedoes).toBe(3);
    expect(state.currentSegmentIndex).toBe(0);
    expect(getCurrentPhase(state)).toBe("segment");
  });

  it("spends one life when shields fail and restores baseline shields", () => {
    const state = createInitialRunState(1234);
    const damaged = damageShield(state, state.shields.max + 1);
    expect(damaged.lives).toBe(2);
    expect(damaged.shields.current).toBe(damaged.shields.max);
    expect(damaged.status).toBe("segment-checkpoint");
  });

  it("moves to the finale after three segments", () => {
    const state = createInitialRunState(1234);
    const afterOne = finishSegment(state);
    const afterTwo = finishSegment(afterOne);
    const afterThree = finishSegment(afterTwo);
    expect(afterThree.currentSegmentIndex).toBe(3);
    expect(getCurrentPhase(afterThree)).toBe("finale");
    expect(afterThree.finale.stage).toBe("approach");
  });

  it("progresses through fixed capital ship finale stages", () => {
    const finaleState = finishSegment(
      finishSegment(finishSegment(createInitialRunState(1234))),
    );
    const surface = progressFinale(finaleState);
    const weakPoint = progressFinale(surface);
    const escape = progressFinale(weakPoint);
    const complete = progressFinale(escape);
    expect(surface.finale.stage).toBe("surface-skim");
    expect(weakPoint.finale.stage).toBe("weak-point-pass");
    expect(escape.finale.stage).toBe("escape");
    expect(complete.status).toBe("victory");
  });
});
```

- [ ] **Step 2: Run failing tests**

Run: `bunx nx test starfighter-assault -- apps/starfighter-assault/src/game/simulation/RunState.test.ts`

Expected: FAIL because `./RunState` does not exist.

- [ ] **Step 3: Implement run state**

Create `apps/starfighter-assault/src/game/simulation/RunState.ts`:

```ts
export type RunStatus =
  | "playing"
  | "segment-checkpoint"
  | "upgrade-shop"
  | "victory"
  | "game-over";

export type FinaleStage =
  | "approach"
  | "surface-skim"
  | "weak-point-pass"
  | "escape"
  | "complete";

export interface RunState {
  seed: number;
  lives: number;
  currentSegmentIndex: number;
  status: RunStatus;
  bounties: number;
  shields: {
    current: number;
    max: number;
  };
  weapons: {
    torpedoes: number;
    torpedoCapacity: number;
  };
  finale: {
    stage: FinaleStage;
  };
}

const SEGMENTS_BEFORE_FINALE = 3;
const BASE_SHIELDS = 100;
const BASE_TORPEDOES = 3;

export function createInitialRunState(seed: number): RunState {
  return {
    seed,
    lives: 3,
    currentSegmentIndex: 0,
    status: "playing",
    bounties: 0,
    shields: {
      current: BASE_SHIELDS,
      max: BASE_SHIELDS,
    },
    weapons: {
      torpedoes: BASE_TORPEDOES,
      torpedoCapacity: BASE_TORPEDOES,
    },
    finale: {
      stage: "approach",
    },
  };
}

export function getCurrentPhase(state: RunState): "segment" | "finale" {
  return state.currentSegmentIndex >= SEGMENTS_BEFORE_FINALE
    ? "finale"
    : "segment";
}

export function damageShield(state: RunState, damage: number): RunState {
  const nextShield = state.shields.current - damage;
  if (nextShield > 0) {
    return {
      ...state,
      shields: { ...state.shields, current: nextShield },
    };
  }

  const nextLives = state.lives - 1;
  return {
    ...state,
    lives: nextLives,
    status: nextLives <= 0 ? "game-over" : "segment-checkpoint",
    shields: { ...state.shields, current: state.shields.max },
  };
}

export function finishSegment(state: RunState): RunState {
  const currentSegmentIndex = state.currentSegmentIndex + 1;
  return {
    ...state,
    currentSegmentIndex,
    status:
      currentSegmentIndex >= SEGMENTS_BEFORE_FINALE ? "playing" : "upgrade-shop",
  };
}

export function progressFinale(state: RunState): RunState {
  const stageOrder: FinaleStage[] = [
    "approach",
    "surface-skim",
    "weak-point-pass",
    "escape",
    "complete",
  ];
  const currentIndex = stageOrder.indexOf(state.finale.stage);
  const nextStage = stageOrder[Math.min(currentIndex + 1, stageOrder.length - 1)];
  return {
    ...state,
    status: nextStage === "complete" ? "victory" : state.status,
    finale: { stage: nextStage },
  };
}
```

- [ ] **Step 4: Run run state tests**

Run: `bunx nx test starfighter-assault -- apps/starfighter-assault/src/game/simulation/RunState.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit run state**

```bash
git add apps/starfighter-assault/src/game/simulation/RunState.ts apps/starfighter-assault/src/game/simulation/RunState.test.ts
git commit -m "feat(starfighter-assault): add run state model" -m "- Model lives, shields, segment progression, and finale stages." -m "- Add unit tests for run start, shield failure, and victory progression."
```

### Task 4: Constrained Procedural Route Generator

**Files:**
- Create: `apps/starfighter-assault/src/game/rail/SegmentTypes.ts`
- Create: `apps/starfighter-assault/src/game/rail/RouteGenerator.ts`
- Create: `apps/starfighter-assault/src/game/rail/RouteGenerator.test.ts`

- [ ] **Step 1: Write failing generator tests**

Create `apps/starfighter-assault/src/game/rail/RouteGenerator.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { generateSortie } from "./RouteGenerator";

describe("route generator", () => {
  it("generates three combat segments and a fixed capital ship finale", () => {
    const sortie = generateSortie({ seed: 42, difficulty: 1 });
    expect(sortie.segments).toHaveLength(3);
    expect(sortie.finale.kind).toBe("capital-ship");
  });

  it("keeps every segment inside pressure and steering constraints", () => {
    const sortie = generateSortie({ seed: 99, difficulty: 3 });
    for (const segment of sortie.segments) {
      expect(segment.constraints.maxSimultaneousThreats).toBeLessThanOrEqual(8);
      expect(segment.constraints.routeCurvature).toBeLessThanOrEqual(
        segment.constraints.maxRouteCurvature,
      );
      expect(segment.constraints.guaranteedDodgeLanes).toBeGreaterThanOrEqual(1);
      expect(segment.pickups.every((pickup) => pickup.inForcedDamageLane)).toBe(
        false,
      );
      expect(segment.bountyOpportunities).toBeGreaterThanOrEqual(1);
    }
  });

  it("creates two branch choices after the first two segments", () => {
    const sortie = generateSortie({ seed: 7, difficulty: 2 });
    expect(sortie.branches).toHaveLength(2);
    expect(sortie.branches[0]).toHaveLength(2);
    expect(sortie.branches[1]).toHaveLength(2);
    expect(sortie.branches[0][0].label).toMatch(/:/);
  });
});
```

- [ ] **Step 2: Run failing generator tests**

Run: `bunx nx test starfighter-assault -- apps/starfighter-assault/src/game/rail/RouteGenerator.test.ts`

Expected: FAIL because `./RouteGenerator` does not exist.

- [ ] **Step 3: Implement segment types**

Create `apps/starfighter-assault/src/game/rail/SegmentTypes.ts`:

```ts
export type SegmentRole =
  | "approach"
  | "battery-field"
  | "interceptor-screen"
  | "debris-corridor"
  | "trench-run";

export type ThreatKind =
  | "fighter"
  | "elite-fighter"
  | "mine"
  | "turret"
  | "shield-node"
  | "gun-emplacement"
  | "debris";

export type PickupKind = "torpedo" | "shield" | "bounty-cache";

export interface SegmentConstraints {
  maxSimultaneousThreats: number;
  guaranteedDodgeLanes: number;
  routeCurvature: number;
  maxRouteCurvature: number;
  flightBoxWidth: number;
  flightBoxHeight: number;
}

export interface SegmentPickup {
  kind: PickupKind;
  lane: number;
  inForcedDamageLane: boolean;
}

export interface GeneratedSegment {
  id: string;
  role: SegmentRole;
  label: string;
  allowedThreats: ThreatKind[];
  constraints: SegmentConstraints;
  pickups: SegmentPickup[];
  bountyOpportunities: number;
}

export interface BranchChoice {
  segmentId: string;
  label: string;
  risk: "low" | "medium" | "high";
  reward: "shield" | "torpedo" | "bounty" | "elite";
}

export interface GeneratedSortie {
  seed: number;
  difficulty: number;
  segments: GeneratedSegment[];
  branches: [BranchChoice[], BranchChoice[]];
  finale: {
    kind: "capital-ship";
    label: string;
  };
}
```

- [ ] **Step 4: Implement deterministic generator**

Create `apps/starfighter-assault/src/game/rail/RouteGenerator.ts`:

```ts
import type {
  BranchChoice,
  GeneratedSegment,
  GeneratedSortie,
  PickupKind,
  SegmentRole,
  ThreatKind,
} from "./SegmentTypes";

interface GenerateSortieOptions {
  seed: number;
  difficulty: number;
}

const ROLE_ORDER: SegmentRole[] = [
  "approach",
  "battery-field",
  "interceptor-screen",
  "debris-corridor",
  "trench-run",
];

const ROLE_THREATS: Record<SegmentRole, ThreatKind[]> = {
  approach: ["fighter", "mine"],
  "battery-field": ["turret", "gun-emplacement", "fighter"],
  "interceptor-screen": ["fighter", "elite-fighter"],
  "debris-corridor": ["debris", "mine", "fighter"],
  "trench-run": ["turret", "shield-node", "gun-emplacement"],
};

const ROLE_PICKUPS: Record<SegmentRole, PickupKind[]> = {
  approach: ["shield", "bounty-cache"],
  "battery-field": ["bounty-cache"],
  "interceptor-screen": ["torpedo", "bounty-cache"],
  "debris-corridor": ["torpedo", "shield"],
  "trench-run": ["bounty-cache", "torpedo"],
};

export function generateSortie(options: GenerateSortieOptions): GeneratedSortie {
  const random = createSeededRandom(options.seed);
  const roles = pickRoles(random);
  const difficulty = clamp(Math.floor(options.difficulty), 1, 9);
  const segments = roles.map((role, index) =>
    createSegment(role, index, difficulty, random),
  );

  return {
    seed: options.seed,
    difficulty,
    segments,
    branches: [
      createBranches(segments[1], segments[2]),
      createBranches(segments[2], segments[0]),
    ],
    finale: {
      kind: "capital-ship",
      label: "Capital Ship: Obsidian Crown",
    },
  };
}

function pickRoles(random: () => number): SegmentRole[] {
  const first = "approach";
  const second = ROLE_ORDER[1 + Math.floor(random() * 3)];
  const third = ROLE_ORDER[2 + Math.floor(random() * 3)] ?? "trench-run";
  return [first, second, third];
}

function createSegment(
  role: SegmentRole,
  index: number,
  difficulty: number,
  random: () => number,
): GeneratedSegment {
  const pressure = difficulty + index + 2;
  const maxRouteCurvature = role === "trench-run" ? 0.45 : 0.65;
  const routeCurvature = round(Math.min(maxRouteCurvature, random() * 0.5 + 0.1));
  const pickupKinds = ROLE_PICKUPS[role];
  return {
    id: `${index + 1}-${role}`,
    role,
    label: formatRoleLabel(role),
    allowedThreats: ROLE_THREATS[role],
    constraints: {
      maxSimultaneousThreats: clamp(pressure, 3, 8),
      guaranteedDodgeLanes: role === "trench-run" ? 1 : 2,
      routeCurvature,
      maxRouteCurvature,
      flightBoxWidth: role === "trench-run" ? 420 : 620,
      flightBoxHeight: role === "trench-run" ? 260 : 380,
    },
    pickups: pickupKinds.map((kind, pickupIndex) => ({
      kind,
      lane: pickupIndex - 1,
      inForcedDamageLane: false,
    })),
    bountyOpportunities: role === "debris-corridor" ? 1 : 2 + index,
  };
}

function createBranches(
  left: GeneratedSegment,
  right: GeneratedSegment,
): BranchChoice[] {
  return [
    {
      segmentId: left.id,
      label: `${left.label}: ${rewardLabel(left.role)}`,
      risk: left.role === "debris-corridor" ? "low" : "medium",
      reward: rewardKind(left.role),
    },
    {
      segmentId: right.id,
      label: `${right.label}: ${rewardLabel(right.role)}`,
      risk: right.role === "trench-run" ? "high" : "medium",
      reward: rewardKind(right.role),
    },
  ];
}

function rewardKind(role: SegmentRole): BranchChoice["reward"] {
  if (role === "debris-corridor") return "torpedo";
  if (role === "battery-field" || role === "trench-run") return "bounty";
  if (role === "interceptor-screen") return "elite";
  return "shield";
}

function rewardLabel(role: SegmentRole): string {
  const reward = rewardKind(role);
  if (reward === "torpedo") return "Torpedo Cache";
  if (reward === "bounty") return "High Bounty";
  if (reward === "elite") return "Elite Ace";
  return "Shield Boost";
}

function formatRoleLabel(role: SegmentRole): string {
  return role
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function createSeededRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
```

- [ ] **Step 5: Run generator tests**

Run: `bunx nx test starfighter-assault -- apps/starfighter-assault/src/game/rail/RouteGenerator.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit route generator**

```bash
git add apps/starfighter-assault/src/game/rail
git commit -m "feat(starfighter-assault): add constrained sortie generator" -m "- Generate three procedural combat segments and a capital ship finale." -m "- Enforce route pressure, pickup safety, and branch choice constraints."
```

### Task 5: Weapons, Bounties, And Upgrades

**Files:**
- Create: `apps/starfighter-assault/src/game/simulation/Weapons.ts`
- Create: `apps/starfighter-assault/src/game/simulation/Weapons.test.ts`
- Create: `apps/starfighter-assault/src/game/simulation/Bounties.ts`
- Create: `apps/starfighter-assault/src/game/simulation/Bounties.test.ts`
- Create: `apps/starfighter-assault/src/game/simulation/Upgrades.ts`
- Create: `apps/starfighter-assault/src/game/simulation/Upgrades.test.ts`

- [ ] **Step 1: Write failing simulation tests**

Create `Weapons.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createWeaponsState, fireLaser, fireTorpedo } from "./Weapons";

describe("weapons", () => {
  it("dual lasers can fire forever without ammo", () => {
    let state = createWeaponsState();
    for (let i = 0; i < 100; i++) {
      const result = fireLaser(state, { x: 0, y: 0 });
      state = result.state;
      expect(result.shots).toHaveLength(2);
    }
    expect(state.laserHeat).toBeLessThanOrEqual(100);
  });

  it("torpedoes are limited by inventory", () => {
    let state = createWeaponsState();
    state = fireTorpedo(state).state;
    state = fireTorpedo(state).state;
    state = fireTorpedo(state).state;
    const empty = fireTorpedo(state);
    expect(empty.fired).toBe(false);
    expect(empty.state.torpedoes).toBe(0);
  });
});
```

Create `Bounties.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { awardBounty, createBountyState } from "./Bounties";

describe("bounties", () => {
  it("awards higher values for capital ship subsystems", () => {
    const state = createBountyState();
    const fighter = awardBounty(state, "fighter", 0);
    const subsystem = awardBounty(state, "capital-subsystem", 0);
    expect(subsystem.total).toBeGreaterThan(fighter.total);
  });

  it("keeps streak multiplier modest", () => {
    let state = createBountyState();
    state = awardBounty(state, "fighter", 1000);
    state = awardBounty(state, "fighter", 2000);
    state = awardBounty(state, "fighter", 3000);
    expect(state.multiplier).toBeLessThanOrEqual(1.5);
  });
});
```

Create `Upgrades.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  createUpgradeState,
  getAvailableUpgrades,
  purchaseUpgrade,
} from "./Upgrades";

describe("upgrades", () => {
  it("prevents purchases without enough bounties", () => {
    const state = createUpgradeState(25);
    const result = purchaseUpgrade(state, "laser-damage-1");
    expect(result.purchased).toBe(false);
    expect(result.state.bounties).toBe(25);
  });

  it("applies laser damage upgrade and spends bounties", () => {
    const state = createUpgradeState(200);
    const result = purchaseUpgrade(state, "laser-damage-1");
    expect(result.purchased).toBe(true);
    expect(result.state.laserDamageMultiplier).toBe(1.25);
    expect(result.state.bounties).toBe(100);
  });

  it("offers extra life only as expensive rare upgrade", () => {
    const upgrades = getAvailableUpgrades();
    const extraLife = upgrades.find((upgrade) => upgrade.id === "extra-life");
    expect(extraLife?.cost).toBeGreaterThanOrEqual(500);
    expect(extraLife?.rarity).toBe("rare");
  });
});
```

- [ ] **Step 2: Run failing tests**

Run: `bunx nx test starfighter-assault -- apps/starfighter-assault/src/game/simulation`

Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Implement weapons**

Create `Weapons.ts`:

```ts
export interface AimPoint {
  x: number;
  y: number;
}

export interface LaserShot {
  origin: "left-cannon" | "right-cannon";
  target: AimPoint;
  damage: number;
}

export interface WeaponsState {
  laserHeat: number;
  laserDamage: number;
  torpedoes: number;
  torpedoCapacity: number;
}

export function createWeaponsState(): WeaponsState {
  return {
    laserHeat: 0,
    laserDamage: 10,
    torpedoes: 3,
    torpedoCapacity: 3,
  };
}

export function fireLaser(
  state: WeaponsState,
  target: AimPoint,
): { state: WeaponsState; shots: LaserShot[] } {
  return {
    state: {
      ...state,
      laserHeat: Math.min(100, state.laserHeat + 3),
    },
    shots: [
      { origin: "left-cannon", target, damage: state.laserDamage },
      { origin: "right-cannon", target, damage: state.laserDamage },
    ],
  };
}

export function fireTorpedo(
  state: WeaponsState,
): { state: WeaponsState; fired: boolean; damage: number } {
  if (state.torpedoes <= 0) {
    return { state, fired: false, damage: 0 };
  }

  return {
    state: { ...state, torpedoes: state.torpedoes - 1 },
    fired: true,
    damage: 90,
  };
}
```

- [ ] **Step 4: Implement bounties**

Create `Bounties.ts`:

```ts
export type BountyTarget =
  | "fighter"
  | "elite-fighter"
  | "turret"
  | "gun-emplacement"
  | "shield-node"
  | "capital-subsystem"
  | "bounty-cache";

export interface BountyState {
  total: number;
  streak: number;
  multiplier: number;
  lastAwardTimeMs: number;
}

const BASE_VALUES: Record<BountyTarget, number> = {
  fighter: 25,
  "elite-fighter": 75,
  turret: 50,
  "gun-emplacement": 65,
  "shield-node": 80,
  "capital-subsystem": 150,
  "bounty-cache": 100,
};

export function createBountyState(): BountyState {
  return {
    total: 0,
    streak: 0,
    multiplier: 1,
    lastAwardTimeMs: 0,
  };
}

export function awardBounty(
  state: BountyState,
  target: BountyTarget,
  timeMs: number,
): BountyState {
  const inStreak = timeMs - state.lastAwardTimeMs <= 2500;
  const streak = inStreak ? state.streak + 1 : 1;
  const multiplier = Math.min(1.5, 1 + (streak - 1) * 0.1);
  return {
    total: state.total + Math.round(BASE_VALUES[target] * multiplier),
    streak,
    multiplier,
    lastAwardTimeMs: timeMs,
  };
}
```

- [ ] **Step 5: Implement upgrades**

Create `Upgrades.ts`:

```ts
export type UpgradeRarity = "common" | "uncommon" | "rare";

export type UpgradeId =
  | "laser-damage-1"
  | "laser-fire-rate-1"
  | "torpedo-capacity-1"
  | "shield-max-1"
  | "radar-clarity-1"
  | "extra-life";

export interface UpgradeDefinition {
  id: UpgradeId;
  label: string;
  cost: number;
  rarity: UpgradeRarity;
}

export interface UpgradeState {
  bounties: number;
  laserDamageMultiplier: number;
  laserFireRateMultiplier: number;
  torpedoCapacityBonus: number;
  shieldMaxBonus: number;
  radarClarity: number;
  extraLives: number;
  purchased: UpgradeId[];
}

const UPGRADE_CATALOG: UpgradeDefinition[] = [
  { id: "laser-damage-1", label: "Laser Damage +25%", cost: 100, rarity: "common" },
  { id: "laser-fire-rate-1", label: "Laser Fire Rate +15%", cost: 125, rarity: "common" },
  { id: "torpedo-capacity-1", label: "Torpedo Rack +1", cost: 150, rarity: "uncommon" },
  { id: "shield-max-1", label: "Shield Max +25", cost: 150, rarity: "uncommon" },
  { id: "radar-clarity-1", label: "Radar Clarity", cost: 90, rarity: "common" },
  { id: "extra-life", label: "Extra Life", cost: 600, rarity: "rare" },
];

export function createUpgradeState(bounties: number): UpgradeState {
  return {
    bounties,
    laserDamageMultiplier: 1,
    laserFireRateMultiplier: 1,
    torpedoCapacityBonus: 0,
    shieldMaxBonus: 0,
    radarClarity: 1,
    extraLives: 0,
    purchased: [],
  };
}

export function getAvailableUpgrades(): UpgradeDefinition[] {
  return UPGRADE_CATALOG.map((upgrade) => ({ ...upgrade }));
}

export function purchaseUpgrade(
  state: UpgradeState,
  id: UpgradeId,
): { purchased: boolean; state: UpgradeState } {
  const definition = UPGRADE_CATALOG.find((upgrade) => upgrade.id === id);
  if (!definition || state.bounties < definition.cost) {
    return { purchased: false, state };
  }

  const next: UpgradeState = {
    ...state,
    bounties: state.bounties - definition.cost,
    purchased: [...state.purchased, id],
  };

  if (id === "laser-damage-1") next.laserDamageMultiplier = 1.25;
  if (id === "laser-fire-rate-1") next.laserFireRateMultiplier = 1.15;
  if (id === "torpedo-capacity-1") next.torpedoCapacityBonus = 1;
  if (id === "shield-max-1") next.shieldMaxBonus = 25;
  if (id === "radar-clarity-1") next.radarClarity = 1.25;
  if (id === "extra-life") next.extraLives = 1;

  return { purchased: true, state: next };
}
```

- [ ] **Step 6: Run simulation tests**

Run: `bunx nx test starfighter-assault -- apps/starfighter-assault/src/game/simulation`

Expected: PASS.

- [ ] **Step 7: Commit combat economy**

```bash
git add apps/starfighter-assault/src/game/simulation
git commit -m "feat(starfighter-assault): add weapons and bounty upgrades" -m "- Model dual lasers, limited torpedoes, bounty rewards, and temporary upgrades." -m "- Add unit tests for ammo rules, bounty streaks, and purchases."
```

### Task 6: Radar Projection

**Files:**
- Create: `apps/starfighter-assault/src/game/hud/RadarProjection.ts`
- Create: `apps/starfighter-assault/src/game/hud/RadarProjection.test.ts`

- [ ] **Step 1: Write failing radar tests**

Create `RadarProjection.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { projectThreatsToRadar } from "./RadarProjection";

describe("radar projection", () => {
  it("only includes threats in the forward combat view", () => {
    const dots = projectThreatsToRadar([
      { id: "front", x: 0, y: 0, z: 500, threat: 0.5 },
      { id: "behind", x: 0, y: 0, z: -200, threat: 1 },
    ]);
    expect(dots.map((dot) => dot.id)).toEqual(["front"]);
  });

  it("makes close threats brighter and larger than distant threats", () => {
    const dots = projectThreatsToRadar([
      { id: "far", x: 0, y: 0, z: 1500, threat: 0.2 },
      { id: "near", x: 0, y: 0, z: 150, threat: 1 },
    ]);
    const far = dots.find((dot) => dot.id === "far")!;
    const near = dots.find((dot) => dot.id === "near")!;
    expect(near.alpha).toBeGreaterThan(far.alpha);
    expect(near.radius).toBeGreaterThan(far.radius);
  });

  it("maps world x positions into an ovular radar", () => {
    const [left, right] = projectThreatsToRadar([
      { id: "left", x: -300, y: 0, z: 600, threat: 0.5 },
      { id: "right", x: 300, y: 0, z: 600, threat: 0.5 },
    ]);
    expect(left.x).toBeLessThan(0);
    expect(right.x).toBeGreaterThan(0);
    expect(Math.abs(left.y)).toBeLessThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run failing radar tests**

Run: `bunx nx test starfighter-assault -- apps/starfighter-assault/src/game/hud/RadarProjection.test.ts`

Expected: FAIL because `./RadarProjection` does not exist.

- [ ] **Step 3: Implement radar projection**

Create `RadarProjection.ts`:

```ts
export interface RadarThreat {
  id: string;
  x: number;
  y: number;
  z: number;
  threat: number;
}

export interface RadarDot {
  id: string;
  x: number;
  y: number;
  radius: number;
  alpha: number;
  color: number;
}

const MAX_RANGE = 1800;
const HALF_WIDTH = 700;

export function projectThreatsToRadar(threats: RadarThreat[]): RadarDot[] {
  return threats
    .filter((threat) => threat.z > 0 && threat.z <= MAX_RANGE)
    .map((threat) => {
      const distanceFactor = 1 - threat.z / MAX_RANGE;
      return {
        id: threat.id,
        x: clamp(threat.x / HALF_WIDTH, -1, 1),
        y: clamp(1 - threat.z / MAX_RANGE, -1, 1),
        radius: 2 + distanceFactor * 5 + threat.threat * 2,
        alpha: clamp(0.3 + distanceFactor * 0.6 + threat.threat * 0.2, 0.3, 1),
        color: distanceFactor > 0.65 || threat.threat > 0.75 ? 0xff1f35 : 0xd35f67,
      };
    });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
```

- [ ] **Step 4: Run radar tests**

Run: `bunx nx test starfighter-assault -- apps/starfighter-assault/src/game/hud/RadarProjection.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit radar math**

```bash
git add apps/starfighter-assault/src/game/hud
git commit -m "feat(starfighter-assault): add radar projection" -m "- Map forward-view threats onto the ovular cockpit radar." -m "- Scale radar dot color, alpha, and size by distance and threat."
```

### Task 7: Wireframe Engine And Cockpit Rendering

**Files:**
- Create: `apps/starfighter-assault/src/game/engine/Vector3D.ts`
- Create: `apps/starfighter-assault/src/game/engine/Vector3D.test.ts`
- Create: `apps/starfighter-assault/src/game/engine/Camera3D.ts`
- Create: `apps/starfighter-assault/src/game/engine/Camera3D.test.ts`
- Create: `apps/starfighter-assault/src/game/engine/WireframeModel.ts`
- Create: `apps/starfighter-assault/src/game/engine/WireframeRenderer.ts`
- Create: `apps/starfighter-assault/src/game/objects/CockpitHud.ts`
- Modify: `apps/starfighter-assault/src/game/scenes/Game.ts`

- [ ] **Step 1: Copy and own the wireframe primitives**

Copy these files from `apps/battle-tanks/src/game/engine` to `apps/starfighter-assault/src/game/engine`:

```text
Vector3D.ts
Vector3D.test.ts
Camera3D.ts
Camera3D.test.ts
WireframeModel.ts
WireframeRenderer.ts
```

Keep imports local to `./Vector3D`, `./Camera3D`, and `./WireframeModel`.

- [ ] **Step 2: Run copied engine tests**

Run: `bunx nx test starfighter-assault -- apps/starfighter-assault/src/game/engine`

Expected: PASS.

- [ ] **Step 3: Implement cockpit HUD renderer**

Create `apps/starfighter-assault/src/game/objects/CockpitHud.ts`:

```ts
import type { GameObjects, Scene } from "phaser";
import type { RadarDot } from "../hud/RadarProjection";

export class CockpitHud {
  private graphics: GameObjects.Graphics;

  constructor(scene: Scene) {
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(100);
  }

  render(width: number, height: number, dots: RadarDot[]): void {
    this.graphics.clear();
    this.drawCockpitFrame(width, height);
    this.drawCannons(width, height);
    this.drawReticle(width, height);
    this.drawRadar(width, height, dots);
  }

  destroy(): void {
    this.graphics.destroy();
  }

  private drawCockpitFrame(width: number, height: number): void {
    const bottom = height;
    const consoleTop = height * 0.72;
    this.graphics.lineStyle(3, 0x4d7cff, 0.9);
    this.graphics.strokePoints(
      [
        { x: 0, y: height * 0.42 },
        { x: width * 0.22, y: consoleTop },
        { x: width * 0.36, y: height * 0.66 },
        { x: width * 0.64, y: height * 0.66 },
        { x: width * 0.78, y: consoleTop },
        { x: width, y: height * 0.42 },
      ],
      false,
    );

    this.graphics.lineStyle(2, 0x7be8ff, 0.75);
    this.graphics.strokeRect(width * 0.08, height * 0.76, width * 0.18, height * 0.14);
    this.graphics.strokeRect(width * 0.74, height * 0.76, width * 0.18, height * 0.14);
    this.graphics.strokeEllipse(width * 0.5, height * 0.83, width * 0.26, height * 0.1);

    this.graphics.lineStyle(3, 0x9bb3ff, 0.6);
    this.graphics.strokePoints(
      [
        { x: width * 0.44, y: bottom },
        { x: width * 0.5, y: height * 0.69 },
        { x: width * 0.56, y: bottom },
      ],
      false,
    );
  }

  private drawCannons(width: number, height: number): void {
    this.graphics.lineStyle(4, 0xff43d6, 1);
    this.graphics.strokePoints(
      [
        { x: 18, y: height * 0.5 },
        { x: 82, y: height * 0.54 },
        { x: 18, y: height * 0.58 },
      ],
      false,
    );
    this.graphics.strokePoints(
      [
        { x: width - 18, y: height * 0.5 },
        { x: width - 82, y: height * 0.54 },
        { x: width - 18, y: height * 0.58 },
      ],
      false,
    );
  }

  private drawReticle(width: number, height: number): void {
    const x = width / 2;
    const y = height * 0.36;
    this.graphics.lineStyle(2, 0xff43d6, 1);
    this.graphics.strokeCircle(x, y, 30);
    this.graphics.lineBetween(x - 50, y, x + 50, y);
    this.graphics.lineBetween(x, y - 50, x, y + 50);
  }

  private drawRadar(width: number, height: number, dots: RadarDot[]): void {
    const cx = width / 2;
    const cy = height * 0.83;
    const rx = width * 0.13;
    const ry = height * 0.05;
    this.graphics.lineStyle(2, 0x7be8ff, 1);
    this.graphics.strokeEllipse(cx, cy, rx * 2, ry * 2);

    for (const dot of dots) {
      this.graphics.fillStyle(dot.color, dot.alpha);
      this.graphics.fillCircle(cx + dot.x * rx, cy - dot.y * ry, dot.radius);
    }
  }
}
```

- [ ] **Step 4: Render cockpit in Game scene**

Modify `Game.ts`:

```ts
import { CockpitHud } from "../objects/CockpitHud";
import { projectThreatsToRadar } from "../hud/RadarProjection";

private cockpitHud!: CockpitHud;

// in create()
this.cockpitHud = new CockpitHud(this);

// add update()
update(): void {
  const { width, height } = this.cameras.main;
  const radarDots = projectThreatsToRadar([
    { id: "fighter-a", x: -240, y: 0, z: 1100, threat: 0.3 },
    { id: "fighter-b", x: 160, y: 0, z: 420, threat: 0.8 },
  ]);
  this.cockpitHud.render(width, height, radarDots);
}
```

- [ ] **Step 5: Run verification**

Run: `bunx nx test starfighter-assault`

Expected: PASS.

Run: `bunx nx build starfighter-assault`

Expected: PASS.

- [ ] **Step 6: Commit cockpit rendering**

```bash
git add apps/starfighter-assault/src/game/engine apps/starfighter-assault/src/game/objects/CockpitHud.ts apps/starfighter-assault/src/game/scenes/Game.ts
git commit -m "feat(starfighter-assault): render cockpit hud" -m "- Add local wireframe engine primitives." -m "- Render cockpit frame, radar, reticle, and side laser cannon protrusions."
```

### Task 8: Mouse Flight Box And Firing Hooks

**Files:**
- Create: `apps/starfighter-assault/src/game/objects/RailPlayer.ts`
- Create: `apps/starfighter-assault/src/game/objects/RailPlayer.test.ts`
- Modify: `apps/starfighter-assault/src/game/scenes/Game.ts`

- [ ] **Step 1: Write failing player movement tests**

Create `RailPlayer.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { RailPlayer } from "./RailPlayer";

describe("rail player", () => {
  it("maps pointer position into a clamped flight box target", () => {
    const player = new RailPlayer({ width: 620, height: 380 });
    player.setPointerTarget(9999, -9999);
    expect(player.target.x).toBe(310);
    expect(player.target.y).toBe(-190);
  });

  it("eases ship position toward the target", () => {
    const player = new RailPlayer({ width: 620, height: 380 });
    player.setPointerTarget(100, 50);
    player.update(0.5);
    expect(player.position.x).toBeGreaterThan(0);
    expect(player.position.y).toBeGreaterThan(0);
    expect(player.position.x).toBeLessThanOrEqual(100);
  });
});
```

- [ ] **Step 2: Run failing player tests**

Run: `bunx nx test starfighter-assault -- apps/starfighter-assault/src/game/objects/RailPlayer.test.ts`

Expected: FAIL because `./RailPlayer` does not exist.

- [ ] **Step 3: Implement RailPlayer**

Create `RailPlayer.ts`:

```ts
export interface FlightBox {
  width: number;
  height: number;
}

export interface FlightPoint {
  x: number;
  y: number;
}

export class RailPlayer {
  readonly position: FlightPoint = { x: 0, y: 0 };
  readonly target: FlightPoint = { x: 0, y: 0 };

  constructor(private readonly flightBox: FlightBox) {}

  setPointerTarget(x: number, y: number): void {
    this.target.x = clamp(x, -this.flightBox.width / 2, this.flightBox.width / 2);
    this.target.y = clamp(y, -this.flightBox.height / 2, this.flightBox.height / 2);
  }

  update(deltaSeconds: number): void {
    const ease = Math.min(1, deltaSeconds * 6);
    this.position.x += (this.target.x - this.position.x) * ease;
    this.position.y += (this.target.y - this.position.y) * ease;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
```

- [ ] **Step 4: Run player tests**

Run: `bunx nx test starfighter-assault -- apps/starfighter-assault/src/game/objects/RailPlayer.test.ts`

Expected: PASS.

- [ ] **Step 5: Wire pointer and fire inputs in Game scene**

Modify `Game.ts`:

```ts
import { RailPlayer } from "../objects/RailPlayer";
import { createWeaponsState, fireLaser, fireTorpedo, type WeaponsState } from "../simulation/Weapons";

private player!: RailPlayer;
private weapons!: WeaponsState;

// in create()
this.player = new RailPlayer({ width: 620, height: 380 });
this.weapons = createWeaponsState();

this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
  const { width, height } = this.cameras.main;
  this.player.setPointerTarget(pointer.x - width / 2, pointer.y - height / 2);
});

this.input.on("pointerdown", () => {
  const result = fireLaser(this.weapons, this.player.target);
  this.weapons = result.state;
});

this.input.keyboard?.on("keydown-SPACE", () => {
  const result = fireLaser(this.weapons, this.player.target);
  this.weapons = result.state;
});

this.input.keyboard?.on("keydown-SHIFT", () => {
  const result = fireTorpedo(this.weapons);
  this.weapons = result.state;
});

// in update(time, delta)
this.player.update(delta / 1000);
```

- [ ] **Step 6: Run verification**

Run: `bunx nx test starfighter-assault`

Expected: PASS.

Run: `bunx nx build starfighter-assault`

Expected: PASS.

- [ ] **Step 7: Commit player input**

```bash
git add apps/starfighter-assault/src/game/objects/RailPlayer.ts apps/starfighter-assault/src/game/objects/RailPlayer.test.ts apps/starfighter-assault/src/game/scenes/Game.ts
git commit -m "feat(starfighter-assault): add mouse flight controls" -m "- Map mouse position into a clamped cockpit flight box." -m "- Hook lasers and torpedoes to primary inputs."
```

### Task 9: Threats, Segment Flow, Upgrade Shop, And Finale Placeholder

**Files:**
- Create: `apps/starfighter-assault/src/game/objects/Threats.ts`
- Create: `apps/starfighter-assault/src/game/objects/Threats.test.ts`
- Create: `apps/starfighter-assault/src/game/scenes/UpgradeShop.ts`
- Modify: `apps/starfighter-assault/src/game/main.ts`
- Modify: `apps/starfighter-assault/src/game/scenes/Game.ts`

- [ ] **Step 1: Write failing threat lifecycle tests**

Create `Threats.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createThreatWave, damageThreat, getAliveThreats } from "./Threats";

describe("threats", () => {
  it("creates threat models from allowed segment enemies", () => {
    const threats = createThreatWave(["fighter", "turret"], 2);
    expect(threats.map((threat) => threat.kind)).toEqual(["fighter", "turret"]);
    expect(threats.every((threat) => threat.health > 0)).toBe(true);
  });

  it("removes destroyed threats from alive list", () => {
    const [fighter] = createThreatWave(["fighter"], 1);
    const destroyed = damageThreat(fighter, fighter.health);
    expect(getAliveThreats([destroyed])).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run failing tests**

Run: `bunx nx test starfighter-assault -- apps/starfighter-assault/src/game/objects/Threats.test.ts`

Expected: FAIL because `./Threats` does not exist.

- [ ] **Step 3: Implement threat model**

Create `Threats.ts`:

```ts
import type { ThreatKind } from "../rail/SegmentTypes";

export interface Threat {
  id: string;
  kind: ThreatKind;
  health: number;
  bountyValue: number;
  x: number;
  y: number;
  z: number;
  threat: number;
}

const HEALTH_BY_KIND: Record<ThreatKind, number> = {
  fighter: 20,
  "elite-fighter": 45,
  mine: 10,
  turret: 35,
  "shield-node": 60,
  "gun-emplacement": 50,
  debris: 999,
};

export function createThreatWave(kinds: ThreatKind[], difficulty: number): Threat[] {
  return kinds.map((kind, index) => ({
    id: `${kind}-${index}`,
    kind,
    health: HEALTH_BY_KIND[kind] + difficulty * 5,
    bountyValue: kind === "debris" ? 0 : 25 + difficulty * 10,
    x: (index - (kinds.length - 1) / 2) * 180,
    y: 0,
    z: 900 + index * 220,
    threat: kind === "elite-fighter" || kind === "gun-emplacement" ? 0.9 : 0.5,
  }));
}

export function damageThreat(threat: Threat, damage: number): Threat {
  return {
    ...threat,
    health: Math.max(0, threat.health - damage),
  };
}

export function getAliveThreats(threats: Threat[]): Threat[] {
  return threats.filter((threat) => threat.health > 0);
}
```

- [ ] **Step 4: Add UpgradeShop scene**

Create `UpgradeShop.ts`:

```ts
import { Scene } from "phaser";
import { getAvailableUpgrades } from "../simulation/Upgrades";
import { getFontFamily } from "../../utils/font";

export class UpgradeShop extends Scene {
  constructor() {
    super("UpgradeShop");
  }

  create(): void {
    const { width, height } = this.cameras.main;
    const fontFamily = getFontFamily(this);
    const upgrades = getAvailableUpgrades().slice(0, 3);
    this.cameras.main.setBackgroundColor(0x020107);
    this.cameras.main.setPostPipeline("VectorShader");

    this.add
      .text(width / 2, height * 0.2, "SPEND BOUNTIES", {
        fontFamily,
        fontSize: "36px",
        color: "#ff43d6",
      })
      .setOrigin(0.5);

    upgrades.forEach((upgrade, index) => {
      this.add
        .text(
          width / 2,
          height * 0.38 + index * 58,
          `${index + 1}. ${upgrade.label} - ${upgrade.cost}`,
          {
            fontFamily,
            fontSize: "22px",
            color: "#7be8ff",
          },
        )
        .setOrigin(0.5);
    });

    this.add
      .text(width / 2, height * 0.76, "PRESS SPACE TO CONTINUE", {
        fontFamily,
        fontSize: "18px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.input.keyboard?.once("keydown-SPACE", () => this.scene.start("Game"));
    this.input.once("pointerdown", () => this.scene.start("Game"));
  }
}
```

Modify `main.ts`:

```ts
import { UpgradeShop } from "./scenes/UpgradeShop";

scene: [Boot, Title, OpeningCrawl, Game, UpgradeShop, Pause, GameOver],
```

- [ ] **Step 5: Connect Game scene to sortie and threats**

In `Game.ts`, initialize:

```ts
import { generateSortie } from "../rail/RouteGenerator";
import { createThreatWave, getAliveThreats, type Threat } from "../objects/Threats";

private threats: Threat[] = [];

// in create()
const sortie = generateSortie({ seed: Date.now(), difficulty: 1 });
this.threats = createThreatWave(sortie.segments[0].allowedThreats, 1);

// in update(), pass live threats to radar:
const radarDots = projectThreatsToRadar(
  getAliveThreats(this.threats).map((threat) => ({
    id: threat.id,
    x: threat.x,
    y: threat.y,
    z: threat.z,
    threat: threat.threat,
  })),
);
```

- [ ] **Step 6: Run verification**

Run: `bunx nx test starfighter-assault`

Expected: PASS.

Run: `bunx nx build starfighter-assault`

Expected: PASS.

- [ ] **Step 7: Commit segment flow**

```bash
git add apps/starfighter-assault/src/game/objects/Threats.ts apps/starfighter-assault/src/game/objects/Threats.test.ts apps/starfighter-assault/src/game/scenes/UpgradeShop.ts apps/starfighter-assault/src/game/main.ts apps/starfighter-assault/src/game/scenes/Game.ts
git commit -m "feat(starfighter-assault): connect sortie threats" -m "- Spawn MVP threats from generated segment rules." -m "- Add the first-pass between-segment upgrade shop scene."
```

### Task 10: Frontend And Registry Integration

**Files:**
- Modify: `apps/frontend/package.json`
- Create: `apps/frontend/src/app/games/starfighter-assault/page.tsx`
- Modify: `apps/frontend/src/lib/games.ts`
- Modify: `libs/studio-registry/src/lib/studio-registry.ts`

- [ ] **Step 1: Add frontend dependency**

In `apps/frontend/package.json`, add:

```json
"starfighter-assault": "workspace:*"
```

Keep dependencies alphabetized near the existing game packages.

- [ ] **Step 2: Create frontend route**

Create `apps/frontend/src/app/games/starfighter-assault/page.tsx`:

```tsx
"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import type { Scene } from "phaser";
import { GameView } from "../../../components/game-view";
import type { IRefPhaserGame } from "starfighter-assault";

const PhaserGame = dynamic(
  () =>
    import("starfighter-assault").then((mod) => ({
      default: mod.PhaserGame,
    })),
  { ssr: false },
);

export default function StarfighterAssaultPage() {
  const phaserRef = useRef<IRefPhaserGame>({
    game: undefined,
    scene: undefined,
  });

  const onCurrentActiveScene = (_scene: Scene) => {
    // Scene ready; can use for React bridge if needed.
  };

  return (
    <GameView>
      <PhaserGame ref={phaserRef} currentActiveScene={onCurrentActiveScene} />
    </GameView>
  );
}
```

- [ ] **Step 3: Mark game available**

In `apps/frontend/src/lib/games.ts`, change Starfighter Assault:

```ts
{
  id: "starfighter-assault",
  name: "Starfighter Assault",
  description:
    "Climb into a bounty hunter cockpit for a neon wireframe assault on a Star Destroyer-like capital ship.",
  href: "/games/starfighter-assault",
  thumbnail: "/assets/starfighter-assault-cabinet.png",
}
```

- [ ] **Step 4: Add studio registry entry**

In `libs/studio-registry/src/lib/studio-registry.ts`, add a `registeredGames` entry:

```ts
{
  id: "starfighter-assault",
  title: "Starfighter Assault",
  icon: createGameIcon(
    "starfighter-assault",
    "Starfighter Assault",
    starfighterAssaultIconSvg(),
  ),
  metadata: {
    description:
      "Cockpit-view wireframe rail combat with bounty upgrades, torpedoes, and a capital ship finale.",
    href: "/games/starfighter-assault",
    status: "available",
  },
  theme: {
    accent: "#ff43d6",
    accentForeground: "#150018",
    audioGrid: "rgba(123, 232, 255, 0.06)",
    audioLine: "#ff43d6",
    audioPanel: "rgba(5, 3, 13, 0.92)",
    audioPanelStrong: "#100a28",
    background: "#05030d",
    border: "rgba(123, 232, 255, 0.24)",
    foreground: "#f3fbff",
    input: "rgba(255, 67, 214, 0.2)",
    primary: "#7be8ff",
    primaryForeground: "#020107",
    ring: "rgba(255, 67, 214, 0.5)",
    secondary: "#120d2e",
    secondaryForeground: "#f3fbff",
  },
}
```

Add this icon helper near the other icon functions:

```ts
function starfighterAssaultIconSvg(): string {
  return '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="10" fill="#05030d"/><g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M8 18 25 34 8 46" stroke="#b04cff" stroke-width="4"/><path d="M56 18 39 34 56 46" stroke="#b04cff" stroke-width="4"/><path d="M22 48 32 27 42 48" stroke="#7be8ff" stroke-width="4"/><path d="M25 43h14" stroke="#ff43d6" stroke-width="3"/><ellipse cx="32" cy="50" rx="15" ry="6" stroke="#7be8ff" stroke-width="3"/><path d="M25 20h14M32 13v14" stroke="#ff43d6" stroke-width="3"/></g><circle cx="18" cy="27" r="2" fill="#ff1f35"/><circle cx="46" cy="30" r="2" fill="#ff1f35"/></svg>';
}
```

- [ ] **Step 5: Run integration verification**

Run: `bunx nx test starfighter-assault`

Expected: PASS.

Run: `bunx nx build starfighter-assault`

Expected: PASS.

Run: `bunx nx test frontend`

Expected: PASS.

Run: `bunx nx build frontend`

Expected: PASS.

- [ ] **Step 6: Commit integration**

```bash
git add apps/frontend/package.json apps/frontend/src/app/games/starfighter-assault/page.tsx apps/frontend/src/lib/games.ts libs/studio-registry/src/lib/studio-registry.ts
git commit -m "feat(starfighter-assault): integrate game route" -m "- Add the frontend game route and workspace dependency." -m "- Mark Starfighter Assault available in arcade and studio metadata."
```

### Task 11: Browser Playtest And Polish Pass

**Files:**
- Inspect: `apps/starfighter-assault/src/game/scenes/OpeningCrawl.ts`
- Inspect: `apps/starfighter-assault/src/game/scenes/Game.ts`
- Inspect: `apps/starfighter-assault/src/game/objects/CockpitHud.ts`
- Inspect: `apps/starfighter-assault/src/game/objects/RailPlayer.ts`
- Modify only the inspected file that directly owns the observed playtest failure.

- [ ] **Step 1: Start dev server**

Run: `bunx nx serve frontend`

Expected: frontend starts and prints a localhost URL.

- [ ] **Step 2: Open browser**

Open `/games/starfighter-assault` in the in-app Browser or Chrome devtools target.

Expected: title screen loads without console errors.

- [ ] **Step 3: Verify opening crawl**

Start a run.

Expected:

- crawl lasts about 10 to 15 seconds if not skipped,
- click or Space skips immediately,
- text is readable at cabinet size,
- transition reaches cockpit scene.

- [ ] **Step 4: Verify cockpit and control feel**

In the cockpit scene, move the mouse and fire.

Expected:

- cockpit interior panels remain visible,
- nose is only a small lower-center lip,
- side laser cannons protrude from the left/right edges,
- reticle stays readable,
- radar sits bottom center in an ovular console screen,
- radar dots brighten and grow when threats are closer,
- mouse steering does not leave the flight box,
- laser fire does not consume ammo,
- torpedo input consumes limited torpedo count.

- [ ] **Step 5: Fix observed issues with targeted commits**

For each visual/control issue, make one focused fix and run:

```bash
bunx nx test starfighter-assault
bunx nx build starfighter-assault
```

Expected: both commands pass before committing each fix.

- [ ] **Step 6: Final verification**

Run:

```bash
bunx nx test starfighter-assault
bunx nx build starfighter-assault
bunx nx test frontend
bunx nx build frontend
git status --short --branch
```

Expected:

- all commands exit 0,
- git status shows only intentional uncommitted playtest artifacts if any,
- otherwise the worktree is clean after final commit.

## Self-Review Notes

- Spec coverage: the plan covers app scaffold, opening crawl, run state, route generation, weapons, bounties, upgrades, radar, cockpit framing, mouse controls, capital ship finale state, frontend integration, and browser playtest.
- Renderer choice: the plan chooses the existing Phaser/custom wireframe engine path to match Neon Cabinet's current 3D precedent and avoid introducing a second renderer in the first playable MVP.
- MVP limitation: this plan creates the first playable loop and first-pass finale progression. Rich capital ship model detail, advanced enemy AI, audio, and complete upgrade shop UX can follow once this vertical slice is stable.
