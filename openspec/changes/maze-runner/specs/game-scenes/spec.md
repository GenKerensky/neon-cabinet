## ADDED Requirements

### Requirement: Boot scene generates vector textures

The system SHALL create all game textures programmatically using Phaser's Graphics API during the Boot scene, including player sprite, four enemy types, dots, power pellets, bonus items, and wall segments.

#### Scenario: Player texture generated

- **WHEN** Boot scene runs
- **THEN** a player texture is generated and registered in the Phaser texture manager

#### Scenario: Enemy textures generated

- **WHEN** Boot scene runs
- **THEN** textures for Chaser (red), Ambusher (pink), Wanderer (cyan), and Timid (orange) enemies are generated

#### Scenario: Collectible textures generated

- **WHEN** Boot scene runs
- **THEN** textures for dots, power pellets, and bonus items are generated

### Requirement: Title scene displays game title and controls

The system SHALL show an animated title screen with the game name "MAZE RUNNER" and a prompt to press a key to start.

#### Scenario: Title displays

- **WHEN** Title scene becomes active
- **THEN** the text "MAZE RUNNER" is displayed with animation

#### Scenario: Key press starts game

- **WHEN** player presses any key on the Title scene
- **THEN** the Game scene becomes active

### Requirement: Game scene initializes maze and game objects

The system SHALL create the maze from MazeGenerator, render the tilemap, spawn the player at the designated start position, and initialize all enemies and collectibles.

#### Scenario: Game scene creates maze

- **WHEN** Game scene becomes active
- **THEN** a maze is generated and rendered as a tilemap

#### Scenario: Player spawns at start position

- **WHEN** Game scene initializes
- **THEN** the player is placed at the designated spawn position below the enemy pen

### Requirement: Pause scene overlays game with menu

The system SHALL pause the game and display a menu with RESUME and QUIT options when ESC is pressed.

#### Scenario: ESC pauses game

- **WHEN** player presses ESC during Game scene
- **THEN** the game pauses and the Pause scene overlay appears

#### Scenario: Resume returns to game

- **WHEN** player selects RESUME on the Pause scene
- **THEN** the Game scene resumes

#### Scenario: Quit returns to title

- **WHEN** player selects QUIT on the Pause scene
- **THEN** the Title scene becomes active

### Requirement: GameOver scene displays final score

The system SHALL show the final score, high score, and options to restart or return to the menu when all lives are lost.

#### Scenario: GameOver displays score

- **WHEN** GameOver scene becomes active
- **THEN** the final score and high score are displayed

#### Scenario: Restart resets game

- **WHEN** player selects RESTART on GameOver scene
- **THEN** the Game scene is re-initialized with fresh state

#### Scenario: Menu returns to title

- **WHEN** player selects MENU on GameOver scene
- **THEN** the Title scene becomes active
