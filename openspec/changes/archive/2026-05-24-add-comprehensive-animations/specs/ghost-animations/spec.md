## ADDED Requirements

### Requirement: Ghost directional movement animation exists

The texture generation system SHALL create multi-frame directional movement animations for each ghost, showing animated wavy feet.

#### Scenario: Ghost right-facing movement animation

- **WHEN** the ghost texture generator runs at boot time
- **THEN** it SHALL create a 2-frame animation sequence per ghost color showing the ghost body with feet in alternating wave positions while facing right

#### Scenario: All four directions covered

- **WHEN** the ghost texture generator runs at boot time
- **THEN** it SHALL create movement animations for up, down, left, and right directions

#### Scenario: Animation plays while ghost moves

- **WHEN** a ghost is moving in any direction
- **THEN** the corresponding directional movement animation SHALL be playing

### Requirement: Ghost vulnerability state is visually distinct

The texture generation system SHALL create a vulnerability state texture for ghosts (blue body with white eyes), and the Enemy class SHALL apply a flashing tint effect during the frightened state.

#### Scenario: Vulnerability texture is generated

- **WHEN** the ghost texture generator runs at boot time
- **THEN** it SHALL create a blue ghost body texture with white eyes

#### Scenario: Vulnerability tint applied on state change

- **WHEN** a ghost enters the FRIGHTENED state
- **THEN** the ghost SHALL display the blue vulnerability texture with a white/blue flashing tint

#### Scenario: Flash speed accelerates as timer expires

- **WHEN** the frightened timer drops below 3000ms
- **THEN** the flash tween duration SHALL halve (from ~500ms to ~200ms), making the flash visibly faster

### Requirement: Ghost dead state shows only eyes

The texture generation system SHALL create directional eye-only textures for ghosts, and the Enemy class SHALL switch to them when in the DEAD state.

#### Scenario: Eye textures generated for all directions

- **WHEN** the ghost texture generator runs at boot time
- **THEN** it SHALL create 4 directional eye-only textures (no body, just white ovals with pupils)

#### Scenario: Dead state shows eyes

- **WHEN** a ghost enters the DEAD state
- **THEN** the ghost body SHALL disappear and only the directional eyes SHALL be visible

#### Scenario: Eyes follow movement direction

- **WHEN** a dead ghost is moving
- **THEN** the eye texture SHALL match the movement direction

### Requirement: Ghost returns to normal after vulnerability expires

The Enemy class SHALL revert to the normal directional movement animation when the frightened timer reaches zero.

#### Scenario: Timer expiry restores normal appearance

- **WHEN** the frightened timer reaches zero
- **THEN** the ghost SHALL stop the vulnerability flash and resume the normal directional movement animation
