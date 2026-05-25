## ADDED Requirements

### Requirement: Enemy base speed

The system SHALL define a base enemy movement speed as 80 pixels per second. All speed multipliers are applied relative to this base. The base speed is approximately 10% slower than the player's full movement speed to allow the player to outrun enemies in open corridors.

#### Scenario: Base speed applied in SCATTER/CHASE

- **WHEN** an enemy is in SCATTER or CHASE state
- **THEN** the enemy moves at exactly 80 px/s (1.0× base speed)
- **AND** it traverses one grid cell of size 24px in approximately 0.3 seconds

#### Scenario: FRIGHTENED speed is halved

- **WHEN** an enemy is in FRIGHTENED state
- **THEN** the enemy moves at 40 px/s (0.5× base speed)

#### Scenario: DEAD speed is quadrupled

- **WHEN** an enemy is in DEAD state
- **THEN** the enemy moves at 320 px/s (4.0× base speed)

### Requirement: Enemy moves step-by-step on the grid

The system SHALL move each enemy one grid cell at a time along PASSAGE cells using step-based movement. The enemy chooses a direction at each cell center and moves continuously toward the next cell center until it arrives.

#### Scenario: Enemy moves from cell to adjacent cell

- **WHEN** an enemy is at grid position (5, 5) moving RIGHT
- **THEN** the enemy moves continuously toward the center of cell (6, 5) at its current speed
- **AND WHEN** the enemy reaches the center of cell (6, 5)
- **THEN** it snaps to exact center and its grid position updates to (6, 5)

#### Scenario: Snap tolerance at cell center

- **WHEN** the enemy's pixel position is within 2px of the next cell center (Euclidean distance < 2px)
- **THEN** the enemy snaps to the exact cell center pixel position

#### Scenario: Frame-crossing detection

- **WHEN** the enemy's movement across a single frame would pass through the next cell center (the sign of centerX − x changes between frames)
- **THEN** the enemy snaps to the exact cell center and the movement remainder is discarded (not rolled over to the next cell)

#### Scenario: Maximum per-frame movement cap

- **WHEN** the enemy's per-frame movement exceeds one cell width (e.g., DEAD state at low delta)
- **THEN** the enemy moves in iterative sub-steps, processing each cell arrival in sequence before applying remaining movement

#### Scenario: Enemy stops at wall

- **WHEN** an enemy's current direction leads to a WALL cell
- **THEN** the enemy snaps to the current cell center and chooses a new direction

### Requirement: Speed applies immediately on state transition

The system SHALL apply a new speed multiplier immediately when the enemy's state changes, even if the enemy is mid-cell (between centers).

#### Scenario: Mid-cell state transition applies speed immediately

- **WHEN** an enemy is in CHASE state moving at 80 px/s mid-cell
- **AND** the enemy enters FRIGHTENED state
- **THEN** its speed is immediately reduced to 40 px/s for the remainder of the current cell traversal

#### Scenario: Mid-cell DEAD transition

- **WHEN** an enemy is in FRIGHTENED state mid-cell
- **AND** the player collides with it, triggering DEAD state
- **THEN** its speed immediately increases to 320 px/s for the remainder of the current cell traversal

### Requirement: Enemy chooses direction at each cell via target-tile chasing

The system SHALL select the enemy's next direction at each cell center by evaluating all valid non-reverse directions and picking the one whose adjacent cell has the shortest Manhattan distance to the enemy's current target tile.

#### Scenario: Direction chosen toward target

- **WHEN** an enemy arrives at cell center, target is at (10, 5), and valid directions are RIGHT (adjacent (6,5), dist=4), DOWN (adjacent (5,6), dist=10), UP (adjacent (5,4), dist=10)
- **THEN** the enemy picks RIGHT

#### Scenario: Tie broken by current direction

- **WHEN** two or more directions have equal Manhattan distance to the target
- **THEN** the enemy prefers its current direction over alternatives

### Requirement: Enemy cannot reverse direction by default

The system SHALL prevent an enemy from reversing direction (180° turn) unless entering FRIGHTENED or DEAD state, or when no other valid direction exists. After the initial direction choice on state entry, the no-reverse rule SHALL apply for all subsequent cell-center decisions until the next state transition.

#### Scenario: Enemy does not reverse at intersection

- **WHEN** an enemy is moving RIGHT and arrives at an intersection with valid directions UP, DOWN, and RIGHT
- **THEN** LEFT (reverse) is not considered as a valid direction

#### Scenario: Enemy reverses when trapped

- **WHEN** an enemy is in a dead-end corridor and the only valid direction is reverse (the way it entered)
- **THEN** the enemy may reverse

### Requirement: Enemy direction changes on state transitions

The system SHALL allow direction reversal when the enemy enters FRIGHTENED or DEAD state.

#### Scenario: FRIGHTENED enemy reverses on entry

- **WHEN** an enemy enters FRIGHTENED state
- **THEN** it may reverse direction on this first cell-center decision
- **AND** the no-reverse rule re-applies for all subsequent cell-center decisions until the next state transition

#### Scenario: DEAD enemy reverses on entry

- **WHEN** an enemy enters DEAD state
- **THEN** it may reverse direction on this first cell-center decision
- **AND** the no-reverse rule re-applies for all subsequent cell-center decisions until the next state transition

### Requirement: FRIGHTENED enemy moves randomly

The system SHALL make FRIGHTENED enemies pick a random valid non-reverse direction at each cell center.

#### Scenario: FRIGHTENED direction picked randomly

- **WHEN** an enemy is in FRIGHTENED state and arrives at a cell center with valid directions LEFT, RIGHT, UP
- **THEN** a random direction among LEFT, RIGHT, UP is selected

### Requirement: Maze center cell defined

The system SHALL define the maze center cell as the cell at grid coordinates (⌊W/2⌋, ⌊H/2⌋), where W is the maze width in cells and H is the maze height in cells. If the geometric center cell is a WALL cell, the system SHALL use the nearest PASSAGE cell as determined by BFS from the geometric center.

#### Scenario: Center cell is passage

- **WHEN** the maze is 15×13 cells
- **THEN** the center cell is (7, 6)
- **AND WHEN** cell (7, 6) is a PASSAGE cell
- **THEN** the center is set to (7, 6)

#### Scenario: Center cell is wall

- **WHEN** the center cell (7, 6) is a WALL cell
- **THEN** the center is set to the nearest PASSAGE cell via BFS from (7, 6)
- **AND** if multiple equidistant cells exist, the one with smallest row index is chosen

### Requirement: DEAD enemy targets maze center

The system SHALL make DEAD enemies navigate toward the defined maze center cell using the same target-tile chasing logic, but with reverse allowed.

#### Scenario: DEAD enemy moves to center

- **WHEN** an enemy is in DEAD state
- **THEN** its target tile is the maze center cell
- **AND** it picks the direction that minimizes Manhattan distance to the center

### Requirement: Completely-surrounded fallback for direction selection

The system SHALL handle the edge case where no valid direction exists at a cell center (all adjacent cells are walls or reverse is the only option and no-reverse applies).

#### Scenario: No valid direction available

- **WHEN** all four adjacent cells are WALL or out of bounds
- **THEN** the enemy SHALL remain at its current cell center until a valid direction becomes available
- **AND** the enemy SHALL re-evaluate directions each subsequent frame
