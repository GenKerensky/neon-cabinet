## ADDED Requirements

### Requirement: Pellet pickup produces sparkle particles

The Collectible class SHALL spawn a small particle burst when a regular pellet is consumed.

#### Scenario: Regular pellet sparkle

- **WHEN** the player consumes a regular pellet collectible
- **THEN** 3-5 tiny yellow particles SHALL burst outward from the pellet's position and fade out over ~300ms

### Requirement: Power pellet pickup produces a larger burst

The Collectible class SHALL spawn a more dramatic particle effect when a power pellet is consumed.

#### Scenario: Power pellet burst

- **WHEN** the player consumes a power pellet collectible
- **THEN** 10-15 white and blue particles SHALL burst outward from the power pellet's position and fade out over ~500ms

### Requirement: Floating score text appears on ghost eaten

The Game scene SHALL create floating text showing the score earned when a ghost is eaten while frightened.

#### Scenario: Score popup on ghost eat

- **WHEN** a frightened ghost is eaten by the player
- **THEN** a text object showing the earned score SHALL appear at the ghost's position, float upward, and fade out over ~800ms

#### Scenario: Score popup styling

- **WHEN** a score popup appears
- **THEN** it SHALL be white text with a slight scale-up tween at the start

### Requirement: Bonus item pickup has a distinct effect

The Collectible class SHALL spawn a unique particle effect when a bonus item is consumed.

#### Scenario: Bonus item sparkle

- **WHEN** the player consumes a bonus item
- **THEN** a small burst of red and green particles SHALL spawn at the item's position
