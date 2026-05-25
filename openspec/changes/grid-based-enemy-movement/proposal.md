## Why

The current enemy movement system uses A* pathfinding with waypoint-following, but enemies still move through walls, jitter at corners, and "hug" walls instead of pathfinding around them. The A* approach is over-engineered for a fixed-grid maze game — it pre-computes full paths that go stale the moment the player moves, leading to constant path recalculations, caching issues, and fallback logic that produces random, jittery behavior instead of natural pursuit.

## What Changes

- **Replace A\* waypoint-following with target-tile chasing**: Enemies pick the best valid direction at each cell center based on distance to their target, instead of following a pre-computed path. This is how classic Pac-Man ghosts work.
- **Add "no-reverse" rule**: Enemies cannot reverse direction unless entering FRIGHTENED or DEAD state. This prevents jittery oscillation.
- **Remove A\* pathfinder dependency from enemy movement**: The `Pathfinder` class is no longer needed for runtime enemy navigation. It may be kept for other uses (e.g., level validation, debug rendering).
- **Simplify `Enemy.ts` movement**: Remove `tryRepathfind()`, `moveRandomDirection()`, path cooldown, intersection detection, and waypoint array. Replace with `chooseDirection()`, step-based movement.
- **Add `directionDx`/`directionDy` utilities**: Extract direction → delta mapping into shared helper (currently duplicated between Player and Enemy).
- **Add `oppositeDirection` utility**: Helper to prevent reversal.

## Capabilities

### New Capabilities

- `enemy-movement`: Grid-based enemy movement using target-tile chasing with per-cell direction decisions, no-reverse rule, and step-by-step movement.

### Modified Capabilities

- `enemy-ai`: Change from "enemy state machine with A\* pathfinding" to "enemy state machine with target-tile chasing". The state machine (SCATTER/CHASE/FRIGHTENED/DEAD) and AI target calculations (Chaser/Ambusher/Wanderer/Timid) remain unchanged — only the MOVEMENT mechanic changes.
- `pathfinding`: The A\* Pathfinder is no longer used by enemies at runtime. It may be removed or kept for offline use.

## Impact

- `apps/maze-runner/src/game/objects/Enemy.ts`: Major refactor — replace `move()`, `tryRepathfind()`, `moveRandomDirection()`, `moveBackToMaze()` with new step-based movement
- `apps/maze-runner/src/game/objects/Player.ts`: Extract `getDirectionX()`, `getDirectionY()` as shared utilities (or add a DirectionUtils module)
- `apps/maze-runner/src/game/utils/Pathfinder.ts`: No longer imported by Enemy. Can be cleaned up or removed.
- `apps/maze-runner/src/game/ai/Chaser.ts`: No changes needed (only `getTargetPosition()` changes)
- `apps/maze-runner/src/game/ai/Ambusher.ts`: No changes needed
- `apps/maze-runner/src/game/ai/Wanderer.ts`: No changes needed (but `setChaserPosition()` should be used from Game.ts)
- `apps/maze-runner/src/game/ai/Timid.ts`: No changes needed
- `apps/maze-runner/src/game/scenes/Game.ts`: May need minor changes if Wanderer's `setChaserPosition` is called
