## ADDED Requirements

### Requirement: Screen flash on power pellet consumption

The Game scene SHALL apply a brief full-screen flash effect when the player consumes a power pellet.

#### Scenario: White screen flash

- **WHEN** the player consumes a power pellet
- **THEN** the screen SHALL flash white for ~150ms and then fade back to normal

#### Scenario: Flash does not block gameplay

- **WHEN** the screen flash is active
- **THEN** player and enemy movement SHALL continue uninterrupted

### Requirement: Ghost vulnerability timer is visually communicated

The Enemy class SHALL communicate the remaining frightened time through the vulnerability flash animation.

#### Scenario: Slow flash at start

- **WHEN** the frightened timer is above 3000ms
- **THEN** the vulnerability flash SHALL alternate at ~500ms intervals (slow, steady pulse)

#### Scenario: Fast flash near end

- **WHEN** the frightened timer drops below 3000ms
- **THEN** the vulnerability flash SHALL accelerate to ~200ms intervals (rapid pulse)

#### Scenario: Final warning flash

- **WHEN** the frightened timer drops below 1000ms
- **THEN** the vulnerability flash SHALL accelerate further to ~100ms intervals (urgent rapid pulse)

### Requirement: Ghosts briefly freeze on power pellet activation

The Enemy class SHALL freeze all ghost movement for ~300ms when the power pellet is first consumed, giving the player a moment to react.

#### Scenario: Ghost freeze on activation

- **WHEN** a power pellet is consumed
- **THEN** all enemy movement SHALL pause for 300ms before resuming in the FRIGHTENED state
