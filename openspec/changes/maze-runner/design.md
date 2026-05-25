## Context

The Neon Cabinet project is a collection of retro arcade games built with Phaser 3, React, and TypeScript in an Nx monorepo. Each game follows a consistent pattern: a standalone app package with Phaser scenes, game objects, utilities, and a React wrapper component that integrates with the frontend. Games use vector graphics rendering with a VectorShader post-pipeline for a retro vector monitor aesthetic.

The `maze-runner` app scaffold exists with `package.json` and `vite.config.mts` but has no source code. The `.swarm/plan.md` provides a detailed 4-phase implementation plan covering scaffolding, game objects, scenes, and frontend integration.

## Goals / Non-Goals

**Goals:**

- Complete the Maze Runner game following the established architectural pattern (Phaser scenes, EventBus, game objects, React integration)
- Implement procedural maze generation with recursive backtracker algorithm
- Build grid-based movement system for player and enemies
- Create 4 distinct enemy AI behaviors with state machine and A\* pathfinding
- Deliver collectible system with scoring, power pellets, and level progression
- Integrate into frontend with route and game registry entry

**Non-Goals:**

- Multiplayer support
- Network/online features
- Mobile touch controls
- Sound effects or music (consistent with existing games)
- Modifying existing games or shared libraries

## Decisions

**Grid-based movement over free movement:** The maze structure naturally maps to a grid. Player and enemies move between grid cells, snapping to intersections. This simplifies collision detection and AI pathfinding compared to free-form movement.

**Recursive backtracker for maze generation:** Produces perfect mazes (no loops) with long corridors, matching classic Pacman maze topology. Difficulty is controlled by maze dimensions and path width parameters.

**A\* pathfinding for enemy AI:** Each enemy type uses A\* with different heuristic functions to create distinct behaviors. Chaser targets player position, Ambusher predicts player trajectory, Wanderer picks random targets, Timid flees from player.

**State machine for enemy behavior:** Classic Pacman used timed state transitions (SCATTER → CHASE → FRIGHTENED). This approach provides predictable, balanced gameplay. FRIGHTENED state is triggered by power pellets, allowing player to reverse roles temporarily.

**Direction queuing at intersections:** Player inputs are queued when at non-intersection points and executed at the next intersection. This matches classic Pacman controls and prevents frustration from missed inputs.

**Vector graphics via Phaser Graphics API:** Consistent with existing games. Boot scene generates all textures programmatically. Supports both color and monochrome modes via settings utility.

**Separate Enemy base class with behavior subclasses:** Base class handles state machine and grid movement. Four subclasses override the target selection logic. This follows the Strategy pattern and keeps AI behavior modular.

## Risks / Trade-offs

[Maze complexity vs performance] → Larger mazes with more enemies increase pathfinding cost. Mitigation: cap maze size, limit concurrent pathfinding calls, cache paths where possible.

[A* pathfinding in JavaScript] → Pure JS A\* may be slow for real-time AI on large mazes. Mitigation: use simplified grid representation, limit search depth, update paths at intervals rather than every frame.

[Grid alignment precision] → Floating-point drift during movement can cause grid misalignment. Mitigation: snap positions to grid at cell boundaries, use integer grid coordinates for logic.

[State synchronization] → Multiple enemies updating AI simultaneously can cause frame drops. Mitigation: stagger AI updates across frames, use frame-based scheduling.
