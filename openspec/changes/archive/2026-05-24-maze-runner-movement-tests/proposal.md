## Why

The maze-runner game has no test coverage for its core movement system. The recent refactor from A\* pathfinding to target-tile chasing introduced complex direction-selection logic (no-reverse rule, FRIGHTENED random, DEAD center-targeting, step-based snapping) that has zero test coverage. Movement bugs are caught only through manual gameplay, making regressions invisible. Unit tests are needed before further gameplay features can be built with confidence.

## What Changes

- Create a unit test suite for `DirectionUtils` covering all direction-to-delta mappings, opposite-direction, and valid-direction filtering
- Create a unit test suite for `MazeGenerator` covering grid dimensions, wall borders, and spawn area generation
- Create a unit test suite for Enemy movement logic covering `chooseDirection()`, `randomValidDirection()`, `findNearestPassage()`, `setEnemyState()` speed changes, and FRIGHTENED timer expiry
- Create a unit test suite for Player movement logic covering `setDirection()` intersection behavior, direction queuing, `canMove()` wall/passage detection, and `respawn()`
- Add a Phaser Scene mock helper for unit-testing classes that depend on `GameObjects.Sprite`

## Capabilities

### New Capabilities

- `enemy-movement-tests`: Unit tests for the enemy target-tile chasing movement system
- `player-movement-tests`: Unit tests for the player direction-queuing movement system
- `direction-utils-tests`: Unit tests for the shared direction utility functions
- `maze-generator-tests`: Unit tests for the maze generation algorithm

## Impact

- `apps/maze-runner/tests/`: New test directory with spec files for each capability
- `apps/maze-runner/src/game/utils/DirectionUtils.ts`: No changes (tests only)
- `apps/maze-runner/src/game/utils/MazeGenerator.ts`: No changes (tests only)
- `apps/maze-runner/src/game/objects/Enemy.ts`: No changes (tests only)
- `apps/maze-runner/src/game/objects/Player.ts`: No changes (tests only)
- `apps/maze-runner/vite.config.mts`: May need minor test configuration adjustment
