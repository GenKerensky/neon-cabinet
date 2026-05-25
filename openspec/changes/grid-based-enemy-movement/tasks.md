## 1. Direction Utilities

- [x] 1.1 Create `src/game/utils/DirectionUtils.ts` with `directionToDx()`, `directionToDy()`, `oppositeDirection()`, and `getValidDirections()` functions
- [x] 1.2 Update `Player.ts` to import direction utilities from `DirectionUtils` instead of defining them locally

## 2. Enemy Movement Refactor

- [x] 2.1 Replace `Enemy.ts` movement system: remove `path`, `pathIndex`, `pathfinder`, `pathfindCooldown`, `tryRepathfind()`, `moveRandomDirection()`, `scatterDuration`, `chaseDuration`, `stateTimer` fields and methods
- [x] 2.2 Add to `Enemy.ts`: step-based `move(dt)` that moves the enemy in `currentDirection` and snaps to cell center on arrival
- [x] 2.3 Add to `Enemy.ts`: `chooseDirection(playerX, playerY, playerDir)` that evaluates valid non-reverse directions using Manhattan distance to the target tile returned by `getTargetPosition()`
- [x] 2.4 Implement no-reverse rule: skip `oppositeDirection(currentDirection)` in direction evaluation, with dead-end exception (allow reverse when no other valid direction exists)
- [x] 2.5 Implement FRIGHTENED random direction: when `_state === FRIGHTENED`, `chooseDirection` picks a random valid non-reverse direction
- [x] 2.6 Update `update()` method: call step-based `move()` instead of old `move()` that relied on pathfinding

## 3. Game Scene Coordination

- [x] 3.1 Update `Game.ts` to call `wanderer.setChaserPosition(chaser.gridX, chaser.gridY)` each frame so Wanderer's target calculation works correctly
- [x] 3.2 Verify SCATTER/CHASE timer in Game.ts is functional (previously added, just verify)

## 4. Cleanup & Verification

- [x] 4.1 Remove unused `Pathfinder` import from `Enemy.ts` and any AI files
- [x] 4.2 Build and verify: `nx build maze-runner` passes
- [x] 4.3 Run lint: `nx lint maze-runner` passes
- [x] 4.4 Run frontend tests: `nx test frontend` passes
