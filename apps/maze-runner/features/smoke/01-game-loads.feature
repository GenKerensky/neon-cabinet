@smoke
Feature: Game Loads
  As a player, I want the game to load correctly so I can play.

  Background:
    Given the game is configured with seed 42

  Scenario: Title screen is displayed
    Then the scene should be "Title"

  Scenario: Debug harness state is available
    Then the state should contain "scene"

  Scenario: Start transitions to Game scene
    When I start the game
    And 1 frames pass
    Then the scene should be "Game"
    And take a screenshot "game-start"
