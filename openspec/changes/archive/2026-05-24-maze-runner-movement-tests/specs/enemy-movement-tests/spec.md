## ADDED Requirements

### Requirement: chooseDirection picks optimal direction toward target

When in SCATTER or CHASE state, `chooseDirection()` SHALL evaluate all valid non-reverse directions and pick the one whose adjacent cell has the shortest Manhattan distance to the target tile.

#### Scenario: Picks direction toward target

- **WHEN** enemy is at grid (5, 5), target is (10, 5), currentDirection is RIGHT with valid passages RIGHT, UP, DOWN
- **THEN** chooseDirection returns RIGHT

#### Scenario: Prefers current direction on tie

- **WHEN** enemy is at grid (5, 5), target is (7, 6), currentDirection is DOWN, valid passages are DOWN (to 5,6) and RIGHT (to 6,5) with equal Manhattan distance of 3
- **THEN** chooseDirection returns DOWN (current direction preferred over tie)

#### Scenario: Does not pick wall cells

- **WHEN** the shortest Manhattan path would go through a WALL cell
- **THEN** chooseDirection picks a valid passage direction even if it's longer

### Requirement: No-reverse rule prevents direction reversal

`chooseDirection()` SHALL skip the direction opposite to `currentDirection` unless the enemy is in DEAD state, in a dead-end corridor, or no other valid passage direction is available (double-fallback).

#### Scenario: Double-fallback tries reverse passage

- **WHEN** enemy is at grid (5, 5), currentDirection is RIGHT, and the only valid passage cell is LEFT (reverse) — i.e., no non-reverse direction is valid
- **THEN** chooseDirection returns LEFT (falls back to reverse direction)

#### Scenario: Skips reverse at intersection

#### Scenario: Skips reverse at intersection

- **WHEN** enemy is moving RIGHT at an intersection with valid passages in LEFT, UP, DOWN
- **THEN** LEFT (reverse) is not considered as a candidate

#### Scenario: Dead-end allows reverse

- **WHEN** enemy is moving UP in a dead-end corridor where the only passage is the cell below (reverse direction)
- **THEN** chooseDirection returns DOWN (reverse)

### Requirement: DEAD state can reverse and targets maze center

When in DEAD state, `chooseDirection()` SHALL allow reverse direction and use the maze center cell as the target.

#### Scenario: DEAD enemy can reverse

- **WHEN** enemy is in DEAD state, moving RIGHT, and LEFT is a valid passage
- **THEN** LEFT is a candidate direction (no-reverse is not enforced)

#### Scenario: DEAD enemy targets center

- **WHEN** enemy is in DEAD state and maze center is at (7, 6)
- **THEN** chooseDirection evaluates distances to (7, 6) instead of the AI's target

### Requirement: FRIGHTENED state picks random direction

When in FRIGHTENED state, `chooseDirection()` SHALL return a random valid direction that is not the reverse of `currentDirection`.

#### Scenario: FRIGHTENED picks random non-reverse direction

- **WHEN** enemy is in FRIGHTENED state, moving RIGHT, with valid directions UP, DOWN, LEFT
- **THEN** the result is always one of UP or DOWN (LEFT is excluded as reverse)

#### Scenario: FRIGHTENED allows reverse in dead-end

- **WHEN** enemy is in FRIGHTENED state, moving RIGHT, and the only valid passage is LEFT
- **THEN** the result may be LEFT (reverse) since no other direction is valid

### Requirement: Null target falls back to random direction

When `getTargetPosition()` returns null, `chooseDirection()` SHALL use `randomValidDirection()` to pick a random non-reverse direction.

#### Scenario: Null target falls back to random in SCATTER/CHASE

- **WHEN** enemy is in SCATTER or CHASE state and getTargetPosition returns null (via a test stub subclass)
- **THEN** a random valid non-reverse direction is returned

### Requirement: setEnemyState adjusts speed correctly

`setEnemyState()` SHALL set the enemy speed based on the new state: SCATTER/CHASE → baseSpeed, FRIGHTENED → baseSpeed × 0.5, DEAD → baseSpeed × 4.

#### Scenario: SCATTER speed is base

- **WHEN** setEnemyState(SCATTER) is called
- **THEN** speed equals baseSpeed

#### Scenario: FRIGHTENED speed is halved

- **WHEN** setEnemyState(FRIGHTENED) is called
- **THEN** speed equals baseSpeed × 0.5
- **AND** frightenedTimer equals 8000 (milliseconds)

#### Scenario: DEAD speed is quadrupled

- **WHEN** setEnemyState(DEAD) is called
- **THEN** speed equals baseSpeed × 4

### Requirement: FRIGHTENED timer transitions to CHASE on expiry

When the FRIGHTENED timer reaches zero in `update()`, the enemy SHALL transition to CHASE state.

#### Scenario: FRIGHTENED expires to CHASE

- **WHEN** update is called with delta exceeding the remaining frightenedTimer
- **THEN** the enemy's state becomes CHASE

### Requirement: findNearestPassage finds closest passage via BFS

`findNearestPassage()` SHALL perform a breadth-first search from the given start coordinate and return the nearest PASSAGE cell, or null if none is reachable.

#### Scenario: Finds adjacent passage

- **WHEN** findNearestPassage is called from (5, 5) and (5, 6) is PASSAGE
- **THEN** returns { x: 5, y: 6 }

#### Scenario: Finds passage after BFS

- **WHEN** findNearestPassage is called from a wall cell surrounded by walls except at distance 3
- **THEN** returns the nearest PASSAGE cell

#### Scenario: No reachable passage returns null

- **WHEN** findNearestPassage is called from a completely wall-surrounded cell
- **THEN** returns null

#### Scenario: BFS distance measured by cell steps

- **WHEN** findNearestPassage is called from (5, 5) and the closest PASSAGE is 3 cells away at (5, 8)
- **THEN** the BFS visits cells at distance 1, then 2, then 3 before returning { x: 5, y: 8 }, ensuring the nearest passage by step count is found

### Requirement: update orchestrates movement and state transitions

`update()` SHALL call `moveStep()` for pixel advancement and snap-to-cell, then check state timers. For FRIGHTENED state, if `frightenedTimer` expires below zero, transition to CHASE. For DEAD state, if grid position equals maze center, transition to CHASE.

#### Scenario: FRIGHTENED timer expires to CHASE

- **WHEN** update is called with delta greater than remaining frightenedTimer
- **THEN** enemy state changes to CHASE
- **AND** speed is set to baseSpeed

#### Scenario: DEAD arrives at center transitions to CHASE

- **WHEN** update is called while enemy is DEAD with grid position at maze center
- **THEN** enemy state changes to CHASE

#### Scenario: update calls moveStep each frame

- **WHEN** update is called while enemy has a valid currentDirection
- **THEN** moveStep is invoked to advance the enemy's pixel position

### Requirement: DEAD enemy exits on center arrival

When a DEAD enemy's grid position matches the maze center, `update()` SHALL transition the enemy to CHASE state.

#### Scenario: DEAD arrives at center

- **WHEN** DEAD enemy's gridX/gridY equals mazeCenter.x/mazeCenter.y
- **THEN** update transitions to CHASE state

### Requirement: moveStep snaps to cell center on arrival

`moveStep()` SHALL snap the enemy to the exact pixel position of the next cell center when it arrives within 2px tolerance or crosses the center between frames. On arrival, the enemy SHALL re-evaluate its direction via `chooseDirection()`.

#### Scenario: Snaps within tolerance

- **WHEN** the enemy moves within 2px of the next cell center
- **THEN** the enemy's x/y are set to the exact center coordinates
- **AND** chooseDirection is called to select the next direction

#### Scenario: Wall collision snaps to current cell

- **WHEN** the enemy's current direction leads to a WALL cell
- **THEN** the enemy snaps to the current cell center
- **AND** chooseDirection is called to select a new valid direction

#### Scenario: Frame-crossing detected

- **WHEN** the enemy's movement in one frame passes through the cell center (sign change)
- **THEN** the enemy snaps to the exact center position
- **AND** chooseDirection is called to select the next direction

#### Scenario: Normal movement advances position

- **WHEN** the enemy moves in a valid passage direction and has not yet reached the next cell center
- **THEN** the enemy's x/y advances by `speed × dt` toward the next cell center

#### Scenario: Out-of-bounds direction snaps to current cell

- **WHEN** the enemy's current direction leads outside the grid bounds (e.g., at grid edge)
- **THEN** the enemy snaps to the current cell center
- **AND** chooseDirection is called to select a direction that stays in bounds
