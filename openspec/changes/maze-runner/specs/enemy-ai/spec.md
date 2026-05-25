## ADDED Requirements

### Requirement: Enemy state machine transitions between states

The system SHALL manage each enemy through four states: SCATTER, CHASE, FRIGHTENED, and DEAD. Transitions occur based on timed intervals and power pellet events.

#### Scenario: SCATTER to CHASE transition

- **WHEN** an enemy is in SCATTER state and the chase timer expires
- **THEN** the enemy transitions to CHASE state

#### Scenario: CHASE to FRIGHTENED transition

- **WHEN** an enemy is in CHASE state and the player eats a power pellet
- **THEN** the enemy transitions to FRIGHTENED state

#### Scenario: FRIGHTENED to CHASE transition

- **WHEN** an enemy is in FRIGHTENED state and the frightened timer expires
- **THEN** the enemy transitions to CHASE state

#### Scenario: Enemy becomes DEAD when eaten

- **WHEN** the player collides with an enemy in FRIGHTENED state
- **THEN** the enemy transitions to DEAD state

#### Scenario: DEAD enemy returns to CHASE

- **WHEN** an enemy is in DEAD state and the respawn timer expires
- **THEN** the enemy returns to the maze and enters CHASE state

### Requirement: Chaser enemy targets player directly

The system SHALL make the Chaser enemy (Red) use the player's current grid position as its A\* pathfinding target.

#### Scenario: Chaser follows player

- **WHEN** Chaser is in CHASE state
- **THEN** Chaser's pathfinding target is set to the player's current position

### Requirement: Ambusher enemy predicts player direction

The system SHALL make the Ambusher enemy (Pink) target a position ahead of the player based on the player's current movement direction.

#### Scenario: Ambusher targets ahead of player

- **WHEN** Ambusher is in CHASE state and player is moving RIGHT
- **THEN** Ambusher's pathfinding target is set to a position 4 cells ahead of the player in the RIGHT direction

### Requirement: Wanderer enemy uses combined target

The system SHALL make the Wanderer enemy (Cyan) target a position based on the Chaser's position and the player's position.

#### Scenario: Wanderer targets combined position

- **WHEN** Wanderer is in CHASE state
- **THEN** Wanderer's pathfinding target is calculated as player position + 2 \* (player position - Chaser position)

### Requirement: Timid enemy has random target

The system SHALL make the Timid enemy (Orange) move toward a fixed corner in SCATTER state and move randomly when far from the player in CHASE state.

#### Scenario: Timid moves to corner in scatter

- **WHEN** Timid is in SCATTER state
- **THEN** Timid's pathfinding target is a fixed corner of the maze

#### Scenario: Timid moves randomly when distant

- **WHEN** Timid is in CHASE state and distance to player exceeds 8 cells
- **THEN** Timid selects a random valid direction at each intersection

### Requirement: FRIGHTENED enemies move slowly and can be eaten

The system SHALL reduce FRIGHTENED enemy speed by half and allow the player to collect them for bonus points.

#### Scenario: FRIGHTENED enemy moves slower

- **WHEN** an enemy enters FRIGHTENED state
- **THEN** the enemy's movement speed is reduced to 50% of normal

#### Scenario: Player eats FRIGHTENED enemy

- **WHEN** player collides with a FRIGHTENED enemy
- **THEN** the enemy enters DEAD state and the player receives points
