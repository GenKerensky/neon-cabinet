## ADDED Requirements

### Requirement: Level completes when all dots are collected

The system SHALL advance to the next level when the player collects all dots and power pellets on the current maze.

#### Scenario: Level advances on completion

- **WHEN** the last dot is collected
- **THEN** the game advances to the next level with a new maze

### Requirement: Difficulty scales with level progression

The system SHALL increase maze dimensions and enemy speed with each level according to the difficulty formula defined in the maze generation capability.

#### Scenario: Maze grows at level 2

- **WHEN** the game advances to level 2
- **THEN** the maze dimensions increase by 2 cells in each direction compared to level 1

#### Scenario: Enemy speed increases with level

- **WHEN** the game advances to a higher level
- **THEN** enemy movement speed increases proportionally

### Requirement: Player loses life on enemy collision

The system SHALL reduce the player's life count by one when the player collides with an enemy that is not in FRIGHTENED state.

#### Scenario: Player loses life

- **WHEN** player collides with an enemy in CHASE or SCATTER state
- **THEN** the player loses one life and respawns at the start position

### Requirement: Player starts with three lives

The system SHALL give the player three lives at the start of the game.

#### Scenario: Player has three lives

- **WHEN** the Game scene initializes
- **THEN** the player's life count is 3

### Requirement: Game over triggers when lives reach zero

The system SHALL end the game and transition to the GameOver scene when the player's life count reaches zero.

#### Scenario: Game ends at zero lives

- **WHEN** the player's last life is lost
- **THEN** the GameOver scene becomes active
