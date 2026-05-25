## ADDED Requirements

### Requirement: Maze generation produces perfect maze

The system SHALL generate a perfect maze (no loops, all cells reachable) using the recursive backtracker algorithm given a grid width, grid height, and difficulty level.

#### Scenario: Valid maze generation

- **WHEN** MazeGenerator.create() is called with width=15, height=13, difficulty=1
- **THEN** a grid is returned where every cell is reachable from every other cell and no loops exist

### Requirement: Maze difficulty scales maze dimensions

The system SHALL scale maze dimensions based on difficulty level according to the formula: width = baseWidth + (difficulty - 1) _ 2, height = baseHeight + (difficulty - 1) _ 2, where baseWidth=15 and baseHeight=13.

#### Scenario: Difficulty 1 produces base maze

- **WHEN** MazeGenerator is configured with difficulty=1
- **THEN** maze dimensions are 15x13 cells

#### Scenario: Difficulty 3 produces larger maze

- **WHEN** MazeGenerator is configured with difficulty=3
- **THEN** maze dimensions are 19x17 cells

### Requirement: Maze grid uses wall and passage cell types

The system SHALL represent the maze as a 2D array where each cell is either WALL or PASSAGE.

#### Scenario: Wall cells surround maze boundary

- **WHEN** maze is generated
- **THEN** all cells on the outermost row and column are WALL

### Requirement: Maze includes central spawn area

The system SHALL reserve a central region of the maze as an open area for enemy spawn (ghost pen).

#### Scenario: Central area is open

- **WHEN** maze is generated
- **THEN** a 3x3 region near the center contains PASSAGE cells
