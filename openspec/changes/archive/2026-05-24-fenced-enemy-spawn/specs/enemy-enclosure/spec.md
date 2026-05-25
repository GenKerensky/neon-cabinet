## ADDED Requirements

### Requirement: Enemy enclosure exists at maze center

The MazeGenerator SHALL create a 3x2 walled enclosure centered at the maze center after the spawn area is cleared.

#### Scenario: Enclosure interior cells are passages

- **WHEN** a maze is generated at any difficulty level
- **THEN** the 6 cells at (centerX-1, centerY) through (centerX+1, centerY+1) SHALL all be of type PASSAGE

#### Scenario: Top wall of enclosure is built

- **WHEN** a maze is generated
- **THEN** the three cells at row centerY-1, columns centerX-1, centerX, centerX+1 SHALL all be of type WALL

#### Scenario: Left wall of enclosure is built

- **WHEN** a maze is generated
- **THEN** the two cells at column centerX-2, rows centerY and centerY+1 SHALL both be of type WALL

#### Scenario: Right wall of enclosure is built

- **WHEN** a maze is generated
- **THEN** the two cells at column centerX+2, rows centerY and centerY+1 SHALL both be of type WALL

#### Scenario: Bottom walls with gate are built

- **WHEN** a maze is generated
- **THEN** the cells at (centerY+2, centerX-1) and (centerY+2, centerX+1) SHALL be of type WALL, and the cell at (centerY+2, centerX) SHALL be of type PASSAGE (the gate)

### Requirement: Clear passage ring around enclosure

The MazeGenerator SHALL create a 1-cell thick passage ring immediately outside the enclosure walls.

#### Scenario: Passage ring above enclosure

- **WHEN** a maze is generated
- **THEN** the cells at row centerY-2, columns centerX-2 through centerX+2 SHALL all be of type PASSAGE

#### Scenario: Passage ring left of enclosure

- **WHEN** a maze is generated
- **THEN** the cells at column centerX-3, rows centerY-1 through centerY+2 SHALL all be of type PASSAGE

#### Scenario: Passage ring right of enclosure

- **WHEN** a maze is generated
- **THEN** the cells at column centerX+3, rows centerY-1 through centerY+2 SHALL all be of type PASSAGE

#### Scenario: Passage ring below enclosure

- **WHEN** a maze is generated
- **THEN** the cells at row centerY+3, columns centerX-2 through centerX+2 SHALL all be of type PASSAGE

### Requirement: Enemies spawn inside the enclosure

The Game scene SHALL spawn enemies at grid positions inside the 3x2 enclosure interior.

#### Scenario: Chaser spawns at left-top interior

- **WHEN** the Game scene creates the Chaser enemy
- **THEN** its grid position SHALL be (centerX-1, centerY)

#### Scenario: Ambusher spawns at center-top interior

- **WHEN** the Game scene creates the Ambusher enemy
- **THEN** its grid position SHALL be (centerX, centerY)

#### Scenario: Wanderer spawns at right-top interior

- **WHEN** the Game scene creates the Wanderer enemy
- **THEN** its grid position SHALL be (centerX+1, centerY)

#### Scenario: Timid spawns at center-bottom interior

- **WHEN** the Game scene creates the Timid enemy
- **THEN** its grid position SHALL be (centerX, centerY+1)
