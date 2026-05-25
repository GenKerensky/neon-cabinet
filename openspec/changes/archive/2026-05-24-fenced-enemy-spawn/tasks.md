## 1. MazeGenerator Enclosure

- [x] 1.1 Add `createEnemyEnclosure()` method to MazeGenerator that builds 3x2 walled room with bottom-center gate
- [x] 1.2 Add clear passage ring outside enclosure walls
- [x] 1.3 Wire `createEnemyEnclosure()` into the `create()` pipeline (after `createSpawnArea()`)

## 2. Update Game Scene Spawn Positions

- [x] 2.1 Move the 4 enemy spawn grid positions into the enclosure interior cells
- [x] 2.2 Remove the old `enemySpawnY` variable — positions are now relative to center

## 3. Update MazeGenerator Tests

- [x] 3.1 Add test for enclosure interior cells being passages
- [x] 3.2 Add test for top wall cells being walls
- [x] 3.3 Add test for left and right wall cells being walls
- [x] 3.4 Add test for bottom walls with center gate
- [x] 3.5 Add test for clear passage ring above/below/left/right of enclosure
