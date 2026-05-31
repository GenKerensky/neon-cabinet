@smoke
Feature: Player Moves
  As a player, I want to move through the maze so I can collect dots and avoid enemies.

  Background:
    Given the game is configured with seed 42
    And the game is running at 1x speed

  Scenario: Player moves right
    When I start the game
    And I capture the player position and press RIGHT
    Then the player's gridX should be greater than the initial value

  Scenario: Player moves left
    When I start the game
    And I capture the player position and press LEFT
    Then the player's gridX should be less than the initial value

  Scenario: Player moves up
    When I start the game
    And I capture the player position and press UP
    Then the player's gridY should be less than the initial value

  Scenario: Player moves down
    When I start the game
    And I capture the player position and press DOWN
    Then the player's gridY should be greater than the initial value
