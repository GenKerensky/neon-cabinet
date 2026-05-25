## ADDED Requirements

### Requirement: Pathfinder finds path in open corridor

The Pathfinder SHALL find a valid path between two points in a corridor with no obstacles.

#### Scenario: Straight horizontal corridor

- **WHEN** `findPath` is called from (1, 1) to (5, 1) in a 7x3 grid where row 1 is all passages
- **THEN** it SHALL return an array of coordinates from (1, 1) to (5, 1)

### Requirement: Pathfinder routes around walls

The Pathfinder SHALL find a path that navigates around wall obstacles.

#### Scenario: Path goes around a wall block

- **WHEN** `findPath` is called from (1, 1) to (5, 1) with a wall at (3, 1)
- **THEN** the returned path SHALL route around the wall (through row 0 or row 2)

### Requirement: Pathfinder returns null for unreachable targets

The Pathfinder SHALL return null when no path exists between start and target.

#### Scenario: Target is wall-surrounded

- **WHEN** `findPath` is called and the target is completely surrounded by walls
- **THEN** it SHALL return null

### Requirement: Pathfinder respects iteration limits

The Pathfinder SHALL return null when the iteration limit is exceeded before finding a path.

#### Scenario: Exceeds max iterations

- **WHEN** `findPath` is called with `maxIterations: 10` on a grid requiring more than 10 steps
- **THEN** it SHALL return null

### Requirement: Pathfinder returns single-node path for same start/end

The Pathfinder SHALL return a path containing just the start node when start equals end.

#### Scenario: Start equals end

- **WHEN** `findPath` is called with start and end at the same coordinates
- **THEN** it SHALL return an array containing only that coordinate

### Requirement: Pathfinder supports custom heuristics

The Pathfinder SHALL accept a custom heuristic function.

#### Scenario: Custom heuristic is used

- **WHEN** `findPath` is called with a custom heuristic that always returns 0
- **THEN** the search SHALL complete (BFS behavior), returning a valid path if one exists

### Requirement: Pathfinder provides static maxDistance heuristic

The static `maxDistance` method SHALL return the negative Manhattan distance between two points.

#### Scenario: maxDistance returns negative Manhattan distance

- **WHEN** `Pathfinder.maxDistance(1, 1, 4, 5)` is called
- **THEN** it SHALL return -7
