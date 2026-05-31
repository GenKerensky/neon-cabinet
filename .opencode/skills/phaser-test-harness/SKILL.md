# Phaser Test Harness — Adoption Guide

> **When to load:** Adding the browser-level test harness to any Phaser game in the repo.

## Overview

All Phaser games in this repo share a common test framework from `libs/phaser-test-harness/`. It provides:

- `window.__TEST__` — dev-only global exposing game state, commands, and time control
- `TimeController` — pause, step, speed control, waitFor conditions
- `DebugOverlay` — DOM overlay (`#neon-debug`) showing live game state
- `DeterministicMode` — seed-based RNG determinism via `?seed=N` URL param
- `ErrorCapture` — bounded error buffer for test diagnostics

The reference implementation is `apps/maze-runner/`. Always check it for concrete examples.

## Check if a Game Already Has the Harness

```bash
# Look for __TEST__ in the game source
rg "window\.__TEST__" apps/<game-name>/src/game/
```

If results exist, the harness is already wired. If not, follow the adoption steps below.

## Adoption Steps

Follow the [Cross-Game Adoption Checklist](../../openspec/changes/game-testing-harness/specs/cross-game-adoption/spec.md) for a complete 11-step checklist. Summary:

### 1. Add Dependencies

```json
{
  "dependencies": {
    "@neon-cabinet/phaser-test-harness": "workspace:*"
  },
  "devDependencies": {
    "@neon-cabinet/browser-test-runner": "workspace:*"
  }
}
```

### 2. Define TState and TCommands

Create interfaces describing your game's state and commands. See `MazeRunnerState` and maze-runner commands in `apps/maze-runner/src/game/main.ts` for the pattern.

```typescript
interface MyGameState {
  player: { x: number; y: number /* ... */ };
  enemies: Array<{
    /* ... */
  }>;
  score: number;
  // ... game-specific state
}

interface MyGameCommands {
  start(): void;
  // ... game-specific commands
}
```

### 3. Wire the Test Harness (Entry Point)

In your game's entry point (`main.ts` or equivalent):

```typescript
import { createTestHarness } from "@neon-cabinet/phaser-test-harness";

// ... after Phaser.Game is created ...
if (import.meta.env.DEV) {
  createTestHarness<MyGameState, MyGameCommands>(game, {
    state: () => ({
      /* snapshot of game state */
    }),
    commands: {
      start: () => {
        /* trigger game start */
      },
      // ... register game-specific commands
    },
  });
}
```

### 4. Wire Deterministic Mode (Boot Scene)

In your `Boot.ts` scene:

```typescript
import { DeterministicMode } from "@neon-cabinet/phaser-test-harness";

const deterministicMode = new DeterministicMode();

create() {
  deterministicMode.seedRng(); // Seeds Phaser.Math.RND if ?test=1&seed=N
}
```

### 5. Add Seed Display to Scenes

In Title, Game, and GameOver scenes (guarded by `import.meta.env.DEV`):

```typescript
import { DeterministicMode } from "@neon-cabinet/phaser-test-harness";

if (import.meta.env.DEV) {
  const seedText = DeterministicMode.getSeedDisplayText();
  if (seedText) {
    this.add.text(x, y, seedText, { font: "10px monospace", fill: "#666" });
  }
}
```

### 6. Create support/ Directory

```
support/
  world.ts       — extends BrowserWorld from library
  hooks.ts       — uses BrowserHooks from library
  helpers/       — game-specific arrange helpers (registered on __TEST__.commands)
```

See `apps/maze-runner/support/` for concrete examples.

### 7. Create Configs

- `playwright.config.ts` — use `createPlaywrightConfig('game-name', port)` from library
- `cucumber.cjs` — point to `features/` and `step-definitions/`

See `apps/maze-runner/playwright.config.ts` and `cucumber.cjs`.

### 8. Write Feature Files

Create Gherkin `.feature` files in:

- `features/smoke/` — critical path tests (tag: `@smoke`)
- `features/gameplay/` — mechanics tests (tag: `@gameplay`)
- `features/debug/` — agent-directed debugging (tag: `@debug`)

Use `Background` sections for common setup (e.g., "Given the game is configured with seed 42").

### 9. Write Step Definitions

Create step definitions in `step-definitions/`. Use common steps from `@neon-cabinet/browser-test-runner` for generic steps (game config, time control, screenshots). Write game-specific steps for your game's unique actions.

See `apps/maze-runner/step-definitions/` for examples.

### 10. Add NPM Scripts

```json
{
  "scripts": {
    "test:smoke": "node --import tsx node_modules/.bin/cucumber-js --tags @smoke",
    "test:full": "node --import tsx node_modules/.bin/cucumber-js",
    "test:debug": "node --import tsx node_modules/.bin/cucumber-js --tags @debug --world-parameters '{\"headed\": true}'",
    "test:agent": "node scripts/launch-agent-browser.js"
  }
}
```

### 11. Verify the Build

```bash
# Dev build — __TEST__ must be present
nx serve <game-name>
# Open browser with ?test=1&seed=42, verify window.__TEST__ exists

# Production build — __TEST__ must be absent
nx build <game-name>
grep -r "__TEST__" dist/  # Must return nothing
```

## Scenario Writing Conventions

### Available Tags

| Tag         | Purpose                                               |
| ----------- | ----------------------------------------------------- |
| `@smoke`    | Critical path — game loads, player moves, player dies |
| `@gameplay` | Game mechanics — collectibles, enemies, power-ups     |
| `@ai`       | Enemy AI behavior tests                               |
| `@debug`    | Agent-directed debugging scenarios                    |

### Step Patterns

- **Given** — setup/arrange (configure seed, start game, position player)
- **When** — actions (move player, step frames, trigger events)
- **Then** — assertions (verify state, take screenshots)

### Example Feature

```gherkin
@smoke
Feature: Game loads and player moves

  Background:
    Given the game is configured with seed 42

  Scenario: Player moves right
    When the game starts
    And the player moves right
    And 10 frames pass
    Then the player gridX should be greater than 10
```

## Reference Files

| Purpose            | File                                                     |
| ------------------ | -------------------------------------------------------- |
| Harness types      | `libs/phaser-test-harness/src/core/types.ts`             |
| Harness factory    | `libs/phaser-test-harness/src/core/testSeam.ts`          |
| Time controller    | `libs/phaser-test-harness/src/core/timeController.ts`    |
| Debug overlay      | `libs/phaser-test-harness/src/core/debugOverlay.ts`      |
| Deterministic mode | `libs/phaser-test-harness/src/core/deterministicMode.ts` |
| Error capture      | `libs/phaser-test-harness/src/core/errorCapture.ts`      |
| Reference adoption | `apps/maze-runner/src/game/main.ts`                      |
| Reference Boot     | `apps/maze-runner/src/game/scenes/Boot.ts`               |
| Reference features | `apps/maze-runner/features/`                             |
| Reference steps    | `apps/maze-runner/step-definitions/`                     |
