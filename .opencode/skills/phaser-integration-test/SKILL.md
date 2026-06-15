---
name: phaser-integration-test
description: Write and run integration tests for Phaser Game Objects. INVOKE when user asks about testing Sprites, Scenes, Player, Enemy, Collectible, tweens, physics, or any code that depends on Phaser objects. Trigger words - integration test, test sprite, test player, test enemy, test scene, test collectible, phaser-test-utils.
---

# Phaser Integration Testing

Integration tests cover code that depends on Phaser Game Objects (Sprites, Scenes, Tweens, Physics). These tests use either mocked Phaser objects or `phaser-test-utils` for real headless Phaser instances.

## When to Use

- Testing Player movement, collision, direction logic
- Testing Enemy AI, pathfinding, state machines
- Testing CollectibleManager creation, collection, scoring
- Testing Scene lifecycle, transitions
- Testing tweens, animations, or physics bodies

## Current Approach: Mocked Phaser Objects

The existing test suite uses per-file `vi.mock("phaser")` to provide minimal Phaser object stubs. This works for testing game logic without rendering.

### Mock Pattern

```typescript
import { describe, it, expect, vi } from "vitest";

vi.mock("phaser", () => {
  class MockGameObject {
    scene: any;
    x: number;
    y: number;
    active = true;
    alpha = 1;
    texture: { key: string } = { key: "test" };
    anims = {
      play: () => void 0,
      isPlaying: false,
      pause: () => void 0,
      resume: () => void 0,
    };
    constructor(scene: any, x: number, y: number, _texture?: string) {
      this.scene = scene;
      this.x = x;
      this.y = y;
    }
    setTexture(_key: string): void {}
    setAlpha(_value: number): void {}
    play(_key: string, _ignoreIfPlaying?: boolean): void {}
    on(_event: string, _callback: () => void): void {}
    destroy() {
      this.active = false;
    }
  }
  return { GameObjects: { Sprite: MockGameObject }, Scene: class {} };
});

// Import AFTER the mock
import { Player } from "../../src/game/objects/Player";
```

### Mock Scene Helper

`tests/helpers/createMockScene.ts` provides a minimal scene for constructing objects:

```typescript
function createMockScene(): any {
  const delayedCallbacks: (() => void)[] = [];
  return {
    add: { existing: vi.fn(), sprite: vi.fn() },
    physics: { add: { existing: vi.fn() } },
    time: {
      delayedCall: vi.fn((_ms: number, fn: () => void) => {
        delayedCallbacks.push(fn);
        return {};
      }),
    },
    tweens: { add: vi.fn(() => ({ stop: vi.fn() })) },
    sys: {
      displayList: { add: vi.fn() },
      updateList: { add: vi.fn() },
      textures: {
        get: vi.fn(),
        addCanvas: vi.fn(),
        exists: vi.fn().mockReturnValue(true),
      },
      events: { on: vi.fn(), emit: vi.fn() },
      queueDepthSort: vi.fn(),
    },
    textures: {
      get: vi.fn(),
      addCanvas: vi.fn(),
      exists: vi.fn().mockReturnValue(true),
    },
    children: { add: vi.fn() },
  };
}
```

### Writing a Player Test

```typescript
import { CellType } from "../../src/game/utils/MazeGenerator";
import type { MazeCell } from "../../src/game/utils/MazeGenerator";
import { Direction } from "../../src/game/utils/DirectionUtils";
import { Player } from "../../src/game/objects/Player";
import { createMockScene } from "../helpers/createMockScene";

function gridFromPattern(pattern: string[]): MazeCell[][] {
  return pattern.map((row) =>
    [...row].map((ch) => ({
      type: ch === "." ? CellType.PASSAGE : CellType.WALL,
      visited: false,
    })),
  );
}

function createPlayer(grid: MazeCell[][], w: number, h: number): Player {
  const mockScene = createMockScene();
  const tileSize = 16;
  const startX = 0 + 1 * tileSize + tileSize / 2;
  const startY = 0 + 1 * tileSize + tileSize / 2;
  return new Player(
    mockScene,
    startX,
    startY,
    "player",
    grid,
    w,
    h,
    tileSize,
    0,
    0,
    200,
  );
}

describe("Player", () => {
  it("sets current direction when none", () => {
    const grid = gridFromPattern(["WWWWW", "W...W", "WWWWW"]);
    const player = createPlayer(grid, 5, 3);
    player.setDirection(Direction.RIGHT);
    expect(player.getCurrentDirection()).toBe(Direction.RIGHT);
  });

  it("wall blocks movement", () => {
    const grid = gridFromPattern(["WWWWW", "W.W.W", "WWWWW"]);
    const player = createPlayer(grid, 5, 3);
    const p = player as any;
    p.gridX = 1;
    p.gridY = 1;
    // @ts-expect-error accessing private for test
    expect(player.canMove(Direction.RIGHT)).toBe(false);
  });
});
```

## Future Approach: phaser-test-utils (Phase 3)

The migration target uses `phaser-test-utils` for real headless Phaser instances:

```typescript
import { createTestGame, step } from "phaser-test-utils";

describe("Player", () => {
  let destroy: (() => void) | undefined;
  afterEach(() => destroy?.());

  it("moves right", async () => {
    const {
      game,
      scene,
      destroy: d,
    } = await createTestGame({
      scene: MyScene,
      physics: { default: "arcade", arcade: { gravity: { y: 0 } } },
    });
    destroy = d;

    step(game); // Process pending registrations

    scene.player.setDirection(Direction.RIGHT);
    step(game, 10); // Advance 10 frames

    expect(scene.player.x).toBeGreaterThan(100);
  });
});
```

## Running Tests

```bash
# Run all tests (unit + integration)
nx test maze-runner

# Run specific file
nx test maze-runner -- tests/objects/Player.spec.ts

# With coverage
nx test maze-runner -- --coverage
```

## DO NOT

- Use `vi.mock("phaser")` for pure functions — use direct import (unit test pattern)
- Create mocks with fake properties that don't match real Phaser API — study the actual object first
- Use `done()` callbacks — use `async/await` or return Promises
- Test visual rendering — use E2E tests with Playwright

## DO

- Mock only what the tested code actually uses — keep mocks minimal
- Use `as any` and `@ts-expect-error` sparingly for accessing private members in tests
- Follow existing mock patterns in `tests/objects/` for consistency
- Add Phaser methods to mocks as tests reveal new dependencies

## See Also

- `phaser-unit-test` — for pure function testing without Phaser mocks
- `phaser-e2e-test` — for full browser testing with Cucumber + Playwright
