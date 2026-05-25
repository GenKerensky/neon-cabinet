## Context

The maze-runner game uses a grid-based maze (15×13 to 19×17 depending on difficulty) where all entities move in cardinal directions through PASSAGE cells. The current enemy movement system uses A\* pathfinding to compute full paths from enemy → target, then follows waypoints one cell at a time. This has three failure modes:

1. **Target is a wall cell** (e.g., scatter corner) → A\* returns null → enemy falls to random movement
2. **Path goes stale** between recalculations (500ms cooldown) → enemy continues old heading while player has moved
3. **No-reverse rule missing** → enemy can oscillate between two cells at dead-ends

The fix replaces A\* waypoint-following with a **target-tile chasing** system — the approach used by classic Pac-Man ghosts. Each enemy makes a greedy direction decision at every cell center, picking the valid passage that minimizes distance to their target tile.

## Goals / Non-Goals

**Goals:**

- Enemies always move through valid passage cells (no wall penetration)
- Enemies navigate around walls toward their target (no wall-hugging)
- Each enemy type retains its distinct behavior (Chaser pursues, Ambusher predicts, etc.)
- Movement is smooth, jitter-free, and responsive to player motion
- Code is simpler and more maintainable than the current A\* system

**Non-Goals:**

- Optimal pathfinding — greedy tile-chasing intentionally produces suboptimal paths that make enemies less predictable and more fun
- Player movement changes — player keeps the existing direction-queueing system
- Visual changes — sprite rendering and animation remain untouched

## Decisions

### Decision 1: Target-tile chasing over A\* pathfinding

**Option A (chosen):** Greedy direction selection at each cell center.

- At arrival, evaluate all valid directions (not reverse, not wall)
- Pick the one whose adjacent cell has the smallest Manhattan distance to the target tile
- Move one cell in that direction

**Option B (rejected):** Keep A\* but fix issues (validate targets, add no-reverse, reduce cooldown).

- Reason: A\* is over-engineered for this use case. The maze is small (≤323 cells) and the player moves continuously — any pre-computed path is stale by the time the enemy finishes it. Greedy chasing is simpler, more responsive, and closer to the classic Pac-Man behavior players expect.

**Option C (rejected):** BFS per cell to find the best direction.

- Reason: BFS from every cell center is more expensive than Manhattan distance with no gameplay benefit — Manhattan gives equivalent results on a grid.

### Decision 2: No-reverse by default, except state transitions

Direction reversal (180° turn) is only allowed when:

- Entering FRIGHTENED state (scatter → random)
- Entering DEAD state (return to center)
- Dead-end where no other direction is available

Otherwise, the enemy cannot reverse. This prevents the jittery back-and-forth oscillation seen in the current system when enemies reach wall boundaries.

### Decision 3: Extract direction utilities into shared module

`getDirectionX(dir)`, `getDirectionY(dir)`, `oppositeDirection(dir)` currently exist in `Player.ts`. Extract them into a shared `DirectionUtils.ts` module used by both Player and Enemy. This avoids duplication and ensures consistent direction semantics.

### Decision 4: Keep Pathfinder for offline use

The A\* Pathfinder class is NOT removed. It may be useful for:

- Level validation (verify all passages are reachable)
- Debug overlay rendering
- Future features (e.g., hint system)
- Scatter target validation at maze generation time

It just won't be called during gameplay.

### Decision 5: Explicit corridor-centering via snap-to-grid

Each frame, the enemy moves at `speed * dt` pixels in its current direction. When it reaches or passes the next cell center (within 2px tolerance), it snaps to exact center and chooses the next direction. This keeps enemies aligned to corridor centers and prevents visual wall-overlap.

Speed changes (state transitions) take effect immediately, even mid-cell. At DEAD speed (4×), a single frame's movement may exceed one cell width — the movement is handled via iterative sub-steps, processing each cell arrival in sequence.

## Architecture

```
┌─────────────┐    target     ┌──────────────────┐
│  AI subclass │─────────────▶│  Enemy.update()   │
│ (getTarget)  │              │  move steps:      │
└─────────────┘              │  1. move in dir    │
                              │  2. at cell center?│
                              │     → snap + pick  │
                              │  3. pick: evaluate │
                              │     each valid dir │
                              │     via Manhattan  │
                              │     to target tile │
                              └──────────────────┘
                                       │
                              ┌────────▼────────┐
                              │ Shared Utils    │
                              │ DirectionUtils   │
                              │ (dx/dy, opposite)│
                              └─────────────────┘
```

### Enemy.update() flow

```
update(delta, playerX, playerY, playerDir):
  dt = delta / 1000

  // State timers
  if FRIGHTENED: update timer → CHASE on expire
  if DEAD: update timer → CHASE on expire, move to center, return

  // Step movement
  moveAmount = speed * dt
  dx, dy = directionDxDy(currentDirection)
  newX = x + dx * moveAmount
  newY = y + dy * moveAmount

  // Check if reached next cell center
  nextGridX = gridX + dx
  nextGridY = gridY + dy
  centerX = offsetX + nextGridX * tileSize + tileSize/2
  centerY = offsetY + nextGridY * tileSize + tileSize/2

  distToCenter = hypot(centerX - newX, centerY - newY)
  // Also check if past center (crossed it between frames)
  // by comparing sign of (centerX - x) vs (centerX - newX)

  if at center or crossed center:
    snap to center
    gridX, gridY = nextGridX, nextGridY
    currentDirection = chooseDirection(playerX, playerY, playerDir)
  else:
    x, y = newX, newY
```

### chooseDirection() flow

```
chooseDirection(playerX, playerY, playerDir):
  target = getTargetPosition(playerX, playerY, playerDir)
  if FRIGHTENED or target is null:
    return randomValidDirection(allowReverse=false)

  bestDir = NONE  // will stay on current cell if no valid direction found
  bestDist = Infinity

  for each Direction in [UP, DOWN, LEFT, RIGHT]:
    if not isValidDirection(dir): continue
    if dir == opposite(currentDirection): continue  // no-reverse
    nextX = gridX + directionDx(dir)
    nextY = gridY + directionDy(dir)
    if nextX/Y is out of bounds or wall: continue
    dist = manhattan(nextX, nextY, target.x, target.y)
    if dist < bestDist:
      bestDist = dist
      bestDir = dir

  return bestDir
```

Turn bias: If two directions tie on Manhattan distance, prefer the current direction. This creates natural "continue straight" behavior.

### DEAD state movement

In DEAD state, the enemy ignores the no-reverse rule and targets the maze center cell. The same greedy direction-picking logic applies, but with the ability to reverse. This lets the DEAD enemy turn around and head back to center regardless of its current direction.

### FRIGHTENED state movement

Random valid direction at each cell center, no-reverse still applies. Standard Pac-Man behavior.

### Redundant field removal from Enemy.ts

With Game.ts managing SCATTER/CHASE timers, the following fields in `Enemy.ts` become redundant and SHALL be removed: `scatterDuration`, `chaseDuration`, `stateTimer`. The per-enemy FRIGHTENED timer (`frightenedTimer`) is retained as it governs the per-enemy FRIGHTENED state duration.

## Risks / Trade-offs

| Risk                                                                                                                                        | Mitigation                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Greedy chasing can cause enemies to take long routes around walls (e.g., going around the entire maze perimeter instead of cutting through) | This is intentional — it creates more interesting, less predictable chases. For Ambusher and Wanderer, their predicted targets naturally handle some of this. If a specific enemy takes too-long routes, adjust its target calculation (not the movement system). |
| Enemies may cluster together if all target the same tile (player position)                                                                  | Classic Pac-Man behavior is preserved. The Ambusher (targets ahead) and Wanderer (targets combined position) naturally spread out. Chaser + Timid clustering in CHASE mode is expected and creates exciting moments.                                              |
| Player can "juke" enemies by reversing direction (enemy commits to a direction before the player turns)                                     | This IS the desired gameplay mechanic — tricking enemies by changing direction at intersections is core Pac-Man strategy.                                                                                                                                         |
| The no-reverse rule could trap an enemy in a dead-end corridor if the only exit is behind them                                              | Handled by the dead-end exception: if no valid directions exist (other than reverse), reverse is allowed.                                                                                                                                                         |

## Resolved Questions

1. **Wanderer's `setChaserPosition` wiring**: Game.ts calls `wanderer.setChaserPosition(chaser.gridX, chaser.gridY)` each frame in its update loop. If never called, Wanderer defaults to its own spawn position (see `specs/enemy-ai/spec.md`).
