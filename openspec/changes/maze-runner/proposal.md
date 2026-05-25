## Why

Add "Maze Runner" as a new arcade game to the Neon Cabinet collection, a Pacman-inspired maze chase game that follows the established vector graphics style and architectural patterns of existing games (Space Defender, Mars Lander, Battle Tanks).

## What Changes

- Create a new `maze-runner` app package with Phaser-based game implementation
- Implement maze generation via recursive backtracker algorithm with difficulty parameterization
- Implement A\* pathfinding utility for enemy AI navigation
- Create grid-based player movement with direction queuing at intersections
- Build 4 enemy types (Chaser, Ambusher, Wanderer, Timid) with distinct AI behaviors and state machine (SCATTER, CHASE, FRIGHTENED, DEAD)
- Create collectible system with dots, power pellets, and bonus items with scoring
- Implement level progression with difficulty scaling
- Integrate frontend route and game registry entry

## Capabilities

### New Capabilities

- `maze-generation`: Procedural maze generation using recursive backtracker algorithm with configurable difficulty parameters (maze size, path width, dead-end ratio)
- `pathfinding`: A\* pathfinding utility for enemy AI to navigate maze grid
- `player-movement`: Grid-based player movement with direction queuing, intersection detection, and wall collision
- `enemy-ai`: Enemy state machine (SCATTER, CHASE, FRIGHTENED, DEAD) with 4 distinct behavior types using pathfinding
- `collectibles`: Dot, power pellet, and bonus item system with point values, spawn logic, and power pellet mechanics (FRIGHTENED timer, consecutive eat bonus)
- `game-scenes`: Boot, Title, Game, Pause, and GameOver scenes following established Phaser scene pattern
- `level-progression`: Level completion, difficulty scaling, and game-over conditions

### Modified Capabilities

None.

## Impact

- New app package `maze-runner` under `apps/maze-runner/` with full game implementation
- Frontend route at `apps/frontend/src/app/games/maze-runner/page.tsx`
- Game registry update to add maze-runner as available game
- No changes to existing games or shared libraries
