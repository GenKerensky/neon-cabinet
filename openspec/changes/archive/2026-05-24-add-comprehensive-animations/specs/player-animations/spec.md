## ADDED Requirements

### Requirement: Player chomp animation exists for all four directions

The texture generation system SHALL create multi-frame chomp animations for the player character in all four cardinal directions.

#### Scenario: Right-facing chomp animation

- **WHEN** the player texture generator runs at boot time
- **THEN** it SHALL create a 3-frame animation sequence showing the player's mouth opening and closing while facing right

#### Scenario: Left-facing chomp animation

- **WHEN** the player texture generator runs at boot time
- **THEN** it SHALL create a 3-frame animation sequence showing the player's mouth opening and closing while facing left

#### Scenario: Up-facing chomp animation

- **WHEN** the player texture generator runs at boot time
- **THEN** it SHALL create a 3-frame animation sequence showing the player's mouth opening and closing while facing up

#### Scenario: Down-facing chomp animation

- **WHEN** the player texture generator runs at boot time
- **THEN** it SHALL create a 3-frame animation sequence showing the player's mouth opening and closing while facing down

### Requirement: Player animation plays while moving

The Player class SHALL automatically play the directional chomp animation matching the current movement direction.

#### Scenario: Moving right plays right chomp

- **WHEN** the player is moving to the right
- **THEN** the right-facing chomp animation SHALL be playing

#### Scenario: Changing direction switches animation

- **WHEN** the player changes direction from right to up
- **THEN** the up-facing chomp animation SHALL begin playing

#### Scenario: Stopping movement shows idle frame

- **WHEN** the player stops moving
- **THEN** the animation SHALL pause on the full-circle (mouth closed) frame

### Requirement: Player death animation exists

The texture generation system SHALL create a one-shot death collapse animation matching the original Pac-Man style, followed by a particle explosion.

#### Scenario: Death animation frames are generated

- **WHEN** the player texture generator runs at boot time
- **THEN** it SHALL create a ~12-frame animation showing the character collapsing from a full circle inward to a thin line, then disappearing

#### Scenario: Death animation triggers on collision

- **WHEN** the player collides with an enemy
- **THEN** the death collapse animation SHALL play once

#### Scenario: Explosion follows death animation

- **WHEN** the death collapse animation completes
- **THEN** a radial particle burst of yellow and orange particles SHALL spawn at the player's position

### Requirement: Player death blocks input

The Player class SHALL ignore all movement input while the death animation is playing.

#### Scenario: Input ignored during death

- **WHEN** the player is in the death animation state
- **THEN** keyboard input SHALL NOT change the player's direction
