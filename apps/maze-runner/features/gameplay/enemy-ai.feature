@ai
Feature: Enemy AI
  As a tester, I want to verify enemy AI behaviors are deterministic with a given seed.

  Background:
    Given the game is configured with seed 42
    And the game is running at 1x speed

  Scenario: Chaser pursues player
    When I start the game
    And 30 frames pass
    Then the enemy "chaser" should be in state "scatter"
    And take a screenshot "chaser-initial"

  Scenario: Enemies move on frame advance
    When I start the game
    And 10 frames pass
    And I capture the enemy positions
    And 10 frames pass
    Then at least one enemy should have moved

  Scenario: Spawn enemy at specific position
    When I start the game
    And 10 frames pass
    And an enemy "chaser" is spawned at grid 5 3
    And 5 frames pass
    Then the enemy at grid 5 3 should exist
