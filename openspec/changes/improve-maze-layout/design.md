## Context

The current maze generator uses a recursive backtracking (DFS) algorithm that produces "perfect" mazes — exactly one path between any two cells, resulting in many dead ends. The base dimensions (15x13 at difficulty 1) are small, and the player spawns at `centerY+2`, directly at the ghost pen gate. This creates an unfair start where enemies can reach the player immediately.

The reference image shows classic Pac-Man's maze: wide corridors, many loops, few dead ends, and the player spawns far from the ghost house.

## Goals / Non-Goals

**Goals:**

- Increase base maze dimensions to give players more room to maneuver
- Move player spawn to a safe distance from the ghost pen
- Reduce dead ends by adding loops to the maze structure
- Maintain maze connectivity (all passages still reachable)
- Keep the ghost pen enclosure intact

**Non-Goals:**

- Complete maze algorithm rewrite — we extend the existing DFS approach
- Symmetrical maze generation — randomness is fine
- Changing enemy AI behavior — only spawn position and gate timing change

## Decisions

### 1. Maze dimensions: +6 width, +4 height across all difficulties

**Decision**: Change base dimensions from `15 + (d-1)*2` / `13 + (d-1)*2` to `21 + (d-1)*2` / `17 + (d-1)*2`.

**Rationale**: The +6/+4 increase gives ~40% more area while keeping the same scaling pattern. Difficulty 1 goes from 15x13 (195 cells) to 21x17 (357 cells). This provides enough room for the player to have escape routes without making the maze unwieldy.

**Alternatives considered**:

- Double the size (30x26): Too large, would require camera scrolling changes
- Add 2 to each dimension: Not enough to solve the claustrophobia issue

### 2. Player spawn: bottom-center of maze

**Decision**: Move player spawn from `centerY+2` to `height - 3` (near bottom edge), keeping horizontal center at `centerX`.

**Rationale**: This mirrors classic Pac-Man where the player starts at the bottom and the ghost house is in the center. The distance from the ghost pen gate to the player is now roughly half the maze height, giving enemies time to exit and orient before reaching the player.

**Alternatives considered**:

- Random spawn position: Too unpredictable, could still spawn near enemies
- Fixed offset from gate (e.g., centerY+6): Doesn't scale with maze size

### 3. Dead-end reduction: post-process with wall removal

**Decision**: After DFS maze generation, identify dead-end cells (passage cells with exactly 1 adjacent passage neighbor). For each dead end, check the 3 non-neighbor directions for wall cells. If removing a wall would connect to an existing passage (creating a loop), remove it with 60% probability.

**Rationale**: This "braiding" approach preserves the DFS maze structure while adding shortcuts. The 60% probability means not all dead ends are removed — some remain for gameplay challenge. The result is a maze with fewer dead ends but still some tactical depth.

**Algorithm**:

1. Find all dead-end cells (passage cells with exactly 1 passage neighbor)
2. For each dead end, check adjacent wall cells in the 3 non-backtrack directions
3. If a wall cell's opposite side is a passage, removing it creates a loop
4. Remove the wall with 60% probability

**Alternatives considered**:

- Use a different maze algorithm (e.g., Kruskal's with loop creation): More complex, harder to control dead-end density
- Remove ALL dead ends: Makes maze too open, no tactical dead ends for evasion
- Pre-built maze templates: Loses procedural generation benefit

### 4. Gate delay: enemies wait 2 seconds before exiting

**Decision**: Add a `gateOpenTime` property to the enclosure. Enemies inside cannot pass through the gate until 2 seconds after game start.

**Rationale**: Even with the player moved to the bottom, a 2-second delay ensures the player has time to orient and start moving before any enemy can reach them. This is consistent with classic Pac-Man where ghosts start inside the house.

**Implementation**: Add a timestamp in Game.ts `create()` and check elapsed time in enemy movement logic before allowing gate passage.

## Risks / Trade-offs

- **Larger mazes may feel empty**: More cells but same number of collectibles could make the maze feel sparse. → Mitigation: scale collectible count proportionally with maze area
- **Dead-end removal could create too-short paths**: Removing walls between nearby passages creates short loops. → Mitigation: only remove walls that connect to passages at least 3 cells away
- **Gate delay reduces early-game tension**: Players have a safe window. → Mitigation: this is intentional — the original game also has a safe start; tension builds as enemies exit
- **Performance**: Larger mazes mean more cells to process. → Mitigation: 29x25 = 725 cells at max difficulty, trivial for modern hardware
