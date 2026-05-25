## ADDED Requirements

### Requirement: setDirection sets current direction when none

When `currentDirection` is NONE, `setDirection()` SHALL set it to the given direction immediately.

#### Scenario: First direction sets current

- **WHEN** currentDirection is NONE and setDirection(RIGHT) is called
- **THEN** currentDirection becomes RIGHT

### Requirement: setDirection queues next direction in corridors

When not at an intersection (fewer than 3 adjacent passage cells), `setDirection()` SHALL store the direction in `nextDirection` without changing `currentDirection`. The queued direction is applied later by `update()` when the player reaches an intersection or a dead-end wall.

#### Scenario: Queues next direction in corridor

- **WHEN** player is at grid position (5, 5) with exactly 2 valid passages (LEFT and RIGHT), currentDirection is RIGHT, and setDirection(DOWN) is called with DOWN being a WALL cell
- **THEN** nextDirection becomes DOWN

#### Scenario: Queues next direction from dead-end

- **WHEN** player is at grid position (5, 5) with exactly 1 valid passage (the cell behind), currentDirection is DOWN (blocked), and setDirection(RIGHT) is called
- **THEN** nextDirection becomes RIGHT

Note: `canMove()` and `isAtIntersection()` are `private` methods. Tests SHALL access them indirectly through `setDirection()` and `update()`, or SHALL use TypeScript bracket access (`player['canMove']`) with `// @ts-expect-error` to verify specific behaviors directly.

### Requirement: setDirection applies direction at intersection

When at an intersection (3 or more valid passages) and the new direction is valid, `setDirection()` SHALL apply it immediately to `currentDirection`.

#### Scenario: Immediate turn at intersection

- **WHEN** player is at an intersection with 3 valid passages (LEFT, DOWN, RIGHT) and setDirection(LEFT) is called with LEFT being valid
- **THEN** currentDirection becomes LEFT immediately

### Requirement: canMove detects wall cells and bounds

`canMove()` SHALL return false when the adjacent cell in the given direction is a WALL cell or out of bounds.

#### Scenario: Wall blocks movement

- **WHEN** canMove(RIGHT) is called and the cell to the right is WALL
- **THEN** it returns false

#### Scenario: Passage allows movement

- **WHEN** canMove(RIGHT) is called and the cell to the right is PASSAGE
- **THEN** it returns true

#### Scenario: Out-of-bounds returns false

- **WHEN** canMove(UP) is called at grid position (0, 0)
- **THEN** it returns false

### Requirement: update applies movement deltas and direction queuing

`update()` SHALL move the player by `speed × delta` in `currentDirection`, recalculate grid position, snap to grid on wall collision, and promote `nextDirection` when arriving at an intersection or hitting a blocked direction.

#### Scenario: Normal movement advances position

- **WHEN** player is at pixel position (100, 100) with currentDirection RIGHT, speed 200, and update is called with delta 100
- **THEN** the player's x position increases by 20 pixels

#### Scenario: Wall collision snaps to current cell

- **WHEN** player is at grid position (5, 5) with currentDirection RIGHT, and the cell to the right (6, 5) is WALL
- **THEN** after update, the player's pixel position snaps to the center of cell (5, 5)

#### Scenario: Queued direction promoted at intersection

- **WHEN** player arrives at an intersection (3+ valid passages) with nextDirection set to a valid direction
- **THEN** update promotes nextDirection to currentDirection

#### Scenario: Queued direction promoted on blocked movement

- **WHEN** player reaches a dead-end and currentDirection becomes blocked, with nextDirection set to a valid direction
- **THEN** update promotes nextDirection to currentDirection

### Requirement: respawn resets movement state

`respawn()` SHALL set both `currentDirection` and `nextDirection` to NONE.

#### Scenario: Respawn clears directions

- **WHEN** respawn is called with currentDirection=RIGHT and nextDirection=DOWN
- **THEN** both currentDirection and nextDirection become NONE
