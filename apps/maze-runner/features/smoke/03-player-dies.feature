@smoke
Feature: Player Dies
  As a player, I want to see death feedback when an enemy catches me.

  Background:
    Given the game is configured with seed 42
    And the game is running at 1x speed

  Scenario: Player loses a life on death
    When I start the game
    And 10 frames pass
    And the player is killed and 60 frames pass
    Then the lives should be 2

  Scenario: Death screenshot captured
    When I start the game
    And the player is killed and screenshot captured
