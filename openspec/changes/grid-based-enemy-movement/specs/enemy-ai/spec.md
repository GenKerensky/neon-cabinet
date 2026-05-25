## REMOVED Requirements

### Requirement: A\* pathfinding for enemy targets

**Reason**: Enemy movement no longer uses A\* pathfinding. Direction is chosen greedily at each cell center using Manhattan distance to the target tile.
**Migration**: See `specs/enemy-movement/spec.md` for the replacement movement system.

## MODIFIED Requirements

### Requirement: Enemy state machine with SCATTER and CHASE modes

The system SHALL define SCATTER-state target tiles for each enemy type that serve as the enemy's target during SCATTER mode. SCATTER targets are fixed maze corners that allow enemies to disperse after a chase phase.

#### Scenario: Chaser SCATTER target

- **WHEN** Chaser is in SCATTER state
- **THEN** Chaser's target tile is the top-right corner of the maze (W-1, 0)
- **AND** if (W-1, 0) is a WALL cell, the nearest valid PASSAGE cell is used (via BFS)

#### Scenario: Ambusher SCATTER target

- **WHEN** Ambusher is in SCATTER state
- **THEN** Ambusher's target tile is the top-left corner of the maze (0, 0)

#### Scenario: Wanderer SCATTER target

- **WHEN** Wanderer is in SCATTER state
- **THEN** Wanderer's target tile is the bottom-right corner of the maze (W-1, H-1)

#### Scenario: Timid SCATTER target

- **WHEN** Timid is in SCATTER state
- **THEN** Timid's target tile is the bottom-left corner of the maze (0, H-1)

### Requirement: Chaser enemy targets player directly

The system SHALL make the Chaser enemy (Red) use the player's current grid position as its target tile for direction selection.

#### Scenario: Chaser follows player

- **WHEN** Chaser is in CHASE state
- **THEN** Chaser's target tile is set to the player's current grid position

### Requirement: Ambusher enemy predicts player direction

The system SHALL make the Ambusher enemy (Pink) target a position ahead of the player based on the player's current movement direction.

#### Scenario: Ambusher targets ahead of player

- **WHEN** Ambusher is in CHASE state and player is moving RIGHT
- **THEN** Ambusher's target tile is set to a position 4 cells ahead of the player in the RIGHT direction
- **AND** if the resulting target is outside the maze bounds, it is clamped to the nearest in-bounds cell

### Requirement: Wanderer enemy uses combined target

The system SHALL make the Wanderer enemy (Cyan) target a position based on the Chaser's position and the player's position.

#### Scenario: Wanderer targets combined position

- **WHEN** Wanderer is in CHASE state
- **THEN** Wanderer's target tile is calculated as player position + 2 × (player position − Chaser position)
- **AND** if the resulting target is outside the maze bounds, it is clamped to the nearest in-bounds cell

### Requirement: Timid enemy has conditional target

The system SHALL make the Timid enemy (Orange) target the player's position when close and move toward a random adjacent passage cell when far.

#### Scenario: Timid targets player when close

- **WHEN** Timid is in CHASE state and distance to player ≤ 8 cells
- **THEN** Timid's target tile is the player's current grid position

#### Scenario: Timid picks random nearby target when far

- **WHEN** Timid is in CHASE state and distance to player exceeds 8 cells
- **THEN** Timid picks a random passage cell adjacent to its current position as its target tile
- **AND** "adjacent" refers to a cell sharing an edge with the Timid enemy's current grid position

### Requirement: FRIGHTENED enemies move slowly and can be eaten

The system SHALL allow the player to collect FRIGHTENED enemies for bonus points by colliding with them.

#### Scenario: Player eats FRIGHTENED enemy

- **WHEN** player collides with a FRIGHTENED enemy
- **THEN** the enemy enters DEAD state and the player receives points

#### Scenario: Power pellet triggers FRIGHTENED

- **WHEN** the player collects a power pellet
- **THEN** all enemies in SCATTER or CHASE state enter FRIGHTENED state
- **AND** enemies already in DEAD state remain in DEAD state

### Requirement: DEAD enemy respawns at maze center

The system SHALL make DEAD enemies respawn at the maze center cell, then transition to CHASE state.

#### Scenario: DEAD enemy reaches center

- **WHEN** a DEAD enemy reaches the maze center cell
- **THEN** the enemy exits DEAD state
- **AND** the enemy enters CHASE state (or SCATTER if the global mode timer says so)

## ADDED Requirements

### Requirement: Enemy state machine managed by Game scene

The system SHALL manage the SCATTER/CHASE mode timer in the Game scene, switching all enemies simultaneously between SCATTER and CHASE states at timed intervals.

#### Scenario: SCATTER to CHASE transition

- **WHEN** the SCATTER timer (7 seconds) expires
- **THEN** all enemies transition to CHASE state

#### Scenario: CHASE to SCATTER transition

- **WHEN** the CHASE timer (20 seconds) expires
- **THEN** all enemies transition to SCATTER state

#### Scenario: FRIGHTENED state overrides SCATTER/CHASE timer

- **WHEN** an enemy is in FRIGHTENED state
- **THEN** the SCATTER/CHASE timer continues running and applies when FRIGHTENED expires
- **AND** when FRIGHTENED expires, the enemy enters whichever state the global timer currently indicates

### Requirement: Wanderer receives Chaser position

The system SHALL update Wanderer's internal Chaser position reference each frame so it can calculate its combined target tile.

#### Scenario: Wanderer target uses Chaser position

- **WHEN** Game scene calls Wanderer.setChaserPosition(chaserGridX, chaserGridY) each frame
- **THEN** Wanderer uses that position to compute its target tile in CHASE state

#### Scenario: Wanderer default chaser position

- **WHEN** setChaserPosition has never been called
- **THEN** Wanderer uses its own spawn position as the default Chaser position
- **AND** this prevents wildly incorrect targets before the first call
