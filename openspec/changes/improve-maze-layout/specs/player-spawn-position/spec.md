## ADDED Requirements

### Requirement: Player spawns at bottom-center of maze

The Game scene SHALL spawn the player near the bottom edge of the maze, centered horizontally, at a safe distance from the enemy enclosure.

#### Scenario: Player spawn row is near bottom

- **WHEN** the Game scene creates the player
- **THEN** the player's grid Y position SHALL be `gridHeight - 3`

#### Scenario: Player spawn column is centered

- **WHEN** the Game scene creates the player
- **THEN** the player's grid X position SHALL be `Math.floor(gridWidth / 2)`

#### Scenario: Player is far from enemy enclosure

- **WHEN** the player spawns and the enemy enclosure is at the maze center
- **THEN** the vertical distance between player and enclosure gate SHALL be at least `Math.floor(gridHeight / 2) - 2` cells

#### Scenario: Enemies have gate delay before exiting

- **WHEN** the game starts
- **THEN** enemies inside the enclosure SHALL NOT be able to pass through the gate for the first 2000ms

#### Scenario: Gate opens after delay

- **WHEN** 2000ms have elapsed since game start
- **THEN** enemies inside the enclosure SHALL be able to pass through the gate normally
