## ADDED Requirements

### Requirement: CollectibleManager creates DOTs on all passage cells

The CollectibleManager SHALL create a DOT collectible on every passage cell in the grid when `createAll` is called.

#### Scenario: All passage cells get DOTs

- **WHEN** `createAll` is called on a small grid with 10 passage cells
- **THEN** the returned array SHALL contain 10 Collectible objects, all of type DOT

### Requirement: CollectibleManager creates POWER_PELLET at corners

The CollectibleManager SHALL create POWER_PELLET collectibles at the four passage corner cells instead of DOTs.

#### Scenario: Power pellets replace dots at corners

- **WHEN** `createAll` is called and the four corner positions are passages
- **THEN** the collectibles at those positions SHALL have type POWER_PELLET

### Requirement: CollectibleManager skips spawn area

The CollectibleManager SHALL NOT create collectibles in the 3x3 center spawn area.

#### Scenario: Spawn area has no collectibles

- **WHEN** `createAll` is called
- **THEN** no collectible SHALL be created at the center 3x3 region of the grid

### Requirement: removeCollectible updates counters

The CollectibleManager SHALL destroy a collectible, remove it from the internal array, and increment dotsCollected (except for BONUS_ITEM).

#### Scenario: Removing a DOT increments dotsCollected

- **WHEN** a DOT collectible is passed to `removeCollectible`
- **THEN** `getDotsCollected()` SHALL increase by 1

#### Scenario: Removing a BONUS_ITEM does not increment dotsCollected

- **WHEN** a BONUS_ITEM collectible is passed to `removeCollectible`
- **THEN** `getDotsCollected()` SHALL NOT change

### Requirement: isLevelComplete detects completion

The `isLevelComplete` method SHALL return true when all non-bonus collectibles have been removed.

#### Scenario: Level not complete when dots remain

- **WHEN** some DOT collectibles still exist in the array
- **THEN** `isLevelComplete()` SHALL return false

#### Scenario: Level complete when all dots removed

- **WHEN** all DOT and POWER_PELLET collectibles have been removed
- **THEN** `isLevelComplete()` SHALL return true

### Requirement: shouldSpawnBonus returns correct value

The `shouldSpawnBonus` method SHALL return true only for levels 2-7 when at least half the total dots have been collected.

#### Scenario: shouldSpawnBonus true at half threshold

- **WHEN** level is 2 and `getDotsCollected()` >= `getTotalDots() / 2`
- **THEN** `shouldSpawnBonus()` SHALL return true

#### Scenario: shouldSpawnBonus false for level 1

- **WHEN** level is 1
- **THEN** `shouldSpawnBonus()` SHALL return false regardless of dots collected

#### Scenario: shouldSpawnBonus false below half threshold

- **WHEN** level is 3 and `getDotsCollected() < getTotalDots() / 2`
- **THEN** `shouldSpawnBonus()` SHALL return false

### Requirement: createBonusItem creates timed bonus

The `createBonusItem` method SHALL only create a bonus item for levels 2-7, placed at the center, with an auto-destroy timer.

#### Scenario: Bonus item created at center for valid level

- **WHEN** `createBonusItem` is called for level 2
- **THEN** a BONUS_ITEM collectible SHALL be created at the center grid position

#### Scenario: No bonus item for level 1

- **WHEN** `createBonusItem` is called for level 1
- **THEN** no bonus item SHALL be created
