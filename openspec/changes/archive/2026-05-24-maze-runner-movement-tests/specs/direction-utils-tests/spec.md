## ADDED Requirements

### Requirement: directionToDx returns correct x-delta for each direction

The system SHALL return the correct x-axis delta for each Direction value: LEFT → -1, RIGHT → 1, UP/DOWN/NONE → 0.

#### Scenario: LEFT returns -1

- **WHEN** directionToDx is called with Direction.LEFT
- **THEN** it returns -1

#### Scenario: RIGHT returns 1

- **WHEN** directionToDx is called with Direction.RIGHT
- **THEN** it returns 1

#### Scenario: UP returns 0

- **WHEN** directionToDx is called with Direction.UP
- **THEN** it returns 0

#### Scenario: NONE returns 0

- **WHEN** directionToDx is called with Direction.NONE
- **THEN** it returns 0

### Requirement: directionToDy returns correct y-delta for each direction

The system SHALL return the correct y-axis delta for each Direction value: UP → -1, DOWN → 1, LEFT/RIGHT/NONE → 0.

#### Scenario: UP returns -1

- **WHEN** directionToDy is called with Direction.UP
- **THEN** it returns -1

#### Scenario: DOWN returns 1

- **WHEN** directionToDy is called with Direction.DOWN
- **THEN** it returns 1

#### Scenario: LEFT returns 0

- **WHEN** directionToDy is called with Direction.LEFT
- **THEN** it returns 0

#### Scenario: RIGHT returns 0

- **WHEN** directionToDy is called with Direction.RIGHT
- **THEN** it returns 0

#### Scenario: NONE returns 0

- **WHEN** directionToDy is called with Direction.NONE
- **THEN** it returns 0

### Requirement: oppositeDirection returns the reverse direction

The system SHALL return the opposite direction for each cardinal direction: UP↔DOWN, LEFT↔RIGHT, NONE→NONE.

#### Scenario: UP opposite is DOWN

- **WHEN** oppositeDirection is called with Direction.UP
- **THEN** it returns Direction.DOWN

#### Scenario: LEFT opposite is RIGHT

- **WHEN** oppositeDirection is called with Direction.LEFT
- **THEN** it returns Direction.RIGHT

#### Scenario: NONE opposite is NONE

- **WHEN** oppositeDirection is called with Direction.NONE
- **THEN** it returns Direction.NONE

#### Scenario: DOWN opposite is UP

- **WHEN** oppositeDirection is called with Direction.DOWN
- **THEN** it returns Direction.UP

#### Scenario: RIGHT opposite is LEFT

- **WHEN** oppositeDirection is called with Direction.RIGHT
- **THEN** it returns Direction.LEFT

### Requirement: getValidDirections filters adjacent cells

The system SHALL return only Direction values whose adjacent cell is a PASSAGE cell and within grid bounds.

#### Scenario: All four adjacent cells are passages

- **WHEN** getValidDirections is called with a grid where all four adjacent cells are PASSAGE
- **THEN** it returns [UP, DOWN, LEFT, RIGHT]

#### Scenario: Some adjacent cells are walls

- **WHEN** getValidDirections is called with a grid where UP and LEFT cells are WALL
- **THEN** it returns [DOWN, RIGHT]

#### Scenario: Out-of-bounds cells excluded

- **WHEN** getValidDirections is called at grid position (0, 0) (top-left)
- **THEN** UP and LEFT are not included (out of bounds)
