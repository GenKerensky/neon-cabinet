@gameplay
Feature: Level Transition
  As a player, I want to advance to the next level when all dots are collected.

  Background:
    Given the game is configured with seed 42
    And the game is running at 1x speed

  Scenario: Level increases when all dots collected
    When I start the game
    And 10 frames pass
    And all collectibles are cleared
    And the level transition is triggered
    Then the level should be 2
    And take a screenshot "level-2"
