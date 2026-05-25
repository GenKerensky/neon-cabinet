## 1. Project Scaffolding and Core Utilities

- [x] 1.1 Create TypeScript config files (tsconfig.json, tsconfig.lib.json, tsconfig.spec.json) extending base config and index.html with Orbitron font
- [x] 1.2 Create EventBus with typed event emitter matching existing pattern (current-scene-ready event)
- [x] 1.3 Create MazeGenerator with recursive backtracker algorithm, difficulty parameterization, central spawn area, and wall/passage cell types
- [x] 1.4 Create Pathfinder with A\* pathfinding utility supporting custom heuristics for enemy AI
- [x] 1.5 Create font utility (reads font from scene registry) and settings utility (vector mode getter/setter)

## 2. Game Objects

- [x] 2.1 Create Player object with grid-based movement, direction queuing at intersections, wall collision detection, and configurable speed
- [x] 2.2 Create Enemy base class with state machine (SCATTER, CHASE, FRIGHTENED, DEAD), grid movement, timed state transitions, and speed reduction in FRIGHTENED state
- [x] 2.3 Create Chaser enemy subclass that targets player position directly via A\* pathfinding
- [x] 2.4 Create Ambusher enemy subclass that targets position ahead of player based on movement direction
- [x] 2.5 Create Wanderer enemy subclass that targets combined position of player and Chaser
- [x] 2.6 Create Timid enemy subclass with fixed corner target in SCATTER and random movement when distant in CHASE
- [x] 2.7 Create Collectible system with dots on all passage cells, power pellets at corners, bonus items between levels 2-7, and consecutive eat bonus scoring

## 3. Scenes

- [x] 3.1 Create Boot scene with vector texture generation for player, 4 enemy types, dots, power pellets, bonus items, and wall segments using Phaser Graphics API
- [x] 3.2 Create Title scene with animated "MAZE RUNNER" title, controls hint, and key press input to start game
- [x] 3.3 Create Game scene core: initialize MazeGenerator, render tilemap from grid, spawn player at start position, set up camera
- [x] 3.4 Add enemy spawning, AI integration, and collision detection to Game scene (player-enemy, enemy-wall, enemy-spawn pen return)
- [x] 3.5 Add collectibles (dots, power pellets) and scoring/lives system to Game scene with correct point values (10 per dot, 50 per power pellet)
- [x] 3.6 Add power pellet mechanics (FRIGHTENED timer, consecutive eat bonus starting at 200 doubling), bonus items, and level progression with difficulty scaling
- [x] 3.7 Create Pause scene with overlay, RESUME and QUIT options, ESC key toggle
- [x] 3.8 Create GameOver scene with final score, high score display, RESTART and MENU options

## 4. Frontend Integration

- [x] 4.1 Create PhaserGame.tsx React component with game config, VectorShader post-pipeline registration, and integer zoom scaling
- [x] 4.2 Create App.tsx and main.tsx React entry points matching existing game pattern
- [x] 4.3 Create frontend route page at apps/frontend/src/app/games/maze-runner/page.tsx with dynamic import
- [x] 4.4 Update game registry to add maze-runner as available game and add workspace dependency to frontend package.json
