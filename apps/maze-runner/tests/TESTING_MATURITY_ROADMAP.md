# Testing Maturity Roadmap

> Track progress toward comprehensive, high-confidence testing for maze-runner.

## Current State (2026-05-26)

### E2E Tests (Cucumber + Playwright)

| Area                 | Status     | Scenarios | Steps | Notes                                      |
| -------------------- | ---------- | --------- | ----- | ------------------------------------------ |
| `features/smoke/`    | ✅ Passing | 8         | 33    | CDP degradation fix applied                |
| `features/gameplay/` | ❌ Not run | 4 files   | —     | Enemy AI, power pellets, level transitions |
| `features/debug/`    | ❌ Not run | 2 files   | —     | Agent-directed debugging scenarios         |

**Known Issues:**

- CDP context degradation after `stepSync(N)` in Playwright. Fixed by batching `page.evaluate` calls before frame stepping.
- `page.screenshot()` hangs after degradation. Use `canvas.toDataURL()` inside `page.evaluate` instead.

### Unit Tests (Vitest + jsdom)

| File                          | Status     | Tests | Notes                                         |
| ----------------------------- | ---------- | ----- | --------------------------------------------- |
| `utils/MazeGenerator.spec.ts` | ✅ Passing | —     | Pattern 1: Direct require, global Phaser mock |
| `objects/Player.spec.ts`      | ✅ Passing | —     | Mocking Phaser GameObjects                    |
| `objects/Enemy.spec.ts`       | ✅ Passing | —     | Mocking Phaser GameObjects                    |
| `objects/Collectible.spec.ts` | ✅ Passing | —     | Mocking Phaser GameObjects                    |
| `EventBus.spec.ts`            | ✅ Passing | —     |                                               |

**Total:** 109 tests passing

**Known Issues:**

- Heavy reliance on Phaser mocks. Misses real Phaser behavior (tweens, physics, scene lifecycle).
- Mock maintenance burden as Phaser APIs change.
- False confidence — tests pass but game might break.

## Target State

### The Testing Pyramid

```
                    ┌─────────────────────────┐
                    │     E2E Tests (5-10%)   │
                    │  Playwright + Cucumber  │
                    │  Real browser, full     │
                    │  game flows             │
                    └─────────────────────────┘
                           ╱─────────╲
                  ╱─────────────────────╲
                 ╱─────────────────────────╲
                ┌─────────────────────────────────┐
                │   Integration Tests (20-30%)    │
                │   phaser-test-utils             │
                │   Headless Phaser, real scenes  │
                │   Game objects, physics, input  │
                └─────────────────────────────────┘
                       ╱───────────────╲
              ╱─────────────────────────────╲
             ╱─────────────────────────────────╲
            ┌───────────────────────────────────────┐
            │      Unit Tests (60-70%)              │
            │      Pure functions, utilities        │
            │      MazeGenerator, math, helpers     │
            │      Direct require, no Phaser needed │
            └───────────────────────────────────────┘
```

### Approach Comparison

| Approach          | Setup Speed | Test Speed | Realism      | Physics | Render     | Input | Maintenance |
| ----------------- | ----------- | ---------- | ------------ | ------- | ---------- | ----- | ----------- |
| Mocking (current) | ⚡⚡⚡      | ⚡⚡⚡     | ❌ Low       | ❌      | ❌         | ❌    | 🔧 High     |
| phaser-test-utils | ⚡⚡        | ⚡⚡       | ✅ High      | ✅      | ⚠️ Partial | ✅    | 🔧 Low      |
| E2E (Playwright)  | ⚡          | ⚡         | ✅✅ Highest | ✅      | ✅         | ✅    | 🔧 Medium   |

## Migration Plan

### Phase 1: Stabilize E2E (Current)

- [x] Fix smoke test direction enum type mismatch
- [x] Fix death lives not reducing in test harness
- [x] Fix death screenshot timeout (use `canvas.toDataURL()`)
- [ ] Run and fix gameplay feature scenarios
- [ ] Run and fix debug feature scenarios
- [ ] Add visual regression snapshots for critical UI

### Phase 2: Split Unit vs Integration Config

- [ ] Create separate vitest config for integration tests (`vitest.scene.config.ts`)
- [ ] Move pure-function tests to `node` environment (MazeGenerator, math, helpers)
- [ ] Keep object/scene tests in `jsdom` environment
- [ ] Add coverage reports for each config

### Phase 3: Adopt phaser-test-utils

- [ ] Add `phaser-test-utils` as dev dependency
- [ ] Migrate `Player.spec.ts` — movement, collision, death
- [ ] Migrate `Enemy.spec.ts` — AI, pathfinding
- [ ] Migrate `Collectible.spec.ts` — collection, scoring
- [ ] Add `Game.spec.ts` — scene lifecycle, level transitions
- [ ] Remove Phaser mocks from `tests/setup.ts`

### Phase 4: Coverage & CI

- [ ] Set coverage target: 80% line coverage
- [ ] Add coverage threshold to vitest config
- [ ] Configure parallel test execution in CI
- [ ] Add flaky test detection (re-run failed tests 3x)

## Official Phaser Testing Patterns

Reference: [`phaserjs/phaser/tests/TESTING.md`](https://github.com/phaserjs/phaser/blob/master/tests/TESTING.md)

### Pattern 1: Direct Require (Pure Functions)

For functions with no Phaser object dependencies:

```javascript
var Clamp = require("../../src/math/Clamp");

describe("Phaser.Math.Clamp", function () {
  it("should clamp above max", function () {
    expect(Clamp(15, 0, 10)).toBe(10);
  });
});
```

### Pattern 2: Real Phaser Game (Game Objects, Physics, Scenes)

For anything involving Game Objects:

```javascript
var helper = require("../helper");

describe("MyFeature", function () {
  var scene;

  beforeEach(async function () {
    scene = await helper.createGame({
      physics: {
        default: "arcade",
        arcade: { debug: false, gravity: { y: 0 } },
      },
    });
  });

  afterEach(function () {
    helper.destroyGame();
  });

  it("should work with a real sprite", function () {
    var sprite = scene.add.sprite(100, 200, "__DEFAULT");
    expect(sprite.x).toBe(100);
  });
});
```

### DO NOT

- Use `done()` callbacks — use `async/await` or return Promises
- Create mock objects with fake properties — use real Phaser objects
- Use `vi.mock()` to mock Phaser internals — use real objects
- Require from `src/phaser.js` directly — use `dist/phaser.js`

## Resources

| Resource           | Purpose                   | Link                                                                        |
| ------------------ | ------------------------- | --------------------------------------------------------------------------- |
| Phaser TESTING.md  | Official guide            | [GitHub](https://github.com/phaserjs/phaser/blob/master/tests/TESTING.md)   |
| Phaser test helper | Reference implementation  | [helper.js](https://github.com/phaserjs/phaser/blob/master/tests/helper.js) |
| phaser-test-utils  | Modern Vitest integration | [GitHub](https://github.com/kibertoad/phaser-test-utils)                    |
| Phaser examples    | Example games             | [phaserjs/examples](https://github.com/phaserjs/examples)                   |
| Vitest docs        | Test framework            | [vitest.dev](https://vitest.dev)                                            |
