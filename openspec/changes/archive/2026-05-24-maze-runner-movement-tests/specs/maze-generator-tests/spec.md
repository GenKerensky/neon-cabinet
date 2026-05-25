## ADDED Requirements

### Requirement: MazeGenerator creates grid with correct dimensions

The system SHALL create a grid whose width and height match the dimensions derived from difficulty level.

#### Scenario: Difficulty 1 grid dimensions

- **WHEN** MazeGenerator is constructed with difficulty 1
- **THEN** create() returns a grid of width 15 and height 13

#### Scenario: Difficulty 2 grid dimensions

- **WHEN** MazeGenerator is constructed with difficulty 2
- **THEN** create() returns a grid of width 17 and height 15

#### Scenario: Difficulty 3 grid dimensions

- **WHEN** MazeGenerator is constructed with difficulty 3
- **THEN** create() returns a grid of width 19 and height 17

#### Scenario: Difficulty 4 grid dimensions

- **WHEN** MazeGenerator is constructed with difficulty 4
- **THEN** create() returns a grid of width 21 and height 19

#### Scenario: Difficulty 5 grid dimensions

- **WHEN** MazeGenerator is constructed with difficulty 5
- **THEN** create() returns a grid of width 23 and height 21

### Requirement: Border cells are always walls

The system SHALL ensure all cells on the outermost row or column of the grid have type WALL.

#### Scenario: Top row is all walls

- **WHEN** the maze is generated
- **THEN** every cell at y=0 has type WALL

#### Scenario: Bottom row is all walls

- **WHEN** the maze is generated
- **THEN** every cell at y=height-1 has type WALL

#### Scenario: Left column is all walls

- **WHEN** the maze is generated
- **THEN** every cell at x=0 has type WALL

#### Scenario: Right column is all walls

- **WHEN** the maze is generated
- **THEN** every cell at x=width-1 has type WALL

### Requirement: Maze contains both wall and passage cells

The system SHALL generate a maze where the interior (non-border) contains at least one WALL and at least one PASSAGE cell.

#### Scenario: Interior has mixed cell types

- **WHEN** the maze is generated
- **THEN** the interior grid has both CellType.WALL and CellType.PASSAGE cells

### Requirement: Spawn area at center is all passage

The system SHALL create a 3×3 spawn area centered on the maze that is entirely PASSAGE cells.

#### Scenario: Center spawn area is all passages

- **WHEN** the maze is generated
- **THEN** the 3×3 block centered on (⌊W/2⌋, ⌊H/2⌋) has all cells of type PASSAGE

### Requirement: Maze is connected

The system SHALL generate a maze where every PASSAGE cell is reachable from every other PASSAGE cell (single connected component).

#### Scenario: All passages reachable from each other

- **WHEN** the maze is generated
- **THEN** starting a BFS from any PASSAGE cell visits all PASSAGE cells in the grid
