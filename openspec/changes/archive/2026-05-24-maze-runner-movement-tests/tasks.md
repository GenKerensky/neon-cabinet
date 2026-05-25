## 1. Phaser Scene Mock Helper

- [x] 1.1 Create `tests/helpers/createMockScene.ts` with a minimal Phaser Scene mock that supports `scene.add.existing()` and `scene.physics.add.existing()` no-ops

## 2. DirectionUtils Tests

- [x] 2.1 Create `tests/utils/DirectionUtils.spec.ts` with tests for `directionToDx` and `directionToDy` returning correct deltas for all 5 Direction values
- [x] 2.2 Add tests for `oppositeDirection` covering all cardinal pairs and NONE
- [x] 2.3 Add tests for `getValidDirections` covering all-passage, mixed wall/passage, and out-of-bounds edge cases

## 3. MazeGenerator Tests

- [x] 3.1 Create `tests/utils/MazeGenerator.spec.ts` with tests for grid dimensions matching difficulty level
- [x] 3.2 Add tests asserting border cells are all WALL (all 4 edges)
- [x] 3.3 Add tests for interior having mixed WALL and PASSAGE cell types
- [x] 3.4 Add tests for the 3×3 center spawn area being all PASSAGE

## 4. Enemy Movement Tests

- [x] 4.1 Create `tests/objects/Enemy.spec.ts` with a concrete test helper subclass (Chaser) that exposes protected methods for testing
- [x] 4.2 Add tests for `chooseDirection` optimal target selection, wall avoidance, and current-direction tie-breaking
- [x] 4.3 Add tests for no-reverse rule: reverse skipped at intersection, reverse allowed in dead-end
- [x] 4.4 Add tests for DEAD state: reverse allowed, targets maze center
- [x] 4.5 Add tests for FRIGHTENED state: random non-reverse direction, dead-end exception
- [x] 4.6 Add tests for `setEnemyState` speed multipliers: SCATTER/CHASE (1×), FRIGHTENED (0.5×), DEAD (4×)
- [x] 4.7 Add tests for `update()` FRIGHTENED timer expiry transitioning to CHASE
- [x] 4.8 Add tests for `findNearestPassage` BFS: finds passage, returns null for wall-surrounded cells

## 5. Player Movement Tests

- [x] 5.1 Create `tests/objects/Player.spec.ts` with Phaser mock scene for construction
- [x] 5.2 Add tests for `setDirection`: first direction, queuing in corridor, immediate turn at intersection
- [x] 5.3 Add tests for `canMove`: wall blocks, passage allows, out-of-bounds rejects
- [x] 5.4 Add tests for `respawn`: clears both currentDirection and nextDirection

## 6. Verification

- [x] 6.1 Run `nx test maze-runner` and verify all tests pass
- [x] 6.2 Run `nx lint maze-runner` and verify no new lint errors
