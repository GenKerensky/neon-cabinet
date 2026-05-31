---
name: phaser-unit-test
description: Write and run unit tests for Phaser game utilities. INVOKE when user asks about unit testing, writing tests for pure functions, MazeGenerator, math utilities, or any code without Phaser object dependencies. Trigger words - unit test, test utility, test helper function, test maze generation, vitest test.
---

# Phaser Unit Testing

Unit tests cover pure functions and utilities that have no dependency on Phaser Game Objects (Sprites, Scenes, Tweens, Physics). These are the fastest, most reliable tests in the pyramid.

## When to Use

- Testing math, geometry, or array utilities
- Testing maze/algorithms (MazeGenerator, pathfinding)
- Testing configuration or constant logic
- Any function that takes plain values and returns plain values

## Pattern: Direct Require

**DO NOT mock Phaser internals.** Import the code directly and test it.

```typescript
import { describe, it, expect } from "vitest";
import { MazeGenerator, CellType } from "../../src/game/utils/MazeGenerator";

describe("MazeGenerator", () => {
  it("creates correct grid dimensions", () => {
    const gen = new MazeGenerator(1);
    const grid = gen.create();
    expect(grid.length).toBe(17);
    expect(grid[0].length).toBe(21);
  });
});
```

## Configuration

All unit tests run in `jsdom` environment via Vitest. See `vite.config.mts`:

```typescript
test: {
  name: "maze-runner",
  watch: false,
  globals: true,
  environment: "jsdom",
  include: ["{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
  setupFiles: ["./tests/setup.ts"],
}
```

## Running Tests

```bash
# Run all unit tests
nx test maze-runner

# Run specific test file
nx test maze-runner -- --testNamePattern="MazeGenerator"

# With coverage
nx test maze-runner -- --coverage
```

## Global Setup

`tests/setup.ts` provides global mocks for code that imports `Phaser.Math.RND`:

```typescript
(global as any).Phaser = {
  Math: {
    RND: {
      pick: (arr: any[]) => arr[Math.floor(Math.random() * arr.length)],
      frac: () => Math.random(),
      integerInRange: (min: number, max: number) =>
        Math.floor(Math.random() * (max - min + 1)) + min,
      sow: () => {},
    },
  },
};
```

**Important:** This mock is for MazeGenerator's internal randomness. Do NOT rely on Phaser mocks for Game Objects — that belongs in integration tests.

## Test File Organization

```
tests/
├── utils/                    # Pure function tests (unit tests)
│   └── MazeGenerator.spec.ts
├── helpers/                  # Shared test helpers
│   └── createMockScene.ts
└── setup.ts                  # Global setup
```

## Writing Tests for Utilities

### Maze Generation Tests

Test structural properties, not specific mazes (randomness):

```typescript
it("all passages are reachable via BFS", () => {
  const gen = new MazeGenerator(1);
  const grid = gen.create();
  // BFS from center, verify all passages visited
  const visited = bfs(grid, center);
  for (each passage cell) {
    expect(visited.has(cell)).toBe(true);
  }
});
```

### Grid Pattern Helpers

For tests needing specific layouts, build grids from string patterns:

```typescript
function gridFromPattern(pattern: string[]): MazeCell[][] {
  return pattern.map((row) =>
    [...row].map((ch) => ({
      type: ch === "." ? CellType.PASSAGE : CellType.WALL,
      visited: false,
    })),
  );
}

// Usage
const grid = gridFromPattern(["WWWWW", "W...W", "WWWWW"]);
```

## DO NOT

- Mock Phaser Game Objects (Sprite, Scene, etc.) — use integration tests instead
- Use `vi.mock("phaser")` in unit test files — this is an integration test pattern
- Test rendering or visual output — use E2E tests
- Use `done()` callbacks — use `async/await` or return Promises
- Test Phaser-specific behavior (tweens, physics) — use phaser-test-utils

## See Also

- `phaser-integration-test` — for testing Game Objects with mocked or real Phaser
- `phaser-e2e-test` — for full browser testing with Cucumber + Playwright
