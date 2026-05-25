## Context

The maze-runner game's movement system was recently refactored to use target-tile chasing instead of A\* pathfinding. The core movement classes (`DirectionUtils`, `Enemy`, `Player`) are currently untested. The game uses vitest with jsdom environment for testing (configured in `vite.config.mts`). Phaser 3's `GameObjects.Sprite` is the base class for both Player and Enemy, requiring a Scene instance for construction. This creates a mocking challenge for unit testing movement logic.

## Goals / Non-Goals

**Goals:**

- Achieve >90% test coverage on `DirectionUtils` (pure functions, no mocking)
- Achieve >80% test coverage on `MazeGenerator` (mostly pure, no Phaser dependency)
- Test all Enemy movement decision logic: `chooseDirection()`, `randomValidDirection()`, `findNearestPassage()`, state transitions, speed multipliers
- Test all Player movement logic: `setDirection()`, `canMove()`, `isAtIntersection()`, direction queuing, wall collision
- Tests must run with `nx test maze-runner` (match project's vitest config)

**Non-Goals:**

- Integration or E2E tests (manual gameplay testing remains)
- Visual rendering tests (no sprite/animation testing)
- Tests for Phaser input handling or scene lifecycle
- Performance benchmarks

## Decisions

### Decision 1: Structure test files next to source code

Tests go in `tests/` directory at the project root (already configured in `vite.config.mts` include pattern: `{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}`). Each test file mirrors the module it tests:

- `tests/utils/DirectionUtils.spec.ts`
- `tests/utils/MazeGenerator.spec.ts`
- `tests/objects/Enemy.spec.ts`
- `tests/objects/Player.spec.ts`
- `tests/helpers/createMockScene.ts`

### Decision 2: Phaser Scene mock for Enemy/Player tests

Both `Enemy` and `Player` extend `GameObjects.Sprite` and require a `Scene` argument. Rather than loading Phaser, create a lightweight mock that satisfies the Scene constructor surface area needed:

- `scene.add.existing()` — no-op
- `scene.physics.add.existing()` — no-op
- `scene.sys` — minimal mock
- `scene.textures` — minimal mock

The mock enables instantiation of Player and a concrete Enemy subclass (Chaser) without the full Phaser dependency.

### Decision 3: Concrete Enemy subclass for testing

`Enemy` is abstract (has `getTargetPosition()`). For tests, use `Chaser` as the concrete subclass since it has the simplest target logic (player position). The test file will define a `TestEnemy` helper that extends `Chaser` and exposes protected methods (`chooseDirection`, `moveStep`, `findNearestPassage`) as public for direct testing.

### Decision 4: Directed random testing for chooseDirection

`chooseDirection()` delegates to `randomValidDirection()` for FRIGHTENED state and null targets. Random output makes exact assertions impossible. Test by:

- Running multiple iterations and verifying the result is always a valid non-reverse direction
- For CHASE/DEAD/SCATTER, use fixed grid/target setups where the optimal direction is deterministic

### Decision 5: Private method access via TypeScript bracket access

`Player.canMove()` and `Player.isAtIntersection()` are `private`. Tests SHALL use TypeScript bracket access (`player['canMove']`) with `// @ts-expect-error` to verify them directly. This avoids making them `public` or `protected` for testing purposes only, keeping the production API clean. The `@ts-expect-error` comment documents the intentional access and will flag if the method is renamed/removed.

### Decision 6: MazeGenerator tested via properties, not output matching

The maze is procedurally generated with randomness. Tests assert invariant properties rather than exact output:

- Grid dimensions match the expected (width, height)
- All border cells are WALL
- Interior contains both WALL and PASSAGE
- Spawn area (3×3 center) is all PASSAGE
- No isolated 1-wide wall passages (basic connectivity check)

## Risks / Trade-offs

| Risk                                                                                                | Mitigation                                                                                                                                                                                                                                                   |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Phaser Scene mock has incomplete surface area → tests may break if Enemy/Player constructor changes | Keep mock minimal and focused on what's currently called (`add.existing`, `physics.add.existing`, `sys`, `textures`). Add a note in the mock file about what it covers. If a constructor change breaks tests, update the mock to match the new surface area. |
| `randomValidDirection()` tests are non-deterministic                                                | Use property-based approach (run N iterations, assert all results are valid) rather than expecting specific values                                                                                                                                           |
| Vitest jsdom environment doesn't support Canvas/WebGL needed by Phaser internals                    | The mock Scene bypasses all Phaser internals — no Canvas is touched                                                                                                                                                                                          |
| Enemy protected methods (`chooseDirection`, `moveStep`) are not accessible from tests               | Use a `TestEnemy` helper subclass that exposes them as public (`chooseDirection()`, `moveStep()`)                                                                                                                                                            |
| Player private methods (`canMove`, `isAtIntersection`) are not accessible from tests                | Use TypeScript bracket access (`player['canMove']`) with `// @ts-expect-error`                                                                                                                                                                               |
