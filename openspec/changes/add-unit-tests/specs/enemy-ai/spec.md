## ADDED Requirements

### Requirement: Chaser targets player position in CHASE state

The Chaser AI SHALL target the player's tile-aligned grid position when in CHASE state, return its scatter target in SCATTER state, and return null in FRIGHTENED state.

#### Scenario: CHASE state returns player grid position

- **WHEN** Chaser is in CHASE state and `getTargetPosition(playerX, playerY, playerDir)` is called
- **THEN** it SHALL return an object with `x` and `y` equal to the tile-aligned grid coordinates of the player position

#### Scenario: SCATTER state returns scatter target

- **WHEN** Chaser is in SCATTER state and `getTargetPosition` is called
- **THEN** it SHALL return the scatter target set in the constructor

#### Scenario: FRIGHTENED state returns null

- **WHEN** Chaser is in FRIGHTENED state and `getTargetPosition` is called
- **THEN** it SHALL return null

### Requirement: Ambusher predicts player position ahead

The Ambusher AI SHALL predict the player's position 4 tiles ahead in the direction they are moving, clamped to grid bounds.

#### Scenario: Ambusher predicts ahead in CHASE state

- **WHEN** Ambusher is in CHASE state, player is moving RIGHT, and `getTargetPosition` is called
- **THEN** it SHALL return a position offset 4 tiles to the right of the player's grid position

#### Scenario: Ambusher prediction is clamped to grid bounds

- **WHEN** Ambusher predicts a position that would exceed the grid width or height
- **THEN** the returned position SHALL be clamped to the maximum valid index (gridWidth - 1, gridHeight - 1)

#### Scenario: Ambusher returns scatter target in SCATTER state

- **WHEN** Ambusher is in SCATTER state
- **THEN** it SHALL return its scatter target

#### Scenario: Ambusher returns null in FRIGHTENED state

- **WHEN** Ambusher is in FRIGHTENED state
- **THEN** it SHALL return null

### Requirement: Timid flees or chases based on distance

The Timid AI SHALL chase the player when within 8 tiles Manhattan distance, and flee to a random nearby passage when farther away.

#### Scenario: Timid chases player within distance threshold

- **WHEN** player is within 8 tiles Manhattan distance of Timid in CHASE state
- **THEN** `getTargetPosition` SHALL return the player's grid position

#### Scenario: Timid flees when player is beyond distance threshold

- **WHEN** player is more than 8 tiles Manhattan distance from Timid in CHASE state
- **THEN** `getTargetPosition` SHALL return a position on a valid passage cell

#### Scenario: Timid returns scatter target in SCATTER state

- **WHEN** Timid is in SCATTER state
- **THEN** it SHALL return its scatter target

#### Scenario: Timid returns null in FRIGHTENED state

- **WHEN** Timid is in FRIGHTENED state
- **THEN** it SHALL return null

### Requirement: Wanderer targets pincer position

The Wanderer AI SHALL target a position 2x the vector from the Chaser to the player, creating a pincer movement.

#### Scenario: Wanderer computes pincer target in CHASE state

- **WHEN** Wanderer is in CHASE state with chaser at grid (1, 1) and player at grid (3, 1)
- **THEN** `getTargetPosition` SHALL return a position that is 2 tiles beyond the player in the direction away from the chaser (5, 1)

#### Scenario: Wanderer pincer target is clamped to grid bounds

- **WHEN** the computed pincer target exceeds grid dimensions
- **THEN** the returned position SHALL be clamped to valid grid bounds

#### Scenario: Wanderer returns scatter target in SCATTER state

- **WHEN** Wanderer is in SCATTER state
- **THEN** it SHALL return its scatter target

#### Scenario: Wanderer returns null in FRIGHTENED state

- **WHEN** Wanderer is in FRIGHTENED state
- **THEN** it SHALL return null

#### Scenario: Wanderer stores chaser position via setter

- **WHEN** `setChaserPosition(chaserX, chaserY)` is called
- **THEN** subsequent `getTargetPosition` calls SHALL use the stored chaser position for pincer calculation
