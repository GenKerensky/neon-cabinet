## ADDED Requirements

### Requirement: Maze dimensions are larger across all difficulty levels

The MazeGenerator SHALL use increased base dimensions for all difficulty levels, providing more playable area.

#### Scenario: Difficulty 1 maze dimensions

- **WHEN** a maze is generated at difficulty 1
- **THEN** the grid SHALL be 21 columns wide and 17 rows tall

#### Scenario: Difficulty 2 maze dimensions

- **WHEN** a maze is generated at difficulty 2
- **THEN** the grid SHALL be 23 columns wide and 19 rows tall

#### Scenario: Difficulty 3 maze dimensions

- **WHEN** a maze is generated at difficulty 3
- **THEN** the grid SHALL be 25 columns wide and 21 rows tall

#### Scenario: Difficulty 4 maze dimensions

- **WHEN** a maze is generated at difficulty 4
- **THEN** the grid SHALL be 27 columns wide and 23 rows tall

#### Scenario: Difficulty 5 maze dimensions

- **WHEN** a maze is generated at difficulty 5
- **THEN** the grid SHALL be 29 columns wide and 25 rows tall

#### Scenario: Dimension scaling formula

- **WHEN** a maze is generated at any difficulty level D (1-5)
- **THEN** the width SHALL be `21 + (D - 1) * 2` and the height SHALL be `17 + (D - 1) * 2`
