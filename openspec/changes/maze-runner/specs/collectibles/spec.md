## ADDED Requirements

### Requirement: Dots spawn on all passage cells

The system SHALL place a dot on every PASSAGE cell in the maze, except for the central spawn area and designated power pellet positions.

#### Scenario: Dots fill maze passages

- **WHEN** collectibles are initialized on a generated maze
- **THEN** every PASSAGE cell outside the spawn area and power pellet positions contains a dot

### Requirement: Power pellets spawn at corner positions

The system SHALL place power pellets at four fixed positions near the corners of the maze.

#### Scenario: Four power pellets placed

- **WHEN** collectibles are initialized
- **THEN** exactly four power pellets exist at positions near each corner of the maze

### Requirement: Dot collection awards points

The system SHALL award 10 points when the player collects a dot.

#### Scenario: Player collects dot

- **WHEN** player overlaps with a dot
- **THEN** the dot is removed and the player's score increases by 10

### Requirement: Power pellet collection triggers frightened mode

The system SHALL trigger FRIGHTENED state for all living enemies when the player collects a power pellet.

#### Scenario: Player eats power pellet

- **WHEN** player overlaps with a power pellet
- **THEN** the power pellet is removed, score increases by 50, and all living enemies enter FRIGHTENED state

### Requirement: Bonus items spawn periodically

The system SHALL spawn a bonus item (fruit) in the center of the maze between levels 2 and 7, remaining collectible for a limited duration.

#### Scenario: Fruit appears between levels

- **WHEN** the game is on level 3
- **THEN** a bonus item spawns in the center of the maze after half the dots are collected

#### Scenario: Fruit disappears on timeout

- **WHEN** a bonus item has been on screen for 10 seconds
- **THEN** the bonus item is removed and no points are awarded

### Requirement: Consecutive enemy eats increase bonus

The system SHALL double the points for each consecutive enemy eaten while in FRIGHTENED mode, starting at 200 points.

#### Scenario: First enemy eaten

- **WHEN** player eats the first FRIGHTENED enemy in a sequence
- **THEN** the player receives 200 points

#### Scenario: Second enemy eaten doubles points

- **WHEN** player eats the second FRIGHTENED enemy consecutively
- **THEN** the player receives 400 points

#### Scenario: Fourth enemy eaten awards 1600

- **WHEN** player eats the fourth FRIGHTENED enemy consecutively
- **THEN** the player receives 1600 points
