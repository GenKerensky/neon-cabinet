## Why

Enemies currently spawn in open passage cells above the player with no visual or gameplay distinction. Creating a walled enclosure (like the Pac-Man ghost house) adds structure to the maze center, gives enemies a defined home base to return to, and creates a landmark players can recognize and navigate around.

## What Changes

- MazeGenerator gains a new `createEnemyEnclosure()` phase that builds a 3x2 walled room at the maze center with an opening at the bottom-center
- A clear passage corridor is guaranteed around the outside of the enclosure walls
- Enemy spawn positions in Game.ts move to inside the enclosure
- The existing `createSpawnArea()` range (now centerY±2 rows) is preserved — the enclosure walls are placed within that cleared area
- No changes to player spawn position

## Capabilities

### New Capabilities

- `enemy-enclosure`: Maze generator builds a 3x2 walled enclosure at the center, with a gate at the bottom-center, and a clear passage ring around the outside walls

### Modified Capabilities

- None

## Impact

- `src/game/utils/MazeGenerator.ts` — new `createEnemyEnclosure()` method called in the `create()` pipeline
- `src/game/scenes/Game.ts` — enemy spawn positions updated to grid cells inside the enclosure
- `tests/utils/MazeGenerator.spec.ts` — new tests verifying enclosure walls, interior passages, gate, and corridor ring
- `tests/objects/Enemy.spec.ts` — update any tests that rely on enemy starting positions relative to center
