## ADDED Requirements

### Requirement: A\* pathfinding finds shortest path on grid

The system SHALL compute the shortest path between two grid coordinates using the A\* algorithm with Manhattan distance heuristic.

#### Scenario: Path between adjacent cells

- **WHEN** pathfinder.findPath() is called with start={x:0, y:0} and end={x:2, y:0} on a clear grid
- **THEN** the returned path contains the sequence of cells from start to end with minimum length

#### Scenario: No path when blocked

- **WHEN** pathfinder.findPath() is called with start and end separated by impassable walls
- **THEN** null is returned

### Requirement: Pathfinding respects wall collisions

The system SHALL only consider PASSAGE cells as traversable; WALL cells are never included in computed paths.

#### Scenario: Path avoids walls

- **WHEN** pathfinder.findPath() is called on a maze grid with walls between start and end
- **THEN** the returned path contains only PASSAGE cells

### Requirement: Pathfinding supports custom heuristics

The system SHALL allow passing a custom heuristic function to support different enemy behavior strategies.

#### Scenario: Manhattan heuristic for chaser

- **WHEN** pathfinder.findPath() is called with heuristic=manhattanDistance targeting player position
- **THEN** the path minimizes distance to the player

#### Scenario: Reverse heuristic for timid enemy

- **WHEN** pathfinder.findPath() is called with heuristic=maxDistance targeting away from player position
- **THEN** the path maximizes distance from the player
