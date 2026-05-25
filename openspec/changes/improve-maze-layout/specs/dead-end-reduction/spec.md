## ADDED Requirements

### Requirement: Dead ends are reduced after maze generation

The MazeGenerator SHALL apply a post-processing step after DFS maze generation that identifies dead-end cells and removes select walls to create alternative paths (loops), reducing the total number of dead ends.

#### Scenario: Dead-end cells are identified

- **WHEN** the dead-end reduction phase runs
- **THEN** all passage cells with exactly one adjacent passage neighbor SHALL be identified as dead ends

#### Scenario: Walls are removed to create loops

- **WHEN** a dead-end cell is found and an adjacent wall cell has a passage on its opposite side
- **THEN** that wall SHALL be removed with 60% probability, creating a loop

#### Scenario: Minimum distance for loop creation

- **WHEN** considering wall removal for loop creation
- **THEN** the wall SHALL only be removed if the connected passage is at least 3 cells away from the dead end

#### Scenario: Maze remains fully connected

- **WHEN** dead-end reduction completes
- **THEN** all passage cells SHALL still be reachable from any other passage cell via BFS

#### Scenario: Not all dead ends are removed

- **WHEN** dead-end reduction completes on a difficulty 1 maze
- **THEN** at least 20% of the original dead ends SHALL remain (some tactical dead ends preserved)

#### Scenario: Border walls are never removed

- **WHEN** dead-end reduction considers wall removal
- **THEN** walls on the outer border of the maze (row 0, row height-1, column 0, column width-1) SHALL never be removed
