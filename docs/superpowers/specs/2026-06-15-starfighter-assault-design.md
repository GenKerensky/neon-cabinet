# Starfighter Assault Design

## Summary

`Starfighter Assault` is a cockpit-view, wireframe 3D rail shooter for Neon Cabinet. It is loosely inspired by the 1983 Atari `Star Wars` coin-op, with more freedom of movement closer to `Star Fox 64`, mouse-first controls, roguelike sortie variation, and a purple, blue, and laser-pink visual theme.

The first playable MVP should deliver one complete arcade run: three procedural combat segments, between-segment bounty upgrades, and a finale against a Star Destroyer-like capital ship.

## Goals

- Create a fast, readable arcade-first rail shooter loop.
- Preserve the classic vector cockpit fantasy while adding modern mouse steering and broader movement.
- Make each run vary through constrained procedural route generation, enemy mixes, pickups, and upgrades.
- Keep the MVP scoped to temporary run progression, not permanent meta-progression.
- Build clear architecture boundaries so simulation, rail logic, renderer, input, and HUD can evolve independently.

## Non-Goals

- No permanent upgrade tree or long-term currency in the MVP.
- No fully free-flight six-degree space sim.
- No large hand-authored campaign or story mode.
- No large boss roster beyond the first capital ship finale.

## Core Loop

Each run starts with:

- 3 lives.
- Baseline shields.
- Unlimited dual laser cannons.
- A small torpedo inventory.

The player flies through a branching sortie made of three procedural combat segments, then a capital ship finale. During each segment, the player steers within a generous cockpit flight box, aims with the mouse, fires dual lasers freely, spends torpedoes on priority threats, and collects pickups or bounty caches.

The loop is:

1. Enter a segment with a visible route theme and threat preview.
2. Dodge fire and hazards while destroying fighters, turrets, gates, and gun emplacements.
3. Collect torpedo pickups, shield boosts, or bounty caches.
4. Finish the segment and choose one of two next segment nodes.
5. Spend bounties between segments on temporary run upgrades.
6. Survive the capital ship finale and destroy the flagship weak point.

Loss is life-based. Shield failure costs one life and respawns the player at the current segment checkpoint with restored baseline shields. At 0 lives, the run ends and bounties become score only.

## Controls

Primary control is mouse-first. The cursor maps to the aiming reticle and pulls the ship toward that point inside the bounded flight box. The ship stays on the rail path, but the player can strafe, climb, dive, and slightly bank inside the lane.

Keyboard input is secondary:

- Pause.
- Optional fire and torpedo bindings.
- Optional movement fallback.
- Optional weapon or target cycling if later upgrades require it.

The control feel should prioritize immediate arcade readability over simulation detail.

## Weapons

### Dual Laser Cannons

Dual lasers are the default unlimited weapon. They are weaker but fast, reliable, and useful for:

- fighters,
- mines,
- light turrets,
- destructible gates,
- bounty chaining.

Laser shots originate from the visible side cannon protrusions and converge toward the reticle.

### Torpedoes

Torpedoes are limited heavy weapons. They are best for:

- shield nodes,
- capital ship subsystems,
- heavy gun emplacements,
- clustered targets,
- finale weak points.

The MVP can start with straight-fire torpedoes and add lock-on behavior as an upgrade if implementation scope allows it.

### Pickups

Pickups appear in route-safe lanes and never inside forced damage paths. MVP pickups include:

- torpedo reloads,
- shield boosts,
- bounty caches.

## Procedural Sortie Structure

Runs use a small branching map: three combat segments followed by the fixed capital ship finale. Segment routes are generated procedurally from strict rules instead of being fully hand-authored.

Each generated segment has:

- a segment role,
- route curvature limits,
- flight box dimensions,
- enemy budget,
- hazard budget,
- pickup budget,
- bounty opportunity budget,
- allowed enemy and hazard types,
- max simultaneous threat count.

The generator must guarantee:

- readable mouse steering,
- at least one viable dodge lane,
- no pickup placed in a forced damage lane,
- at least one bounty scoring opportunity,
- enemy mixes that match the segment role,
- pressure caps appropriate to segment depth and difficulty.

## MVP Segment Roles

### Approach

Open-space entry with light fighters, scattered mines, and gentle route curves.

### Battery Field

Turret platforms and gun emplacements. Medium route pressure and strong bounty value.

### Interceptor Screen

Fighter-heavy dogfight lane with more vertical and lateral movement.

### Debris Corridor

Obstacle-dodging segment with fewer enemies and higher torpedo or shield pickup chances.

### Trench Run

Tighter flight box, surface guns, shield nodes, and high bounty payout.

## Branching Choices

Between segments, the player chooses one of two next nodes. Node labels should make risk and reward legible before selection, for example:

- `Battery Field: High Bounty`
- `Debris Corridor: Torpedo Cache`
- `Interceptor Screen: Elite Ace`
- `Trench Run: Shield Nodes`

The branch map should stay small for the MVP so route choice is meaningful without becoming a menu-heavy roguelike.

## Capital Ship Finale

The finale is a Star Destroyer-like capital ship assault. It has a recognizable structure every run, while difficulty, turret density, subsystem health, and pickup availability can scale from the run.

Finale stages:

1. **Approach Run**: dodge heavy batteries and destroy shield nodes or exterior gun emplacements.
2. **Surface Skim**: fly along the hull with more lateral freedom, picking off turrets, hangar defenses, and exposed power relays.
3. **Weak-Point Pass**: hit the command bridge or reactor aperture during a timed attack window, with torpedoes strongly rewarded.
4. **Escape Beat**: short high-speed exit while the capital ship breaks apart or fires desperation shots.

The capital ship should feel like a fixed finale, not a fourth ordinary procedural segment.

## Bounties And Upgrades

Bounties are earned by destroying:

- fighters,
- elite enemies,
- gun emplacements,
- shield nodes,
- capital ship subsystems,
- optional bounty caches.

Bounty streaks can reward fast precision kills, but should remain modest in the MVP so survival and target priority stay central.

Between segments, bounties buy temporary run upgrades:

- laser damage,
- laser fire rate,
- laser convergence or spread,
- torpedo capacity,
- torpedo pickup value,
- shield maximum,
- shield recharge delay,
- extra life, rare and expensive,
- radar clarity or target highlight.

No permanent meta-progression is included in the MVP.

## Visual Direction

The game uses Neon Cabinet's vector arcade style:

- black and deep-space base,
- wireframe geometry,
- bloom-friendly line art,
- purple, blue, and laser-pink theme,
- red-spectrum enemy threat language.

Enemy distance and danger should be visible in both the world and radar. Far enemies are pale red. Close or actively dangerous enemies are bright red.

## Cockpit HUD

The cockpit is the game's main identity. The approved framing is:

- instrument panels visible inside the cockpit along the bottom and lower sides,
- ship nose barely visible as a small lip above the console,
- dual laser cannons protruding from the side edges like the original arcade game,
- center reticle and target box in neon pink and cyan,
- bottom-center ovular enemy radar embedded in the console,
- left console for lives and shields,
- right console for weapons, torpedoes, and bounties.

The radar shows enemies and relevant threats in the forward combat view. It is not a full world map. Dot brightness and size scale by enemy distance and threat. Capital ship subsystems can appear as larger anchored blips during the finale.

## Technical Shape

The MVP should follow the existing Neon Cabinet app pattern with a dedicated `apps/starfighter-assault` game app and React/Vite shell.

Because the game is 3D and needs direct camera, rail, cockpit, and projectile control, implementation should use clear boundaries:

- `simulation`: run state, entities, weapons, damage, pickups, bounties, and upgrades.
- `rail`: path progression, route generation, segment constraints, and flight box limits.
- `renderer`: cockpit, camera, wireframe models, projectiles, effects, and capital ship presentation.
- `hud`: menus, upgrade shop, readable text, and status displays.
- `input`: mouse-to-reticle, fire, torpedo, pause, and keyboard fallback.
- `tests`: generator constraints, upgrade math, weapon rules, radar projection, and run state transitions.

The implementation plan should decide whether to extend the existing `battle-tanks` wireframe 3D engine patterns or use Three.js for stronger 3D scene and camera tooling.

## Testing Strategy

The MVP should include focused tests for:

- route generator constraints and pressure caps,
- pickup placement safety,
- weapon ammo and damage rules,
- bounty and upgrade purchase math,
- life and shield state transitions,
- radar projection and distance-to-brightness mapping,
- finale stage transitions.

Browser playtesting should verify:

- cockpit readability,
- mouse steering feel,
- visible laser origins from side cannon protrusions,
- radar dots matching forward enemies,
- no unavoidable damage lanes in generated segments,
- capital ship finale clarity.
