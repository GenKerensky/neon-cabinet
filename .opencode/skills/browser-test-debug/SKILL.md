# Browser Test Debug — Agent Debugging Guide

> **When to load:** Debugging a Phaser game that already has the test harness wired up.

## Prerequisites

Verify the game has the harness:

```bash
rg "window\.__TEST__" apps/<game-name>/src/game/
```

If no results, the game needs the harness first — load the `phaser-test-harness` skill instead.

## Launch Dev Server + Browser for Agent Debugging

```bash
cd apps/<game-name>
npm run test:agent
```

This launches:

1. The dev server (`nx serve <game-name>`)
2. A fresh Chrome/Chromium profile with `--remote-debugging-port=9222`
3. Prints the CDP URL to stdout

### Browser Detection

The `BrowserLauncher` detects Chrome/Chromium in this order:

**Linux:**

1. `google-chrome` (standard install)
2. Flatpak `org.chromium.Chromium`
3. `chromium` (package manager)
4. `chromium-browser` (older Ubuntu)

**Windows:**

1. Registry lookup for Google Chrome
2. Known paths (`%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe`)
3. `chrome` in PATH

Launch args: `--remote-debugging-port=9222`, no extensions, fresh temp profile.

## Reading Feature Files as Debugging Playbooks

Gherkin `.feature` files are step-by-step debugging guides. Each step maps to a `__TEST__.commands.*` call or time control operation.

```
features/smoke/       — critical path tests
features/gameplay/     — mechanics tests
features/debug/        — agent-directed debugging scenarios
```

### Tags

| Tag         | Purpose                                               |
| ----------- | ----------------------------------------------------- |
| `@smoke`    | Critical path — game loads, player moves, player dies |
| `@gameplay` | Game mechanics — collectibles, enemies, power-ups     |
| `@ai`       | Enemy AI behavior tests                               |
| `@debug`    | Agent-directed debugging scenarios                    |

## Executing Steps via browser_eval

Use `browser_eval()` to call `__TEST__` methods from the agent:

```javascript
// Start the game (Title → Game transition)
browser_eval("__TEST__.commands.start()");

// Move the player
browser_eval("__TEST__.commands.move('RIGHT')");

// Step 10 frames
browser_eval("__TEST__.time.step(10)");

// Pause the game
browser_eval("__TEST__.time.pause()");

// Resume the game
browser_eval("__TEST__.time.resume()");

// Set speed (0.01x to 10x)
browser_eval("__TEST__.time.setSpeed(2)");

// Wait for a condition
browser_eval("__TEST__.time.waitFor(() => __TEST__.state.player.dying, 5000)");

// Freeze (pause + snapshot)
browser_eval("__TEST__.time.freeze()");
```

## Two-Phase Validation Strategy

### 1. Fast Validation: browser_snapshot()

`browser_snapshot()` reads the `#neon-debug` DOM overlay. This is fast (no image processing) and gives structured game state:

```javascript
browser_snapshot(); // reads #neon-debug div text
```

Use this first for most validations — player position, score, enemy states, scene name.

### 2. Visual Confirmation: browser_screenshot()

`browser_screenshot()` captures the full page PNG. Use only when the DOM overlay is insufficient:

- Verifying sprite positions
- Checking particle effects
- Validating maze/layout rendering
- Visual bugs not reflected in state

**Always use snapshot first. Only screenshot when snapshot doesn't give you confidence.**

## Inspecting **TEST** Properties

```javascript
// Current game state snapshot
browser_eval("JSON.stringify(__TEST__.state)");

// Current scene name
browser_eval("__TEST__.scene");

// Current seed (if deterministic mode)
browser_eval("__TEST__.seed");

// Whether game is in test mode
browser_eval("__TEST__.isTestMode");

// Is the game ready (loaded)?
browser_eval("__TEST__.ready");

// Captured errors
browser_eval("JSON.stringify(__TEST__.errors)");

// Time controller state
browser_eval(
  "JSON.stringify({ paused: __TEST__.time.isPaused, speed: __TEST__.time.speed, frames: __TEST__.time.totalFrames })",
);
```

## Time Control Commands Reference

| Command                                       | Description                             |
| --------------------------------------------- | --------------------------------------- |
| `__TEST__.time.pause()`                       | Pause the game loop                     |
| `__TEST__.time.resume()`                      | Resume the game loop                    |
| `__TEST__.time.setSpeed(multiplier)`          | Set speed (0.01–10.0)                   |
| `__TEST__.time.step(frames)`                  | Step N frames (returns promise)         |
| `__TEST__.time.waitFor(condition, timeoutMs)` | Wait until condition is true            |
| `__TEST__.time.advance(frames, speed)`        | Set speed, step N frames, restore speed |
| `__TEST__.time.freeze()`                      | Pause + return full state snapshot      |

Read-only properties: `isPaused`, `speed`, `totalFrames`, `elapsed`

## Using Arrange Helpers

Games register game-specific commands on `__TEST__.commands`. Common patterns (from maze-runner):

```javascript
// Start the game
browser_eval("__TEST__.commands.start()");

// Move player in a direction
browser_eval("__TEST__.commands.move('RIGHT')");

// Teleport player to grid position
browser_eval("__TEST__.commands.teleportPlayer(10, 10)");

// Clear collectibles
browser_eval("__TEST__.commands.clearCollectibles('dot')");

// Spawn an enemy at a position
browser_eval("__TEST__.commands.spawnEnemyAt(5, 5, 'timid')");

// Kill the player
browser_eval("__TEST__.commands.killPlayer()");

// Eat a dot
browser_eval("__TEST__.commands.eatDot()");
```

Check the game's `main.ts` for its specific command interface.

## Agent-Driven Execution from Gherkin

When reading a `.feature` file as a debugging playbook:

1. **Read the Background** — note the seed and any common setup
2. **Map Given steps** → navigate to `?test=1&seed=N`, set up state
3. **Map When steps** → execute commands via `browser_eval()`
4. **Map Then steps** → validate via `browser_snapshot()` or `browser_screenshot()`

### Example Workflow

For this feature:

```gherkin
@smoke
Scenario: Player moves right
  Given the game is configured with seed 42
  When the game starts
  And the player moves right
  And 10 frames pass
  Then the player gridX should be greater than 10
```

Agent execution:

```javascript
// Given: navigate with seed
browser_eval("window.location.href = '?test=1&seed=42'");

// When: start game
browser_eval("__TEST__.commands.start()");

// When: move player
browser_eval("__TEST__.commands.move('RIGHT')");

// When: step frames
browser_eval("__TEST__.time.step(10)");

// Then: validate via snapshot (fast)
browser_snapshot(); // check player.gridX in debug overlay

// Or validate via screenshot (visual)
browser_screenshot(); // only if snapshot insufficient
```

## Running Tests via Cucumber

For automated test execution (not agent-driven):

```bash
# Run smoke tests only
npm run test:smoke

# Run all tests
npm run test:full

# Run debug tests in headed mode with screenshots
npm run test:debug
```

Tests require the dev server running (`nx serve <game-name>`).

## Debug Overlay

The debug overlay (`#neon-debug`) is a DOM element rendered as a sibling to the game canvas. It shows live game state updated every frame.

- Press **F9** to toggle visibility
- Visibility preference persisted in localStorage
- Semi-transparent dark background, monospace font

When using `browser_snapshot()`, the agent reads this overlay for fast validation.

## Troubleshooting

### **TEST** not found in production

This is correct — `__TEST__` is guarded by `import.meta.env.DEV` and stripped from production builds.

### Tests fail with WebGL errors

The test harness uses SwiftShader software rendering in headless mode. WebGL draw calls are stubbed to avoid GPU issues.

### Browser not detected

Ensure Chrome or Chromium is installed. The launcher checks standard paths and PATH.

### Seed not working

Verify `?test=1&seed=N` URL params are present and `DeterministicMode.seedRng()` is called in `Boot.ts` `create()`.
