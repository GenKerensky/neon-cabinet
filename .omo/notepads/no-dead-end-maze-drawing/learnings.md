## 2026-05-28

- Removed obsolete dead-end-positive expectations from `apps/maze-runner/tests/utils/MazeGenerator.spec.ts`.
- Kept a minimal Task 7 placeholder comment in the dead-end reduction section for upcoming no-dead-end invariant tests.
- Preserved and exported `withMockedRandom` and `createMazeForStage` helpers for future stage-based invariant coverage.
- Added explicit topology contract placeholders in `apps/maze-runner/src/game/utils/MazeGenerator.ts`:
  - `MIN_INTERIOR_OPEN_RATIO = 0.6`
  - `MAX_WALL_PLACEMENT_ATTEMPTS = 500`
- Added internal contract types `GeneratedWallCandidate` and `ProtectedCellSet` for upcoming open-first wall placement work.
- Documented that `constructor(difficulty = 1, stage = 1)` keeps `stage` for backward compatibility while topology intent is no longer stage-gated.

## 2026-05-29

- Added reusable topology helpers in `apps/maze-runner/tests/utils/MazeGenerator.spec.ts` and exported them for other tests:
  - `getNormalGameplayCells`
  - `countDegreeOnePassages`
  - `assertAllPassagesReachableFromPlayerSpawn`
  - `findSingleEntryPockets`
  - `getInteriorOpenRatio`
  - `countForbiddenSolidWallBlocks`
- Defined protected cells in the spec helper layer as border cells plus the ghost enclosure interior, walls, gate, and surrounding passage ring.
- Added inline pattern-grid coverage for dead-end detection, single-entry loop pockets, protected-cell wall-clump exclusion, open-ratio reporting, and spawn reachability.
- Verified the spec with `bunx vitest run apps/maze-runner/tests/utils/MazeGenerator.spec.ts --config apps/maze-runner/vite.config.mts`.

## 2026-05-29

- Renamed the remaining BFS coverage in `apps/maze-runner/tests/utils/MazeGenerator.spec.ts` to `passage connectivity` and removed the stale dead-end suite naming.
- Removed the unused `getMaxDeadEndDepth` helper and its now-unused `Point`/`getPassageNeighbors` support code from the spec file.
- Confirmed no `dead end`, `dead-end`, or `deadEnd` strings remain in that test file.
- Removed the dead `getOpenFirstTopologyContract()` stub from `MazeGenerator.ts` and left the open-first contract constants/types at the top of the file for Task 4 implementation.

## 2026-05-29

- Replaced `MazeGenerator.create()` topology flow with open-first sequence:
  `initializeOpenInteriorGrid()` -> `applyProtectedStructures()` -> `placeSparseWalls()` -> `repairByOpeningWalls()` -> `validateFinalMazeOrFallback()`.
- Removed DFS maze carving and dead-end reduction from the primary generation path (no `generateMaze()`/`reduceDeadEnds()` calls in `create()`).
- Implemented internal invariant helpers mirroring spec taxonomy logic:
  - `countDegreeOnePassages()`
  - `findSingleEntryPockets()` (Tarjan articulation-point based)
  - `getInteriorOpenRatio()`
  - `countForbiddenSolidWallBlocks()`
  - `assertAllPassagesReachableFromPlayerSpawn()`
- Protected-cell set now explicitly includes border, enclosure interior, enclosure walls, gate, and enclosure passage ring; sparse wall placement skips all protected cells.
- Sparse wall placement now attempts randomized interior candidates (bounded by `MAX_WALL_PLACEMENT_ATTEMPTS`) and only keeps walls that preserve all invariants and minimum open ratio.
- Repair strategy now only opens generated wall cells (never adds walls), prioritizing generated walls adjacent to violation cells.
- Fallback now reconstructs border+protected layout and replays only invariant-safe accepted sparse walls; if still invalid, it returns the protected baseline layout.

## 2026-05-29

- Added an optional `rng: () => number = Math.random` seam to `apps/maze-runner/src/game/utils/MazeGenerator.ts` so sparse-wall placement can be deterministic in tests without changing 1-arg or 2-arg constructor call sites.
- Kept `void stage;` in the constructor for backward compatibility and replaced the only in-file `Math.random` usage with `this.rng()`.

## 2026-05-29

- Re-validated open-first protected-structure integration in `apps/maze-runner/src/game/utils/MazeGenerator.ts`:
  - `applyProtectedStructures()` calls `createSpawnArea()` -> `createEnemyEnclosure()` -> `createPlayerSpawnArea()` and only then assigns `this.protectedCells = this.buildProtectedCellSet()`.
  - `buildProtectedCellSet()` includes border cells plus enclosure interior (3x2), enclosure walls, gate cell, and full passage ring (top/bottom rows `centerX-2..centerX+2`, side columns `centerY-1..centerY+2`).
- Replaced the `enemy enclosure` test block in `apps/maze-runner/tests/utils/MazeGenerator.spec.ts` with stricter topology contract tests:
  - `enemy enclosure contract is preserved`
  - `enclosure ring has no adjacent dead ends`
  - `enclosure ring is reachable from player spawn`
  - `has no single-entry pocket violations around protected structures`
- Verified with:
  - `bunx vitest run apps/maze-runner/tests/utils/MazeGenerator.spec.ts --config apps/maze-runner/vite.config.mts` (pass, 20/20)
  - `bunx tsc --noEmit --project apps/maze-runner/tsconfig.json` (pass, no diagnostics output)

## 2026-05-29

- Added deterministic property-style invariant coverage in `apps/maze-runner/tests/utils/MazeGenerator.spec.ts` across:
  - difficulties `[1, 2, 3]`
  - stages `[1, 2, 3, 5]`
  - seeded RNG runs with seeds `[1, 17, 42, 1337, 2026]`
- Used the constructor RNG seam (`new MazeGenerator(difficulty, stage, rng)`) with a local seeded LCG helper and avoided `withMockedRandom` for this suite.
- Reused topology/enclosure helper assertions and enforced per-generated-maze invariants:
  - zero degree-1 passages in normal gameplay cells
  - all passages reachable from player spawn
  - no single-entry pockets
  - interior open ratio `>= 0.60`
  - zero forbidden unprotected 2x2 solid-wall blocks
  - border walls remain walls
  - enclosure contract and player spawn validity are preserved

## 2026-05-29

- Confirmed `apps/maze-runner/src/game/scenes/Game.ts` still constructs `new MazeGenerator(difficulty, this.levelValue)` at line 80; the new optional RNG parameter in `MazeGenerator` does not break the two-argument call site.
- Confirmed `CollectibleManager` creation at lines 106-116 still consumes `this.grid`, `this.gridWidth`, `this.gridHeight`, offsets, and `this.levelValue` without type errors.
- Verified scene lifecycle behavior remains unchanged in this compatibility check.
- Typecheck passed with `bunx tsc --noEmit --project apps/maze-runner/tsconfig.json`.
