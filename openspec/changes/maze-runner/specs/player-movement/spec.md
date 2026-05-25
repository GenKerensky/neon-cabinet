## ADDED Requirements

### Requirement: Player moves on grid with direction control

The system SHALL move the player character along PASSAGE cells of the maze grid using arrow key input. Movement is continuous in the current direction until a wall is encountered.

#### Scenario: Player moves right until wall

- **WHEN** player direction is RIGHT and the next cell is PASSAGE
- **THEN** player moves to the next cell in that direction

#### Scenario: Player stops at wall

- **WHEN** player direction is RIGHT and the next cell is WALL
- **THEN** player stops at the current cell boundary

### Requirement: Player direction changes queue at non-intersection points

The system SHALL queue a direction change request if the player is not at an intersection. The queued direction is applied at the next intersection where all four directions are valid or at least two are valid.

#### Scenario: Direction queued mid-corridor

- **WHEN** player presses UP while moving RIGHT through a corridor (not at intersection)
- **THEN** the UP direction is queued and applied at the next intersection

#### Scenario: Direction applied immediately at intersection

- **WHEN** player presses UP while at an intersection and UP is a valid direction
- **THEN** the player changes to UP direction immediately

### Requirement: Player cannot move into walls

The system SHALL prevent the player from moving into WALL cells.

#### Scenario: Player blocked by wall

- **WHEN** player attempts to move into a WALL cell
- **THEN** the player remains at the current position

### Requirement: Player speed is configurable

The system SHALL allow player movement speed to be set as a parameter, defaulting to a value that allows crossing one grid cell in approximately 0.15 seconds at 60fps.

#### Scenario: Default player speed

- **WHEN** player is created with default settings
- **THEN** player speed is set to traverse one cell in ~0.15 seconds
