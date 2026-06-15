@gameplay
Feature: Power Pellets
  As a player, I want power pellets to make enemies vulnerable.

  Background:
    Given the game is configured with seed 42
    And the game is running at 1x speed

  Scenario: Power pellet activates frightened mode
    When I start the game
    And 10 frames pass
    And a power pellet is collected
    And 5 frames pass
    Then the enemy "chaser" should be in state "frightened"
    And take a screenshot "frightened-mode"

  Scenario: Frightened mode has a duration
    When I start the game
    And 10 frames pass
    And a power pellet is collected
    And 1000 frames pass
    Then the enemy "chaser" should not be in state "frightened"

  Scenario: Repeated power pellets extend frightened window
    When I start the game
    And 10 frames pass
    And a power pellet is collected
    And 120 frames pass
    And a power pellet is collected
    And 520 frames pass
    Then the enemy "chaser" should be in state "frightened"

  Scenario: Eaten ghost returns to pen and revives
    When I start the game
    And 10 frames pass
    And the enemy "chaser" state is set to "dead"
    And the enemy "chaser" is moved to grid 1 1
    And 220 frames pass
    Then the enemy "chaser" should arrive at the pen
