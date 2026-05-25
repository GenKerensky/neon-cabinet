## Context

Currently, the maze generator clears a 4x3 passage area at the center (rows centerY±2) for player spawning. Enemies spawn in open passage cells above the player with no enclosure. This change adds a walled 3x2 enclosure at the maze center with a bottom gate and a guaranteed passage ring outside the walls.

## Goals / Non-Goals

**Goals:**

- MazeGenerator creates a 3x2 walled enclosure centered at the maze center
- Enclosure has a gate opening at the bottom-center cell
- A 1-cell thick passage ring is guaranteed immediately outside all enclosure walls
- Enemy spawn positions in Game.ts are updated to grid cells inside the enclosure
- All existing tests continue to pass
- Works across all difficulty levels (smallest 15x13 to largest 23x21)

**Non-Goals:**

- Enemy pathfinding changes — existing `chooseDirection` handles navigation through the gate naturally
- Gate-open/close animation or timing — enemies are always free to leave
- Player spawn position changes

## Decisions

- **Spawn area expanded to 7x7**: The center clearance now covers cY-2..cY+4 and cX-3..cX+3 (7x7), providing room for the enclosure walls, the gate, and the 1-cell passage ring on all sides.
- **Enclosure placed at centerY..centerY+1 (not centerY-1..centerY)**: Places the enclosure in the lower part of the cleared center area, keeping the player spawn at centerY+2 below the gate. This avoids the player spawning inside the enclosure.
- **3x2 interior (not 3x3)**: 3x2 gives enough room for 4 enemies without being too large for small mazes. Walls on all sides except the bottom-center gate.
- **Gate at bottom (not top)**: The player spawns below the enclosure at centerY+2, so the gate opens toward the player, creating natural gameplay flow.
- **Clear path ring built into `createEnemyEnclosure()`**: Force-sets the immediate outer ring to passage rather than relying on the DFS, guaranteeing navigability.
- **`createEnemyEnclosure()` called after `createSpawnArea()` in the `create()` pipeline**: The spawn area pre-clears a large center area to all passage; the enclosure phase then places walls on top of that, keeping interior and ring as passage.

### Layout Diagram (row/col relative to center)

```
            cX-3  cX-2  cX-1  cX    cX+1  cX+2  cX+3
cY-3:      .     .     .     .     .     .     .      ← spawn area top
cY-2:      .     .     .     .     .     .     .      ← passage ring (top)
cY-1:      .     .     W     W     W     .     .      ← top wall
cY:        .     W     .     .     .     W     .      ← interior row 1 + side walls
cY+1:      .     W     .     .     .     W     .      ← interior row 2 + side walls
cY+2:      .     .     W     .     W     .     .      ← bottom walls + GATE
cY+3:      .     .     .     .     .     .     .      ← passage ring (bottom)
cY+4:      .     .     .     .     .     .     .      ← spawn area bottom
```

- `.` = passage, `W` = wall
- Interior (enemy walkable): cX-1..cX+1, cY..cY+1 (6 cells)
- Gate: (cX, cY+2)
- Ring: one-cell thick border around the outer walls
- Spawn area: 7x7 centered at (cX, cY) covering cY-2..cY+4, cX-3..cX+3

## Risks / Trade-offs

- **Large force-cleared area may make mazes feel less organic**: The 4x3 spawn area + enclosure walls + clear path ring force-clear a significant area of the center. Mitigation: this area is at the center where the maze design is already least interesting; the DFS handles the perimeter.
- **Spawn area size limits minimum maze dimensions**: The current smallest maze (15x13) has 7-cell margins on each side, so the 3+ cell enclosure + ring fits easily.
