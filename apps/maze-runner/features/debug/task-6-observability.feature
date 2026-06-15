@debug @task6
Feature: Task 6 observability evidence
  As a developer, I want browser evidence for title attract, HUD, and movement/pen snapshot.

  Scenario: Capture title attract screenshot before starting game
    Given I open the title scene with seed 42
    When I save bridge screenshot as "task-6-title-attract.png"

  Scenario: Capture game HUD screenshot after starting game
    Given I open the title scene with seed 42
    When I start the game scene through bridge
    And I wait for bridge scene "Game"
    And I save bridge screenshot as "task-6-game-hud.png"

  Scenario: Capture movement and pen observability snapshot
    Given I open the title scene with seed 42
    When I start the game scene through bridge
    And I wait for bridge scene "Game"
    And I move player right through scene control
    And I collect movement and pen state from bridge
    Then I save movement and pen evidence files
