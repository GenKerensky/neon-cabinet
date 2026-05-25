## Why

The player spawns directly at the ghost pen gate entrance (centerY+2), causing instant death when enemies exit. The current DFS maze generation creates too many dead ends, making the maze feel restrictive compared to classic Pac-Man's open, loop-heavy layout.

## What Changes

- Increase base maze dimensions from 15x13 to 21x17 (difficulty 1), scaling up proportionally for higher difficulties
- Move player spawn position further from the ghost pen — spawn at the bottom area of the maze instead of directly below the gate
- Add a dead-end reduction phase to the maze generation that removes walls between dead-end tips and adjacent passages, creating more loops
- Adjust the enemy enclosure gate timing so enemies don't immediately rush the player on spawn

## Capabilities

### New Capabilities

- `larger-maze-dimensions`: Base maze size increased across all difficulty levels, giving more room for gameplay and reducing claustrophobia
- `dead-end-reduction`: Post-processing step that identifies dead-end cells and removes walls to create alternative paths, producing a more open maze structure similar to classic Pac-Man

### Modified Capabilities

- `enemy-enclosure`: Player spawn position moved from centerY+2 (gate entrance) to a safer bottom-area position; gate timing adjusted to delay enemy exit on spawn

## Impact

- `src/game/utils/MazeGenerator.ts` — dimension formulas updated, new `reduceDeadEnds()` method added to pipeline
- `src/game/scenes/Game.ts` — player spawn position changed to bottom area of maze
- `tests/utils/MazeGenerator.spec.ts` — update dimension tests, add tests for dead-end reduction
