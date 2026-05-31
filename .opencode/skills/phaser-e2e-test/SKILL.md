---
name: phaser-e2e-test
description: Write and run E2E tests for Phaser games using Cucumber + Playwright. INVOKE when user asks about E2E testing, smoke tests, feature files, cucumber steps, browser testing, or full game flow testing. Trigger words - e2e test, smoke test, feature file, cucumber, step definition, browser test, test harness, agent debug.
---

# Phaser E2E Testing

E2E tests run the full game stack (React → Phaser → Canvas) in a real browser using Cucumber + Playwright. The test harness (`window.__TEST__`) exposes game state, commands, and time controls.

## When to Use

- Testing critical game flows (player moves, dies, collects items)
- Testing full scene transitions (Title → Game → GameOver)
- Visual verification (sprite positions, particle effects, maze layout)
- Regression testing for released features

## Architecture

```
┌─────────────────────────────────────────────┐
│  Feature File (.feature)                    │
│  Gherkin: Given/When/Then                   │
│  Readable by non-developers                 │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│  Step Definition (*.steps.ts)               │
│  Cucumber bindings                          │
│  Calls page.evaluate() → window.__TEST__    │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│  Test Harness (testHarness.ts)              │
│  window.__TEST__.state  → game state        │
│  window.__TEST__.commands → game commands   │
│  window.__TEST__.time   → time controls     │
└─────────────────────────────────────────────┘
```

## Test Harness API

Exposed as `window.__TEST__` on the browser window:

### State

```typescript
interface MazeRunnerState {
  player: {
    gridX: number;
    gridY: number;
    x: number;
    y: number;
    direction: Direction; // UP=1, DOWN=2, LEFT=3, RIGHT=4
    isDying: boolean;
  };
  enemies: Array<{
    texture: string;
    state: string;
    x: number;
    y: number;
    gridX: number;
    gridY: number;
    direction: Direction;
  }>;
  score: number;
  lives: number;
  level: number;
  collectibles: number;
  scene: string;
}
```

### Commands

```typescript
interface MazeRunnerCommands {
  start: () => void;
  move: (direction: Direction) => void;
  setPlayerGrid: (x: number, y: number) => void;
  killPlayer: () => void;
  eatDot: () => void;
  teleportPlayer: (gridX: number, gridY: number) => void;
  clearCollectibles: (type?: string) => void;
  spawnEnemyAt: (gridX: number, gridY: number, aiType: string) => void;
}
```

### Time Controls

```typescript
interface TimeController {
  setSpeed(speed: number): void; // 1 = normal, 0 = paused
  pause(): void;
  resume(): void;
  stepSync(frames: number): void; // Sync frame stepping (headless)
}
```

## Feature File Structure

```gherkin
# features/smoke/02-player-moves.feature
@smoke
Feature: Player Movement

  Scenario: Player moves right
    Given the game is configured with seed 42
    And the game is running at 1x speed
    When I start the game
    And I move right
    And 10 frames pass
    Then the player should be at grid position (11, 14)
```

Categories:

- `features/smoke/` — critical path tests
- `features/gameplay/` — game mechanics tests
- `features/debug/` — agent-directed debugging scenarios

Tags: `@smoke` (critical path), `@gameplay` (mechanics), `@ai` (enemy behavior), `@debug` (agent-directed)

## Step Definition Patterns

### Game Setup

```typescript
import { Given, When, Then } from "@cucumber/cucumber";

Given("the game is configured with seed {int}", async function (seed: number) {
  (this as any).seed = seed;
  await (this as any).navigate(`/?test=1&seed=${seed}`);
  await (this as any).page.waitForFunction(
    () => (window as any).__TEST__ !== undefined,
    { timeout: 10000 },
  );
  await (this as any).page.waitForFunction(
    () => (window as any).__TEST__?.ready === true,
    { timeout: 10000 },
  );
});
```

### Direction Commands

**CRITICAL:** `Direction` is a numeric enum: UP=1, DOWN=2, LEFT=3, RIGHT=4. Step definitions receive strings from Gherkin and must convert:

```typescript
When("I press {word}", async function (direction: string) {
  const state = await (this as any).page.evaluate((d: string) => {
    const test = (window as any).__TEST__;
    const dirMap: Record<string, number> = {
      UP: 1,
      DOWN: 2,
      LEFT: 3,
      RIGHT: 4,
    };
    test?.commands?.move(dirMap[d.toUpperCase()] ?? 0);
    test?.time?.stepSync(10);
    return test?.state;
  }, direction);
  (this as any).lastState = state;
});
```

### Assertions

```typescript
Then("the score should be {int}", async function (expected: number) {
  const state = await getState(this as any);
  const score = state?.score ?? -1;
  if (score !== expected) {
    throw new Error(`Expected score ${expected} but got ${score}`);
  }
});
```

## CDP Context Degradation

**CRITICAL ISSUE:** `stepSync(N)` degrades the CDP connection. After calling it, `page.evaluate()` and `page.screenshot()` may hang.

### Solution: Batch Operations

Batch all `page.evaluate` calls BEFORE `stepSync` runs:

```typescript
// GOOD: Single evaluate with stepSync inside
const state = await page.evaluate((d: string) => {
  const test = (window as any).__TEST__;
  test?.commands?.move(dirMap[d]);
  test?.time?.stepSync(10);
  return test?.state; // Return state in same call
}, direction);

// BAD: Separate calls — second one may hang
await page.evaluate(() => test.commands.move(dir));
await page.evaluate(() => test.time.stepSync(10));
const state = await page.evaluate(() => test.state); // HANGS
```

### Screenshots

Use `canvas.toDataURL()` inside `page.evaluate` instead of `page.screenshot()`:

```typescript
const result = await page.evaluate(() => {
  const test = (window as any).__TEST__;
  test?.commands?.killPlayer();
  const canvas = document.querySelector("canvas");
  const screenshotData = canvas?.toDataURL("image/png") || "";
  return { state: test?.state, screenshotData };
});

// Save the base64 image
const base64Data = result.screenshotData.replace(
  /^data:image\/png;base64,/,
  "",
);
fs.writeFileSync(filepath, base64Data, "base64");
```

## Running Tests

```bash
# Run all E2E tests
nx e2e maze-runner

# Run specific feature file
nx e2e maze-runner -- features/smoke/02-player-moves.feature

# Agent debugging (dev server + browser with CDP)
cd apps/maze-runner
npm run agent:debug
```

## Agent Debugging Workflow

For interactive debugging with browser tools:

1. Launch: `npm run agent:debug` (starts dev server + Chrome on port 9222)
2. Navigate to game URL
3. Use `browser_eval` to interact with `__TEST__`:
   ```javascript
   // Start game
   browser_eval("__TEST__.commands.start()");
   // Move player
   browser_eval("__TEST__.commands.move(4)"); // RIGHT=4
   // Step frames
   browser_eval("__TEST__.time.stepSync(10)");
   ```
4. Validate with `browser_snapshot()` (reads `#neon-debug` DOM overlay)
5. Visual confirmation with `browser_screenshot()` (captures canvas PNG)

## Writing New Feature Files

1. Add `.feature` file to `features/<category>/`
2. Map steps to existing `__TEST__.commands` or add new ones
3. Tag appropriately: `@smoke`, `@gameplay`, `@ai`, `@debug`
4. Write step definitions in `step-definitions/`
5. Ensure Gherkin is readable as a debugging guide for future agents

## DO NOT

- Call `page.screenshot()` after `stepSync(N)` — it hangs
- Make separate `page.evaluate` calls after `stepSync` — batch them
- Pass string directions to `move()` — convert to numeric enum
- Use `Math.random()` in game code — use `Phaser.Math.RND`
- Forget to wait for `__TEST__` ready flag before running steps

## DO

- Batch all evaluate calls before `stepSync`
- Use `canvas.toDataURL()` for in-test screenshots
- Convert string directions to numeric enum in step definitions
- Use `wall-clock timeout` for waits (default 10s real time)
- Follow Gherkin conventions: Given (setup), When (action), Then (assertion)

## See Also

- `phaser-unit-test` — for pure function testing
- `phaser-integration-test` — for Game Object testing with mocks
