@debug
Feature: Frame Inspection
  As a developer, I want to inspect game state at specific frames for debugging.

  Background:
    Given the game is configured with seed 42
    And the game is running at 0.1x speed

  Scenario: Step through frames and inspect state
    When I start the game
    And 5 frames pass
    Then the scene should be "Game"
    And take a screenshot "frame-5"

  Scenario: Pause and resume game
    When I start the game
    And 10 frames pass
    And the game is paused
    And 10 frames pass
    And the game is resumed
    And 5 frames pass
    Then the scene should be "Game"
