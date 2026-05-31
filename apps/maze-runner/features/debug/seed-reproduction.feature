@debug
Feature: Seed Reproduction
  As a developer, I want to reproduce exact game states using seeds.

  Background:
    Given the game is configured with seed 42
    And the game is running at 1x speed

  Scenario: Same seed produces same initial state
    When I start the game
    And 10 frames pass
    Then the scene should be "Game"
    And take a screenshot "seed-42-frame-10"

  Scenario: Different seeds produce different states
    When I start the game
    And 30 frames pass
    And take a screenshot "seed-42-frame-30"
