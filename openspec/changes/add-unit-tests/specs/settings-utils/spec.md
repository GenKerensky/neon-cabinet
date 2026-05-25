## ADDED Requirements

### Requirement: getVectorMode returns default COLOR when unset

The `getVectorMode` function SHALL return `VectorMode.COLOR` when the registry key `vectorMode` is not set.

#### Scenario: Default when key missing

- **WHEN** `getVectorMode` is called with a scene that has no `vectorMode` in its registry
- **THEN** it SHALL return `VectorMode.COLOR`

### Requirement: setVectorMode and getVectorMode round-trip

The `setVectorMode` function SHALL store the mode in the registry such that a subsequent `getVectorMode` call returns the same value.

#### Scenario: Set and get round-trip

- **WHEN** `setVectorMode(scene, VectorMode.MONOCHROME)` is called, then `getVectorMode(scene)` is called
- **THEN** it SHALL return `VectorMode.MONOCHROME`

### Requirement: isColorMode returns correct boolean

The `isColorMode` function SHALL return true when vector mode is COLOR, false otherwise.

#### Scenario: isColorMode true for COLOR

- **WHEN** vector mode is `VectorMode.COLOR`
- **THEN** `isColorMode(scene)` SHALL return true

#### Scenario: isColorMode false for MONOCHROME

- **WHEN** vector mode is `VectorMode.MONOCHROME`
- **THEN** `isColorMode(scene)` SHALL return false

### Requirement: getFontFamily returns default "Orbitron" when unset

The `getFontFamily` function SHALL return `"Orbitron"` when the registry key `fontFamily` is not set.

#### Scenario: Default font when key missing

- **WHEN** `getFontFamily` is called with a scene that has no `fontFamily` in its registry
- **THEN** it SHALL return `"Orbitron"`

#### Scenario: Returns set font value

- **WHEN** the registry has `fontFamily` set to `"Arial"` and `getFontFamily` is called
- **THEN** it SHALL return `"Arial"`
