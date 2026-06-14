# Maze Runner Hack Power-Ups Design

## Context

Maze Runner already has a hack system with eight SVG-backed pickups, a single held-hack slot, `E` activation, and random per-tile spawning. This design keeps the term `HACK` and improves player clarity, inventory behavior, visual consistency, and level pacing.

The goal is to make hacks feel like intentional power-ups:

- level 1 has no hacks
- hacks start on level 2
- the player can understand what is held, which button uses it, and what it does
- hack complexity and reward increase over later levels
- placement stays semi-random, but within deterministic level rules

## Player Model

Hacks are split into two held slots:

- `DEF HACK`: defensive, evasive, survival, utility, and misdirection effects
- `ATK HACK`: attack, pressure, and ghost-control effects

The player can hold one `DEF HACK` and one `ATK HACK` at the same time.

Controls:

- `Q`: activate held `DEF HACK`
- `E`: activate held `ATK HACK`

Walking over a hack only collects it if that hack type's matching slot is empty. If the matching slot is already occupied, the pickup remains in the maze and a short `FULL` popup appears above the pickup.

`FULL` is preferred over `SLOT FULL` because it is shorter, easier to read in motion, and less likely to crowd the maze.

## HUD Design

The HUD uses two rounded command slots:

- bottom-left: `DEF HACK`, cool hue, `Q`
- bottom-right: `ATK HACK`, warm hue, `E`

Each slot shows:

- slot label
- large hack icon
- full held hack name, or empty state
- one short effect sentence
- activation key
- active timer state when a hack effect is running

The slots should have rounded corners and stable positions. The type color should remain consistent so the player learns that cool means defensive or evasive and warm means attack or control.

Recommended empty states:

- `DEF HACK: EMPTY`
- `ATK HACK: EMPTY`

Recommended ready states:

- `DEF HACK: Phase Chip`
- `ATK HACK: Reverse Pulse`

Recommended effect copy should stay practical rather than lore-heavy, for example:

- `Breach one wall in your direction.`
- `Absorb 1 lethal hit.`
- `Reverse nearby ghosts.`

## Hack Roster

Use the existing eight hacks and classify them by slot.

### DEF HACK / Q / Cool Hues

These hacks help the player escape, survive, collect, or misdirect.

| Hack         | Role               | Hue Direction    |
| ------------ | ------------------ | ---------------- |
| Phase Chip   | Evasive movement   | cyan             |
| Shield Ring  | Survival           | green            |
| Score Magnet | Utility collection | white/cyan       |
| Decoy Spark  | Misdirection       | violet/pink-cool |

### ATK HACK / E / Warm Hues

These hacks manipulate enemies, ghost access, pressure, or risk.

| Hack             | Role                 | Hue Direction            |
| ---------------- | -------------------- | ------------------------ |
| Reverse Pulse    | Area control         | yellow                   |
| Ghost Jammer     | Targeting disruption | hot pink/orange          |
| Gate Key         | Ghost-pen control    | orange/green-warm accent |
| Overclock Pellet | Risk/reward pressure | orange/red               |

`ATK HACK` is the player-facing slot label. Longer copy can use "attack hack" when space allows.

## Level Placement Policy

Hack placement is semi-random within level rules. The policy should define a target count and allowed pool per level, then choose valid positions using the game's seeded/randomized maze context.

| Level | Count | Pool                                                 |
| ----- | ----: | ---------------------------------------------------- |
| 1     |     0 | none                                                 |
| 2     |     2 | Phase Chip, Shield Ring                              |
| 3     |     3 | Phase Chip, Shield Ring, Score Magnet                |
| 4     |     3 | Phase Chip, Shield Ring, Score Magnet, Reverse Pulse |
| 5     |     4 | add Decoy Spark, Ghost Jammer                        |
| 6     |     4 | add Gate Key                                         |
| 7+    |     5 | full pool, including Overclock Pellet                |

Placement rules:

- level 1 always has zero hacks, regardless of upgrades
- valid positions are passage cells
- do not place hacks in the ghost spawn area
- do not place hacks on power pellet cells
- avoid clustering by spreading selected positions across the maze
- when both hack types are available, split placements across `DEF HACK` and `ATK HACK` as evenly as the pool allows
- upgrades can increase the count slightly after the base level policy is applied, but must never affect level 1

The policy should replace raw per-tile spawn chance with an explicit count-based placement pass. This keeps levels readable and testable while preserving variety between runs.

## Visual Language

All hack SVGs should use a consistent Signal Hack style:

- 32x32 viewBox
- dark core or body shape
- readable neon outline
- unique center glyph for the effect
- small `socket_signal` anchor where useful
- 3-5 primary visual layers
- cool palette for `DEF HACK`
- warm palette for `ATK HACK`

Animation style:

- uncollected hacks idle with a gentle pulse or wobble
- slot icons breathe subtly while ready
- activation triggers a short text burst near the player
- active slot timers visibly tick down
- full-slot rejection triggers `FULL` above the pickup

SVG/UAD animation should stay lightweight:

- wobble
- flash
- pulse
- directional rotation
- wave

Avoid fast flashing or dense effects that make pickups hard to read at maze scale.

## Architecture

The design should build on the current hack system instead of creating a separate power-up subsystem.

Recommended changes:

- add a hack category/type field to hack definitions, such as `slot: "def" | "atk"`
- add short HUD effect copy to hack definitions
- replace the single held hack field with two held slots
- split activation paths into `activateHeldDefHack()` and `activateHeldAtkHack()`, or one typed activation method
- make `Q` activate the defensive slot and `E` activate the attack slot
- replace raw random spawn chance with a level placement policy helper
- keep existing effect implementation where possible
- update the HUD renderer to draw two rounded command slots instead of one text line

`HackSystem` should remain responsible for held state, activation, active effects, and cleanup. `CollectibleManager` should remain responsible for placing collectibles, but should receive a level placement policy result rather than making independent per-cell hack decisions.

## Data Flow

1. Game creates a level.
2. Level placement policy returns allowed hack pool and target count for the current level.
3. CollectibleManager places dots, power pellets, and count-based hack pickups on valid cells.
4. Player overlaps a hack pickup.
5. Game asks HackSystem whether the matching slot can collect it.
6. If the slot is empty, HackSystem stores it and the pickup is removed.
7. If the slot is full, the pickup remains and Game shows `FULL` above it.
8. Player presses `Q` or `E`.
9. HackSystem activates the matching held hack, starts effects, records achievements/progression, and clears that slot.
10. HUD refreshes both slot state and active timers.

## Testing

Use test-driven development for implementation.

Required focused tests:

- level 1 places zero hack pickups
- level 2 places two hacks from the beginner defensive pool
- higher levels expand count and pool as specified
- placements avoid spawn area and power pellet cells
- placement spreads hacks rather than clustering when enough valid cells exist
- `DEF HACK` and `ATK HACK` can both be held at once
- collecting a second hack of a full matching type is rejected and does not replace the held hack
- rejected full-slot pickup remains active in the maze
- `Q` activates only the defensive slot
- `E` activates only the attack slot
- active effects still clean up correctly
- all hack SVGs remain parseable 32x32 sprite-tool assets

Verification commands should use Nx through Bun, for example:

```bash
bun nx test maze-runner
bun nx test sprite-tools
```

Run `sprite-tools` tests if SVG/UAD metadata or parser-facing assets change. Run browser verification for the HUD after implementation.

## Open Implementation Notes

Keep the first implementation pass focused on improving the existing eight hacks. Do not add new hack types, loadouts, or multi-item inventories beyond the one `DEF HACK` slot and one `ATK HACK` slot.

If a current hack's type feels borderline during implementation, prefer player clarity over perfect taxonomy:

- escaping or protecting the player belongs in `DEF HACK`
- manipulating ghost behavior or risk pressure belongs in `ATK HACK`
