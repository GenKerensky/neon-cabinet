@gameplay
Feature: Collectibles
  As a player, I want to collect dots to increase my score.

  Background:
    Given the game is configured with seed 42
    And the game is running at 1x speed

  Scenario: Collecting a dot increases score
    When I start the game
    And 10 frames pass
    And a dot is collected
    Then the score should be at least 10

  Scenario: Clear collectibles by type
    When I start the game
    And 10 frames pass
    And I capture the collectibles count
    And collectibles of type "dot" are cleared
    And take a screenshot "dots-cleared"
    Then the collectibles count should be less than the initial value
