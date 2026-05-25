## 1. Increase Maze Dimensions

- [x] 1.1 Update `MazeGenerator` constructor to use base dimensions 21x17 (width x height) instead of 15x13
- [x] 1.2 Update dimension tests in `MazeGenerator.spec.ts` for all 5 difficulty levels

## 2. Add Dead-End Reduction

- [x] 2.1 Add `reduceDeadEnds()` method to `MazeGenerator` that identifies dead-end cells (passage cells with exactly 1 passage neighbor)
- [x] 2.2 Implement wall removal logic: for each dead end, check 3 non-backtrack directions for walls that connect to distant passages, remove with 60% probability
- [x] 2.3 Add boundary check: never remove walls on the outer border of the maze
- [x] 2.4 Wire `reduceDeadEnds()` into the `create()` pipeline (after `generateMaze()`, before `createSpawnArea()`)
- [x] 2.5 Add test: dead-end cells are identified correctly
- [x] 2.6 Add test: wall removal creates loops (BFS connectivity preserved)
- [x] 2.7 Add test: at least 20% of original dead ends remain after reduction

## 3. Move Player Spawn Position

- [x] 3.1 Update `Game.ts` player spawn Y position from `centerY + 2` to `gridHeight - 3`
- [x] 3.2 Keep player spawn X position at `Math.floor(gridWidth / 2)` (centered)
- [x] 3.3 Update any tests that rely on player starting position

## 4. Add Gate Delay for Enemies

- [x] 4.1 Add `gateOpenTime` constant (2000ms) to `Game.ts`
- [x] 4.2 Record game start timestamp in `Game.ts create()`
- [x] 4.3 Add gate-open check in enemy movement: enemies inside enclosure cannot pass through gate cell until 2000ms elapsed
- [x] 4.4 Add test: enemies cannot exit gate before 2000ms
- [x] 4.5 Add test: enemies can exit gate after 2000ms

## 5. Verify All Tests Pass

- [x] 5.1 Run full test suite and fix any failures
- [ ] 5.2 Manually test gameplay to verify player has safe start and maze feels more open
