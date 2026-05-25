## Why

The game currently uses static single-frame sprites for all entities. Adding procedural animations for player movement, death, ghost behavior, and pickup effects will transform the visual experience from a static prototype into a dynamic, arcade-quality game that captures the essence of classic Pac-Man.

## What Changes

- Procedurally generate multi-frame sprite sheets for player (4-direction chomp + death collapse + explosion)
- Procedurally generate multi-frame sprite sheets for ghosts (directional wavy feet + vulnerability flash + eye-only dead state)
- Ghost vulnerability animation with flashing that accelerates as the frightened timer counts down
- Player death animation matching original Pac-Man collapse style, ending with a particle explosion
- Particle effects on pellet and power pellet pickup
- Floating score text animations when points are earned
- Screen flash effect when power pellet is consumed

## Capabilities

### New Capabilities

- `player-animations`: Player chomp animation (4 directions, 3 frames each), death collapse animation (~12 frames), death explosion particle burst
- `ghost-animations`: Directional movement animation (4 directions, 2 frames each, wavy feet), vulnerability state (blue body with accelerating white/blue flash), dead state (eyes only, 4 directions)
- `pickup-effects`: Pellet pickup sparkle particles, power pellet pickup screen flash, floating score text popups
- `power-pellet-effects`: Ghost vulnerability timer visualization with flash speed ramping from slow to fast as timer approaches zero

### Modified Capabilities

- None (all new capabilities, no existing spec changes)

## Impact

- `apps/maze-runner/src/game/scenes/Boot.ts` — expand texture generation to create animation frame spritesheets
- `apps/maze-runner/src/game/objects/Player.ts` — add animation state machine, trigger animations on move/death
- `apps/maze-runner/src/game/objects/Enemy.ts` — add animation state machine for directional movement, vulnerability, death
- `apps/maze-runner/src/game/scenes/Game.ts` — add particle emitters, screen flash, floating text system
- `apps/maze-runner/src/game/objects/Collectible.ts` — trigger pickup effects on consumption
- New test files for animation behavior verification
