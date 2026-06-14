# Maze Runner Hack Power-Ups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved Maze Runner hack power-up redesign with DEF/ATK slots, level-based semi-random placement, clearer HUD, and the new Null Lance attack hack.

**Architecture:** Keep the existing hack system and Phaser scene structure. Add small focused helpers for hack slot metadata, placement policy, and Null Lance line targeting; then integrate those helpers into `HackSystem`, `CollectibleManager`, and `Game` without creating a separate power-up subsystem.

**Tech Stack:** TypeScript, Phaser, React-hosted game shell, Vite/Vitest through Nx, Bun, sprite-tools SVG parser/renderer.

---

## File Structure

- Modify: `apps/maze-runner/src/game/config/hackDefinitions.ts`
  - Add hack slot metadata, HUD effect copy, DEF/ATK color grouping, and `NULL_LANCE`.
- Create: `apps/maze-runner/public/assets/vector/hacks/null-lance.svg`
  - New Signal Hack SVG asset for Null Lance.
- Test: `apps/maze-runner/tests/game/hackDefinitions.spec.ts`
  - Validate 9 unique hacks, slot assignment, HUD copy, and parseable 32x32 assets.
- Create: `apps/maze-runner/src/game/config/hackPlacement.ts`
  - Pure level policy and semi-random placement helper.
- Test: `apps/maze-runner/tests/game/hackPlacement.spec.ts`
  - Validate counts, pools, level 1 zero, valid cell filtering, and spread.
- Modify: `apps/maze-runner/src/game/objects/Collectible.ts`
  - Replace raw per-cell hack chance with count-based placement results.
- Test: `apps/maze-runner/tests/objects/Collectible.spec.ts`
  - Update hack pickup expectations for level policy.
- Modify: `apps/maze-runner/src/game/systems/HackSystem.ts`
  - Replace single held hack with DEF/ATK slots; add full-slot rejection and typed activation.
- Test: `apps/maze-runner/tests/game/HackSystem.spec.ts`
  - Cover dual slots, Q/E activation paths, full rejection, and Null Lance delegation.
- Create: `apps/maze-runner/src/game/utils/nullLance.ts`
  - Pure line-of-sight target resolution for Null Lance.
- Test: `apps/maze-runner/tests/utils/nullLance.spec.ts`
  - Cover first living ghost, wall blocking, direction, and miss behavior.
- Modify: `apps/maze-runner/src/game/scenes/Game.ts`
  - Wire Q/E controls, dual rounded HUD slots, full popup, placement policy, and Null Lance ghost defeat.
- Test: `apps/maze-runner/tests/scenes/Game.spec.ts`
  - Cover input registration, full-slot pickup behavior, HUD text/state, and Null Lance defeat semantics.
- Modify: `apps/maze-runner/tests/helpers/createMockScene.ts`
  - Add `fillRoundedRect` and `strokeRoundedRect` only if a focused test using that shared helper fails because those graphics methods are absent.

---

### Task 1: Hack Definitions And Null Lance Asset

**Files:**

- Modify: `apps/maze-runner/src/game/config/hackDefinitions.ts`
- Create: `apps/maze-runner/public/assets/vector/hacks/null-lance.svg`
- Modify: `apps/maze-runner/tests/game/hackDefinitions.spec.ts`

- [ ] **Step 1: Write the failing metadata and asset test**

Replace the first test in `apps/maze-runner/tests/game/hackDefinitions.spec.ts` with:

```ts
it("defines nine unique signal hacks with slots, HUD copy, and stable cache keys", () => {
  expect(hackPickupIds).toHaveLength(9);
  expect(new Set(hackPickupIds).size).toBe(9);
  expect(hackPickupDefinitions).toHaveLength(9);
  expect(
    new Set(hackPickupDefinitions.map((definition) => definition.id)).size,
  ).toBe(9);
  expect(
    new Set(hackPickupDefinitions.map((definition) => definition.svgCacheKey))
      .size,
  ).toBe(9);
  expect(
    hackPickupDefinitions.every(
      (definition) => definition.slot === "def" || definition.slot === "atk",
    ),
  ).toBe(true);
  expect(
    hackPickupDefinitions.every(
      (definition) => definition.hudDescription.length > 0,
    ),
  ).toBe(true);
});
```

Add this test below it:

```ts
it("classifies Null Lance as a late-game ATK hack", () => {
  const nullLance = hackPickupDefinitions.find(
    (definition) => definition.id === "null-lance",
  );

  expect(nullLance).toMatchObject({
    id: "null-lance",
    displayName: "Null Lance",
    shortName: "NULL",
    slot: "atk",
    assetPath: "assets/vector/hacks/null-lance.svg",
    hudDescription: "Beam the first ghost in your line.",
  });
});
```

- [ ] **Step 2: Run the focused test and verify the expected failure**

Run:

```bash
bun nx test maze-runner -- --run tests/game/hackDefinitions.spec.ts
```

Expected: FAIL because `slot`, `hudDescription`, and `null-lance` do not exist.

- [ ] **Step 3: Add slot metadata and Null Lance definition**

In `apps/maze-runner/src/game/config/hackDefinitions.ts`, add:

```ts
export type HackSlot = "def" | "atk";
```

Extend `HackPickupId`:

```ts
NULL_LANCE = "null-lance",
```

Extend `HackPickupDefinition`:

```ts
slot: HackSlot;
hudDescription: string;
```

Add `slot` and `hudDescription` to every existing definition:

```ts
slot: "def",
hudDescription: "Breach one wall in your direction.",
```

Use these assignments:

```ts
Phase Chip: slot "def", hudDescription "Breach one wall in your direction."
Decoy Spark: slot "def", hudDescription "Drop a fake signal that draws ghosts."
Reverse Pulse: slot "atk", hudDescription "Reverse nearby ghosts."
Overclock Pellet: slot "atk", hudDescription "Boost speed, then trigger a ghost surge."
Shield Ring: slot "def", hudDescription "Absorb 1 lethal hit."
Score Magnet: slot "def", hudDescription "Pull nearby dots and pellets."
Ghost Jammer: slot "atk", hudDescription "Scramble ghost targeting."
Gate Key: slot "atk", hudDescription "Locks the ghost gate for 5s."
```

Append the Null Lance definition:

```ts
{
  id: HackPickupId.NULL_LANCE,
  svgCacheKey: "hack_null_lance_svg",
  assetPath: "assets/vector/hacks/null-lance.svg",
  displayName: "Null Lance",
  shortName: "NULL",
  durationMs: 0,
  color: "#ff5a3d",
  slot: "atk",
  description: "Beam the first ghost in your line.",
  hudDescription: "Beam the first ghost in your line.",
},
```

- [ ] **Step 4: Create the Null Lance SVG asset**

Use the vector-sprite-pipeline skill for this asset. Create `apps/maze-runner/public/assets/vector/hacks/null-lance.svg` with this starting SVG:

```xml
<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <g id="body" data-anim-wobble='{"frequency":7,"amplitude":0.8}'>
    <path d="M 6 18 L 11 6 L 25 9 L 27 22 L 15 28 Z" fill="#260807" stroke="#ff5a3d" stroke-width="2" />
    <path d="M 10 18 L 13 10 L 22 12 L 24 20 L 16 24 Z" fill="#ff9b42" opacity="0.28" />
  </g>
  <path id="lance" d="M 5 25 L 13 17 L 11 13 L 27 6 L 19 21 L 15 19 L 7 27 Z" fill="#ffffff" stroke="#ff9b42" stroke-width="1" data-anim-flash='{"frequency":8,"min":0.45,"max":1}' />
  <circle id="core" cx="16" cy="16" r="3" fill="#2a0806" stroke="#ffffff" stroke-width="1.5" />
  <circle id="socket_signal" cx="16" cy="16" r="1" fill="#ff5a3d" />
</svg>
```

- [ ] **Step 5: Render the asset preview**

Run:

```bash
mkdir -p test-results/vector-sprite-pipeline
bun run libs/sprite-tools/src/bin/render-svg.ts apps/maze-runner/public/assets/vector/hacks/null-lance.svg test-results/vector-sprite-pipeline/null-lance-raw.png
```

Expected: command exits 0 and writes `test-results/vector-sprite-pipeline/null-lance-raw.png`.

- [ ] **Step 6: Run the focused test and verify it passes**

Run:

```bash
bun nx test maze-runner -- --run tests/game/hackDefinitions.spec.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/maze-runner/src/game/config/hackDefinitions.ts apps/maze-runner/public/assets/vector/hacks/null-lance.svg apps/maze-runner/tests/game/hackDefinitions.spec.ts test-results/vector-sprite-pipeline/null-lance-raw.png
git commit -m "feat: add null lance hack definition" -m "- Add Null Lance metadata and SVG asset\n- Classify hacks by DEF/ATK slot\n- Add HUD descriptions for hack slots"
```

---

### Task 2: Level Hack Placement Policy

**Files:**

- Create: `apps/maze-runner/src/game/config/hackPlacement.ts`
- Create: `apps/maze-runner/tests/game/hackPlacement.spec.ts`

- [ ] **Step 1: Write failing placement policy tests**

Create `apps/maze-runner/tests/game/hackPlacement.spec.ts`:

```ts
import { describe, expect, it } from "vitest";
import { HackPickupId } from "../../src/game/config/hackDefinitions";
import {
  buildHackPlacementPlan,
  selectHackPickupCells,
} from "../../src/game/config/hackPlacement";
import { CellType, type MazeCell } from "../../src/game/utils/MazeGenerator";

function gridFromPattern(pattern: string[]): MazeCell[][] {
  return pattern.map((row) =>
    [...row].map((ch) => ({
      type: ch === "." ? CellType.PASSAGE : CellType.WALL,
      visited: false,
    })),
  );
}

describe("hackPlacement", () => {
  it("places zero hacks on level 1", () => {
    expect(buildHackPlacementPlan(1).count).toBe(0);
    expect(buildHackPlacementPlan(1).pool).toEqual([]);
  });

  it("starts level 2 with two beginner defensive hacks", () => {
    expect(buildHackPlacementPlan(2)).toEqual({
      count: 2,
      pool: [HackPickupId.PHASE_CHIP, HackPickupId.SHIELD_RING],
    });
  });

  it("adds Null Lance only in the level 7+ pool", () => {
    expect(buildHackPlacementPlan(6).pool).not.toContain(
      HackPickupId.NULL_LANCE,
    );
    expect(buildHackPlacementPlan(7).pool).toContain(HackPickupId.NULL_LANCE);
    expect(buildHackPlacementPlan(7).count).toBe(5);
  });

  it("selects valid spread cells outside spawn and power pellet cells", () => {
    const grid = gridFromPattern([
      "WWWWWWWWW",
      "W.......W",
      "W.......W",
      "W.......W",
      "W.......W",
      "W.......W",
      "W.......W",
      "W.......W",
      "WWWWWWWWW",
    ]);
    const placements = selectHackPickupCells({
      grid,
      gridWidth: 9,
      gridHeight: 9,
      level: 7,
      rng: () => 0,
    });

    expect(placements).toHaveLength(5);
    expect(
      placements.map((placement) => `${placement.gridX},${placement.gridY}`),
    ).not.toContain("1,1");
    expect(
      placements.map((placement) => `${placement.gridX},${placement.gridY}`),
    ).not.toContain("7,1");
    expect(
      placements.map((placement) => `${placement.gridX},${placement.gridY}`),
    ).not.toContain("1,7");
    expect(
      placements.map((placement) => `${placement.gridX},${placement.gridY}`),
    ).not.toContain("7,7");
    expect(
      placements.some(
        (placement) => placement.gridX === 4 && placement.gridY === 4,
      ),
    ).toBe(false);
    expect(
      new Set(placements.map((placement) => placement.hackId)).size,
    ).toBeGreaterThan(1);
  });
});
```

- [ ] **Step 2: Run the focused test and verify the expected failure**

Run:

```bash
bun nx test maze-runner -- --run tests/game/hackPlacement.spec.ts
```

Expected: FAIL because `hackPlacement.ts` does not exist.

- [ ] **Step 3: Implement the placement policy helper**

Create `apps/maze-runner/src/game/config/hackPlacement.ts`:

```ts
import { HackPickupId, getHackPickupDefinition } from "./hackDefinitions";
import { CellType, type MazeCell } from "../utils/MazeGenerator";

export interface HackPlacementPlan {
  count: number;
  pool: HackPickupId[];
}

export interface HackPickupPlacement {
  gridX: number;
  gridY: number;
  hackId: HackPickupId;
}

export interface HackCellSelectionOptions {
  grid: MazeCell[][];
  gridWidth: number;
  gridHeight: number;
  level: number;
  extraCount?: number;
  rng?: () => number;
}

export function buildHackPlacementPlan(
  level: number,
  extraCount = 0,
): HackPlacementPlan {
  const normalizedLevel = Math.max(1, Math.floor(level));
  if (normalizedLevel <= 1) return { count: 0, pool: [] };

  if (normalizedLevel === 2) {
    return {
      count: 2 + extraCount,
      pool: [HackPickupId.PHASE_CHIP, HackPickupId.SHIELD_RING],
    };
  }
  if (normalizedLevel === 3) {
    return {
      count: 3 + extraCount,
      pool: [
        HackPickupId.PHASE_CHIP,
        HackPickupId.SHIELD_RING,
        HackPickupId.SCORE_MAGNET,
      ],
    };
  }
  if (normalizedLevel === 4) {
    return {
      count: 3 + extraCount,
      pool: [
        HackPickupId.PHASE_CHIP,
        HackPickupId.SHIELD_RING,
        HackPickupId.SCORE_MAGNET,
        HackPickupId.REVERSE_PULSE,
      ],
    };
  }
  if (normalizedLevel === 5) {
    return {
      count: 4 + extraCount,
      pool: [
        HackPickupId.PHASE_CHIP,
        HackPickupId.SHIELD_RING,
        HackPickupId.SCORE_MAGNET,
        HackPickupId.REVERSE_PULSE,
        HackPickupId.DECOY_SPARK,
        HackPickupId.GHOST_JAMMER,
      ],
    };
  }
  if (normalizedLevel === 6) {
    return {
      count: 4 + extraCount,
      pool: [
        HackPickupId.PHASE_CHIP,
        HackPickupId.SHIELD_RING,
        HackPickupId.SCORE_MAGNET,
        HackPickupId.REVERSE_PULSE,
        HackPickupId.DECOY_SPARK,
        HackPickupId.GHOST_JAMMER,
        HackPickupId.GATE_KEY,
      ],
    };
  }

  return {
    count: 5 + extraCount,
    pool: [
      HackPickupId.PHASE_CHIP,
      HackPickupId.SHIELD_RING,
      HackPickupId.SCORE_MAGNET,
      HackPickupId.REVERSE_PULSE,
      HackPickupId.DECOY_SPARK,
      HackPickupId.GHOST_JAMMER,
      HackPickupId.GATE_KEY,
      HackPickupId.OVERCLOCK_PELLET,
      HackPickupId.NULL_LANCE,
    ],
  };
}

export function selectHackPickupCells(
  options: HackCellSelectionOptions,
): HackPickupPlacement[] {
  const rng = options.rng ?? Math.random;
  const plan = buildHackPlacementPlan(options.level, options.extraCount ?? 0);
  if (plan.count <= 0 || plan.pool.length === 0) return [];

  const blocked = new Set([
    ...getPowerPelletPositions(options.gridWidth, options.gridHeight).map(
      ({ x, y }) => `${x},${y}`,
    ),
    ...getSpawnArea(options.gridWidth, options.gridHeight).map(
      ({ x, y }) => `${x},${y}`,
    ),
  ]);
  const candidates: { gridX: number; gridY: number }[] = [];

  for (let y = 0; y < options.gridHeight; y++) {
    for (let x = 0; x < options.gridWidth; x++) {
      if (options.grid[y]?.[x]?.type !== CellType.PASSAGE) continue;
      if (blocked.has(`${x},${y}`)) continue;
      candidates.push({ gridX: x, gridY: y });
    }
  }

  const selected: HackPickupPlacement[] = [];
  const shuffled = [...candidates].sort(() => rng() - 0.5);
  const slotBalancedPool = buildSlotBalancedPool(plan.pool);
  const targetCount = Math.min(plan.count, shuffled.length);

  for (let index = 0; index < targetCount; index++) {
    const cell = shuffled[Math.floor((index * shuffled.length) / targetCount)];
    selected.push({
      ...cell,
      hackId: slotBalancedPool[index % slotBalancedPool.length],
    });
  }

  return selected;
}

function buildSlotBalancedPool(pool: HackPickupId[]): HackPickupId[] {
  const def = pool.filter((id) => getHackPickupDefinition(id).slot === "def");
  const atk = pool.filter((id) => getHackPickupDefinition(id).slot === "atk");
  const balanced: HackPickupId[] = [];
  const max = Math.max(def.length, atk.length);

  for (let i = 0; i < max; i++) {
    if (def[i]) balanced.push(def[i]);
    if (atk[i]) balanced.push(atk[i]);
  }

  return balanced.length > 0 ? balanced : pool;
}

function getPowerPelletPositions(
  gridWidth: number,
  gridHeight: number,
): { x: number; y: number }[] {
  return [
    { x: 1, y: 1 },
    { x: gridWidth - 2, y: 1 },
    { x: 1, y: gridHeight - 2 },
    { x: gridWidth - 2, y: gridHeight - 2 },
  ];
}

function getSpawnArea(
  gridWidth: number,
  gridHeight: number,
): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  const centerX = Math.floor(gridWidth / 2);
  const centerY = Math.floor(gridHeight / 2);

  for (let y = centerY - 1; y <= centerY + 1; y++) {
    for (let x = centerX - 1; x <= centerX + 1; x++) {
      positions.push({ x, y });
    }
  }

  return positions;
}
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```bash
bun nx test maze-runner -- --run tests/game/hackPlacement.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/maze-runner/src/game/config/hackPlacement.ts apps/maze-runner/tests/game/hackPlacement.spec.ts
git commit -m "feat: add maze runner hack placement policy" -m "- Define level-based hack counts and pools\n- Add count-based semi-random cell selection\n- Cover level one zero hacks and late-game Null Lance availability"
```

---

### Task 3: Integrate Count-Based Placement In CollectibleManager

**Files:**

- Modify: `apps/maze-runner/src/game/objects/Collectible.ts`
- Modify: `apps/maze-runner/tests/objects/Collectible.spec.ts`

- [ ] **Step 1: Replace the old random-chance test with level policy tests**

In `apps/maze-runner/tests/objects/Collectible.spec.ts`, replace the test named `can create hack pickups without counting them toward level completion` with:

```ts
it("places zero hack pickups on level 1", () => {
  const grid = gridFromPattern([
    "WWWWWWWWW",
    "W.......W",
    "W.......W",
    "W.......W",
    "W.......W",
    "W.......W",
    "W.......W",
    "W.......W",
    "WWWWWWWWW",
  ]);
  const scene = createMockScene();
  const mgr = new CollectibleManager(scene, grid, 9, 9, 16, 0, 0, 1, {
    rng: () => 0,
  });

  const collectibles = mgr.createAll();

  expect(
    collectibles.filter(
      (collectible) => collectible.getType() === CollectibleType.HACK_PICKUP,
    ),
  ).toHaveLength(0);
});

it("places count-based hack pickups without counting them toward level completion", () => {
  const grid = gridFromPattern([
    "WWWWWWWWW",
    "W.......W",
    "W.......W",
    "W.......W",
    "W.......W",
    "W.......W",
    "W.......W",
    "W.......W",
    "WWWWWWWWW",
  ]);
  const scene = createMockScene();
  const mgr = new CollectibleManager(scene, grid, 9, 9, 16, 0, 0, 2, {
    rng: () => 0,
  });

  const collectibles = mgr.createAll();
  const hackPickups = collectibles.filter(
    (collectible) => collectible.getType() === CollectibleType.HACK_PICKUP,
  );

  expect(hackPickups).toHaveLength(2);
  expect(hackPickups.map((pickup) => pickup.getHackId()).sort()).toEqual([
    "phase-chip",
    "shield-ring",
  ]);

  for (const collectible of [...mgr.getCollectibles()]) {
    if (collectible.getType() !== CollectibleType.HACK_PICKUP) {
      mgr.removeCollectible(collectible);
    }
  }

  expect(mgr.isLevelComplete()).toBe(true);
});
```

- [ ] **Step 2: Run the focused test and verify the expected failure**

Run:

```bash
bun nx test maze-runner -- --run tests/objects/Collectible.spec.ts
```

Expected: FAIL because level 2 still uses per-cell chance and level 1 can spawn hacks when chance is configured.

- [ ] **Step 3: Integrate placement helper into CollectibleManager**

In `apps/maze-runner/src/game/objects/Collectible.ts`:

Replace the import of `hackPickupIds` with:

```ts
import { selectHackPickupCells } from "../config/hackPlacement";
```

Change `CollectibleManagerOptions` to:

```ts
export interface CollectibleManagerOptions {
  extraHackCount?: number;
  rng?: () => number;
}
```

Replace `hackSpawnChance` and `availableHackIds` fields with:

```ts
private extraHackCount: number;
```

Set it in the constructor:

```ts
this.extraHackCount = options.extraHackCount ?? 0;
```

At the start of `createAll()`, add:

```ts
const hackPlacements = new Map(
  selectHackPickupCells({
    grid: this.grid,
    gridWidth: this.gridWidth,
    gridHeight: this.gridHeight,
    level: this.level,
    extraCount: this.extraHackCount,
    rng: this.rng,
  }).map((placement) => [`${placement.gridX},${placement.gridY}`, placement]),
);
```

Replace:

```ts
} else if (this.shouldCreateHackPickup()) {
  this.createHackCollectible(x, y);
} else {
```

with:

```ts
} else {
  const hackPlacement = hackPlacements.get(`${x},${y}`);
  if (hackPlacement) {
    this.createHackCollectible(x, y, hackPlacement.hackId);
  } else {
    this.createCollectible(x, y, CollectibleType.DOT, 10);
  }
}
```

Change `createHackCollectible` to:

```ts
private createHackCollectible(
  gridX: number,
  gridY: number,
  hackId: HackPickupId,
): Collectible {
  const x = this.offsetX + gridX * this.tileSize + this.tileSize / 2;
  const y = this.offsetY + gridY * this.tileSize + this.tileSize / 2;
  const collectible = new Collectible(
    this.scene,
    x,
    y,
    "power_pellet",
    CollectibleType.HACK_PICKUP,
    0,
    this.tileSize,
    hackId,
  );
  this.collectibles.push(collectible);
  return collectible;
}
```

Remove `shouldCreateHackPickup()`.

- [ ] **Step 4: Update Game's CollectibleManager options**

In `apps/maze-runner/src/game/scenes/Game.ts`, replace `hackSpawnChance` with:

```ts
const extraHackCount = progression.unlocks.includes("spawn-chance") ? 1 : 0;
```

Pass:

```ts
{
  extraHackCount,
}
```

- [ ] **Step 5: Run focused tests**

Run:

```bash
bun nx test maze-runner -- --run tests/objects/Collectible.spec.ts tests/game/hackPlacement.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/maze-runner/src/game/objects/Collectible.ts apps/maze-runner/src/game/scenes/Game.ts apps/maze-runner/tests/objects/Collectible.spec.ts
git commit -m "feat: use level-based hack pickup placement" -m "- Replace raw per-tile hack spawn chance with count-based placement\n- Keep level one free of hack pickups\n- Preserve hack pickups outside level completion requirements"
```

---

### Task 4: Dual DEF/ATK Held Slots In HackSystem

**Files:**

- Modify: `apps/maze-runner/src/game/systems/HackSystem.ts`
- Modify: `apps/maze-runner/tests/game/HackSystem.spec.ts`

- [ ] **Step 1: Write failing dual-slot tests**

Replace the first test in `apps/maze-runner/tests/game/HackSystem.spec.ts` with:

```ts
it("stores one DEF hack and one ATK hack without replacement", () => {
  const context = createContext();
  const system = new HackSystem(context);

  expect(system.collectHack("phase-chip")).toEqual({
    heldHack: "phase-chip",
    slot: "def",
    collected: true,
    full: false,
  });
  expect(system.collectHack("reverse-pulse")).toEqual({
    heldHack: "reverse-pulse",
    slot: "atk",
    collected: true,
    full: false,
  });
  expect(system.getHeldHack("def")).toBe("phase-chip");
  expect(system.getHeldHack("atk")).toBe("reverse-pulse");
});

it("rejects collecting into a full matching slot", () => {
  const context = createContext();
  const system = new HackSystem(context);

  system.collectHack("phase-chip");

  expect(system.collectHack("shield-ring")).toEqual({
    heldHack: "phase-chip",
    slot: "def",
    collected: false,
    full: true,
  });
  expect(system.getHeldHack("def")).toBe("phase-chip");
  expect(context.addScore).not.toHaveBeenCalled();
});
```

Update the blocked activation test to use typed activation:

```ts
expect(system.activateHeldHack("atk", { blocked: true })).toBe(false);
expect(system.getHeldHack("atk")).toBe("reverse-pulse");
```

- [ ] **Step 2: Run HackSystem tests and verify the expected failure**

Run:

```bash
bun nx test maze-runner -- --run tests/game/HackSystem.spec.ts
```

Expected: FAIL because `getHeldHack(slot)` and typed activation do not exist.

- [ ] **Step 3: Implement dual-slot held state**

In `HackSystem.ts`, import `HackSlot`:

```ts
import {
  getHackPickupDefinition,
  HackPickupId,
  type HackSlot,
} from "../config/hackDefinitions";
```

Replace `HackCollectResult` with:

```ts
export interface HackCollectResult {
  heldHack: HackPickupId;
  slot: HackSlot;
  collected: boolean;
  full: boolean;
}
```

Replace:

```ts
private heldHack: HackPickupId | null = null;
```

with:

```ts
private heldHacks: Record<HackSlot, HackPickupId | null> = {
  def: null,
  atk: null,
};
```

Replace `getHeldHack()` with:

```ts
getHeldHack(slot: HackSlot): HackPickupId | null {
  return this.heldHacks[slot];
}

getHeldHacks(): Record<HackSlot, HackPickupId | null> {
  return { ...this.heldHacks };
}
```

Replace `collectHack` with:

```ts
collectHack(id: HackPickupId): HackCollectResult {
  const definition = getHackPickupDefinition(id);
  const heldHack = this.heldHacks[definition.slot];

  if (heldHack) {
    return {
      heldHack,
      slot: definition.slot,
      collected: false,
      full: true,
    };
  }

  this.heldHacks[definition.slot] = id;
  return {
    heldHack: id,
    slot: definition.slot,
    collected: true,
    full: false,
  };
}
```

Change activation signature:

```ts
activateHeldHack(
  slot: HackSlot,
  options: HackActivationOptions = {},
): boolean {
  const heldHack = this.heldHacks[slot];
  if (options.blocked || !heldHack) return false;

  const id = heldHack;
  const definition = getHackPickupDefinition(id);
  const durationMs = this.getDurationMs(definition.durationMs);
  this.heldHacks[slot] = null;
  ...
}
```

Update `clearForDeath()`:

```ts
this.heldHacks = { def: null, atk: null };
```

- [ ] **Step 4: Update existing HackSystem tests for typed slots**

Update activation setup:

```ts
system.collectHack("overclock-pellet");
expect(system.activateHeldHack("atk")).toBe(true);
expect(system.getHeldHack("atk")).toBeNull();
```

Update clear test:

```ts
system.collectHack("shield-ring");
system.activateHeldHack("def");
expect(system.getHeldHacks()).toEqual({ def: null, atk: null });
```

- [ ] **Step 5: Run HackSystem tests**

Run:

```bash
bun nx test maze-runner -- --run tests/game/HackSystem.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/maze-runner/src/game/systems/HackSystem.ts apps/maze-runner/tests/game/HackSystem.spec.ts
git commit -m "feat: split hack inventory into def and atk slots" -m "- Store one held hack per slot\n- Reject full matching slots without replacement\n- Activate held hacks by slot"
```

---

### Task 5: Null Lance Line Targeting Utility

**Files:**

- Create: `apps/maze-runner/src/game/utils/nullLance.ts`
- Create: `apps/maze-runner/tests/utils/nullLance.spec.ts`

- [ ] **Step 1: Write failing line targeting tests**

Create `apps/maze-runner/tests/utils/nullLance.spec.ts`:

```ts
import { describe, expect, it } from "vitest";
import { findNullLanceTarget } from "../../src/game/utils/nullLance";
import { Direction } from "../../src/game/utils/DirectionUtils";
import { CellType, type MazeCell } from "../../src/game/utils/MazeGenerator";

function gridFromPattern(pattern: string[]): MazeCell[][] {
  return pattern.map((row) =>
    [...row].map((ch) => ({
      type: ch === "." ? CellType.PASSAGE : CellType.WALL,
      visited: false,
    })),
  );
}

describe("findNullLanceTarget", () => {
  it("returns the first living ghost in the player's line", () => {
    const grid = gridFromPattern(["WWWWWWW", "W.....W", "WWWWWWW"]);
    const enemies = [
      { x: 56, y: 24, getState: () => "chase" },
      { x: 72, y: 24, getState: () => "chase" },
    ];

    expect(
      findNullLanceTarget({
        grid,
        gridWidth: 7,
        gridHeight: 3,
        tileSize: 16,
        offsetX: 0,
        offsetY: 0,
        player: { x: 24, y: 24, direction: Direction.RIGHT },
        enemies,
      }),
    ).toBe(enemies[0]);
  });

  it("ignores dead ghosts and stops at walls", () => {
    const grid = gridFromPattern(["WWWWWWWWW", "W...W...W", "WWWWWWWWW"]);
    const enemies = [
      { x: 56, y: 24, getState: () => "dead" },
      { x: 104, y: 24, getState: () => "chase" },
    ];

    expect(
      findNullLanceTarget({
        grid,
        gridWidth: 9,
        gridHeight: 3,
        tileSize: 16,
        offsetX: 0,
        offsetY: 0,
        player: { x: 24, y: 24, direction: Direction.RIGHT },
        enemies,
      }),
    ).toBeNull();
  });
});
```

- [ ] **Step 2: Run the focused test and verify the expected failure**

Run:

```bash
bun nx test maze-runner -- --run tests/utils/nullLance.spec.ts
```

Expected: FAIL because `nullLance.ts` does not exist.

- [ ] **Step 3: Implement the targeting utility**

Create `apps/maze-runner/src/game/utils/nullLance.ts`:

```ts
import { directionToDx, directionToDy, Direction } from "./DirectionUtils";
import { worldToGrid } from "./gridGeometry";
import { CellType, type MazeCell } from "./MazeGenerator";

export interface NullLanceEnemy {
  x: number;
  y: number;
  getState(): string;
}

export interface NullLanceTargetOptions<TEnemy extends NullLanceEnemy> {
  grid: MazeCell[][];
  gridWidth: number;
  gridHeight: number;
  tileSize: number;
  offsetX: number;
  offsetY: number;
  player: {
    x: number;
    y: number;
    direction: Direction;
  };
  enemies: readonly TEnemy[];
}

const NON_LIVING_STATES = new Set(["dead", "entering_pen"]);

export function findNullLanceTarget<TEnemy extends NullLanceEnemy>(
  options: NullLanceTargetOptions<TEnemy>,
): TEnemy | null {
  const dx = directionToDx(options.player.direction);
  const dy = directionToDy(options.player.direction);
  if (dx === 0 && dy === 0) return null;

  const start = worldToGrid(
    options.player.x,
    options.player.y,
    options.tileSize,
    options.offsetX,
    options.offsetY,
  );
  const enemiesByCell = new Map<string, TEnemy[]>();

  for (const enemy of options.enemies) {
    if (NON_LIVING_STATES.has(enemy.getState())) continue;
    const cell = worldToGrid(
      enemy.x,
      enemy.y,
      options.tileSize,
      options.offsetX,
      options.offsetY,
    );
    const key = `${cell.gridX},${cell.gridY}`;
    enemiesByCell.set(key, [...(enemiesByCell.get(key) ?? []), enemy]);
  }

  let x = start.gridX + dx;
  let y = start.gridY + dy;
  while (x >= 0 && x < options.gridWidth && y >= 0 && y < options.gridHeight) {
    if (options.grid[y]?.[x]?.type !== CellType.PASSAGE) return null;
    const enemies = enemiesByCell.get(`${x},${y}`);
    if (enemies?.[0]) return enemies[0];
    x += dx;
    y += dy;
  }

  return null;
}
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```bash
bun nx test maze-runner -- --run tests/utils/nullLance.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/maze-runner/src/game/utils/nullLance.ts apps/maze-runner/tests/utils/nullLance.spec.ts
git commit -m "feat: add null lance targeting helper" -m "- Resolve the first living ghost in line of sight\n- Stop beam targeting at maze walls\n- Cover miss and dead-ghost behavior"
```

---

### Task 6: Null Lance Activation Through HackSystem And Game

**Files:**

- Modify: `apps/maze-runner/src/game/systems/HackSystem.ts`
- Modify: `apps/maze-runner/src/game/scenes/Game.ts`
- Modify: `apps/maze-runner/tests/game/HackSystem.spec.ts`
- Modify: `apps/maze-runner/tests/scenes/Game.spec.ts`

- [ ] **Step 1: Write failing HackSystem delegation tests**

In `createContext()` in `HackSystem.spec.ts`, add:

```ts
fireNullLance: vi.fn(() => true),
```

Add to `HackSystemContext` expectation type after implementation:

```ts
fireNullLance(): boolean;
```

Add test:

```ts
it("fires Null Lance through the ATK slot and records a miss effect when it misses", () => {
  const context = createContext();
  context.fireNullLance = vi.fn(() => false);
  const system = new HackSystem(context);
  system.collectHack("null-lance");

  expect(system.activateHeldHack("atk")).toBe(true);

  expect(context.fireNullLance).toHaveBeenCalled();
  expect(system.getHeldHack("atk")).toBeNull();
  expect(context.showEffect).toHaveBeenCalledWith("MISS", 100, 100);
});
```

- [ ] **Step 2: Run HackSystem tests and verify the expected failure**

Run:

```bash
bun nx test maze-runner -- --run tests/game/HackSystem.spec.ts
```

Expected: FAIL because `fireNullLance` is not in `HackSystemContext` and `NULL_LANCE` has no switch case.

- [ ] **Step 3: Implement HackSystem Null Lance delegation**

In `HackSystemContext`, add:

```ts
fireNullLance(): boolean;
```

In the switch inside `activateHeldHack`, add:

```ts
case HackPickupId.NULL_LANCE: {
  const hit = this.context.fireNullLance();
  this.context.showEffect(
    hit ? definition.shortName : "MISS",
    this.context.player.x,
    this.context.player.y,
  );
  return true;
}
```

Change the final `showEffect` call so it does not run twice for `NULL_LANCE`. The simplest implementation is to leave the existing final call in place for all other cases and return early in the `NULL_LANCE` case as shown.

- [ ] **Step 4: Add Game-level Null Lance behavior test**

In `apps/maze-runner/tests/scenes/Game.spec.ts`, add a test near enemy contact tests:

```ts
it("defeats the first living ghost hit by Null Lance as though eaten", () => {
  const game = new Game();
  const target = createMockEnemy(EnemyState.CHASE);
  target.x = 130;
  target.y = 100;
  (game as any).player = {
    x: 100,
    y: 100,
    getCurrentDirection: vi.fn(() => Direction.RIGHT),
  };
  (game as any).enemies = [target];
  (game as any).grid = gridFromPattern(["WWWWWWW", "W.....W", "WWWWWWW"]);
  (game as any).gridWidth = 7;
  (game as any).gridHeight = 3;
  (game as any).tileSize = 30;
  (game as any).offsetX = -5;
  (game as any).offsetY = 55;
  (game as any).addScore = vi.fn();
  (game as any).showFloatingScore = vi.fn();
  (game as any).playSfx = vi.fn();

  expect((game as any).fireNullLance()).toBe(true);
  expect((game as any).addScore).toHaveBeenCalledWith(200);
  expect((game as any).showFloatingScore).toHaveBeenCalledWith(130, 100, 200);
  expect((game as any).playSfx).toHaveBeenCalledWith(
    "maze_runner_ghost_eaten",
    { volume: 0.6 },
  );
  expect(target.setEnemyState).toHaveBeenCalledWith(EnemyState.DEAD);
});
```

Add these imports near the existing `Game.spec.ts` imports:

```ts
import { Direction } from "../../src/game/utils/DirectionUtils";
import { CellType, type MazeCell } from "../../src/game/utils/MazeGenerator";
```

Add this helper below `createMockEnemy`:

```ts
function gridFromPattern(pattern: string[]): MazeCell[][] {
  return pattern.map((row) =>
    [...row].map((ch) => ({
      type: ch === "." ? CellType.PASSAGE : CellType.WALL,
      visited: false,
    })),
  );
}
```

- [ ] **Step 5: Run Game test and verify the expected failure**

Run:

```bash
bun nx test maze-runner -- --run tests/scenes/Game.spec.ts
```

Expected: FAIL because `fireNullLance()` does not exist on `Game`.

- [ ] **Step 6: Implement Game.fireNullLance**

In `Game.ts`, import:

```ts
import { findNullLanceTarget } from "../utils/nullLance";
```

Add to the `HackSystem` context:

```ts
fireNullLance: () => this.fireNullLance(),
```

Add private helper:

```ts
private fireNullLance(): boolean {
  const target = findNullLanceTarget({
    grid: this.grid,
    gridWidth: this.gridWidth,
    gridHeight: this.gridHeight,
    tileSize: this.tileSize,
    offsetX: this.offsetX,
    offsetY: this.offsetY,
    player: {
      x: this.player.x,
      y: this.player.y,
      direction: this.player.getCurrentDirection(),
    },
    enemies: this.enemies,
  });

  if (!target) return false;

  this.defeatEnemyAsEaten(target);
  return true;
}

private defeatEnemyAsEaten(enemy: Enemy): void {
  this.addScore(200);
  this.ghostsEatenInPowerWindow++;
  if (this.ghostsEatenInPowerWindow >= 3) {
    completeAchievement("eat-3-ghosts-power-window");
  }
  this.showFloatingScore(enemy.x, enemy.y, 200);
  this.playSfx("maze_runner_ghost_eaten", { volume: 0.6 });
  enemy.setEnemyState(EnemyState.DEAD);
}
```

Refactor `resolveEnemyContact()` frightened branch to call:

```ts
this.defeatEnemyAsEaten(enemy);
```

- [ ] **Step 7: Run focused tests**

Run:

```bash
bun nx test maze-runner -- --run tests/game/HackSystem.spec.ts tests/scenes/Game.spec.ts tests/utils/nullLance.spec.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/maze-runner/src/game/systems/HackSystem.ts apps/maze-runner/src/game/scenes/Game.ts apps/maze-runner/tests/game/HackSystem.spec.ts apps/maze-runner/tests/scenes/Game.spec.ts
git commit -m "feat: fire null lance attack hack" -m "- Delegate Null Lance activation through HackSystem\n- Resolve line-of-sight hits in Game\n- Reuse eaten ghost scoring and return behavior"
```

---

### Task 7: Game Input, Full Pickup Rejection, And Dual Rounded HUD

**Files:**

- Modify: `apps/maze-runner/src/game/scenes/Game.ts`
- Modify: `apps/maze-runner/tests/scenes/Game.spec.ts`
- Modify: `apps/maze-runner/tests/helpers/createMockScene.ts`

- [ ] **Step 1: Write failing input and pickup rejection tests**

In `Game.spec.ts`, update the keyboard setup test so it expects both:

```ts
expect((game as any).input.keyboard.on).toHaveBeenCalledWith(
  "keydown-Q",
  expect.any(Function),
);
expect((game as any).input.keyboard.on).toHaveBeenCalledWith(
  "keydown-E",
  expect.any(Function),
);
```

Add a pickup rejection test:

```ts
it("leaves a hack pickup in the maze and shows FULL when its slot is occupied", () => {
  const game = new Game();
  const collectible = {
    x: 50,
    y: 60,
    getType: vi.fn(() => CollectibleType.HACK_PICKUP),
    getHackId: vi.fn(() => HackPickupId.SHIELD_RING),
  };
  (game as any).hackSystem = {
    collectHack: vi.fn(() => ({
      heldHack: HackPickupId.PHASE_CHIP,
      slot: "def",
      collected: false,
      full: true,
    })),
  };
  (game as any).collectibleManager = {
    removeCollectible: vi.fn(),
    shouldSpawnBonus: vi.fn(() => false),
    isLevelComplete: vi.fn(() => false),
  };
  (game as any).refreshHackHud = vi.fn();
  (game as any).showHackEffect = vi.fn();
  (game as any).playSfx = vi.fn();

  game.onCollectibleHit({}, collectible);

  expect(
    (game as any).collectibleManager.removeCollectible,
  ).not.toHaveBeenCalled();
  expect((game as any).showHackEffect).toHaveBeenCalledWith("FULL", 50, 60);
});
```

- [ ] **Step 2: Update Game.spec collectible mocks for hack pickups**

In the `vi.mock("../../src/game/objects/Collectible", ...)` block, add `HACK_PICKUP`:

```ts
CollectibleType: {
  DOT: "dot",
  POWER_PELLET: "power_pellet",
  BONUS_ITEM: "bonus_item",
  HACK_PICKUP: "hack_pickup",
},
```

Add this import near the existing `Game.spec.ts` imports:

```ts
import { HackPickupId } from "../../src/game/config/hackDefinitions";
```

- [ ] **Step 3: Run Game tests and verify expected failure**

Run:

```bash
bun nx test maze-runner -- --run tests/scenes/Game.spec.ts
```

Expected: FAIL because Q is not bound and full-slot rejection still removes the pickup.

- [ ] **Step 4: Add Q activation path**

In `Game.ts`, replace:

```ts
this.input.keyboard?.on("keydown-E", () => this.activateHeldHack());
```

with:

```ts
this.input.keyboard?.on("keydown-Q", () => this.activateHeldHack("def"));
this.input.keyboard?.on("keydown-E", () => this.activateHeldHack("atk"));
```

Change `activateHeldHack` signature:

```ts
private activateHeldHack(slot: HackSlot): void {
  const blocked =
    this.countdownActive ||
    this.deathSequenceActive ||
    this.levelTransitionActive ||
    this.player.isDyingState() ||
    this.scene.isActive("Pause");
  if (this.hackSystem?.activateHeldHack(slot, { blocked })) {
    this.refreshHackHud();
  }
}
```

Import `type HackSlot` from `hackDefinitions`.

- [ ] **Step 5: Preserve full pickup and show FULL**

In `onCollectibleHit`, replace the hack pickup branch with:

```ts
if (collectibleType === CollectibleType.HACK_PICKUP) {
  const hackId = collectible.getHackId();
  if (hackId) {
    const result = this.hackSystem?.collectHack(hackId);
    if (result?.full) {
      this.showHackEffect("FULL", collectible.x, collectible.y);
      this.playSfx("maze_runner_pellet", { volume: 0.25 });
      return;
    }
    this.refreshHackHud();
  }
  this.collectibleManager.removeCollectible(collectible);
  this.playSfx("maze_runner_pellet", { volume: 0.45 });
  return;
}
```

- [ ] **Step 6: Replace text-only hack HUD with two rounded command slots**

Keep this scoped and Phaser-native. Replace `private hackHudText!: Phaser.GameObjects.Text;` with:

```ts
private hackHudTexts: Partial<
  Record<
    HackSlot,
    {
      label: Phaser.GameObjects.Text;
      effect: Phaser.GameObjects.Text;
      key: Phaser.GameObjects.Text;
      background: Phaser.GameObjects.Graphics;
    }
  >
> = {};
```

Create two slots during `create()`:

```ts
this.createHackHudSlot("def", 20, camH - 58);
this.createHackHudSlot("atk", camW - 260, camH - 58);
```

Add helper:

```ts
private createHackHudSlot(slot: HackSlot, x: number, y: number): void {
  const color = slot === "def" ? 0x58f7ff : 0xff9b42;
  const fontFamily =
    (this.registry.get("fontFamily") as string) ?? "Orbitron";
  const background = this.add.graphics();
  background.fillStyle(0x050812, 0.9);
  background.lineStyle(1, color, 0.95);
  background.fillRoundedRect(x, y, 240, 48, 8);
  background.strokeRoundedRect(x, y, 240, 48, 8);
  background.setDepth(100);

  const label = this.add
    .text(x + 10, y + 7, "", {
      fontFamily,
      fontSize: "11px",
      color: slot === "def" ? "#58f7ff" : "#ff9b42",
    })
    .setDepth(101);
  const effect = this.add
    .text(x + 10, y + 25, "", {
      fontFamily,
      fontSize: "10px",
      color: "#ffffff",
    })
    .setDepth(101);
  const key = this.add
    .text(x + 205, y + 12, slot === "def" ? "Q" : "E", {
      fontFamily,
      fontSize: "16px",
      color: "#ffffff",
    })
    .setDepth(101);

  this.hackHudTexts[slot] = { label, effect, key, background };
}
```

Update `refreshHackHud()` to render each slot:

```ts
private refreshHackHud(): void {
  if (!this.hackSystem) return;
  this.refreshHackHudSlot("def");
  this.refreshHackHudSlot("atk");
}

private refreshHackHudSlot(slot: HackSlot): void {
  const hud = this.hackHudTexts[slot];
  if (!hud) return;

  const heldHack = this.hackSystem?.getHeldHack(slot) ?? null;
  const active = this.hackSystem
    ?.getActiveEffects()
    .find((effect) => {
      if (effect.id === "overclock-rebound") return slot === "atk";
      return getHackPickupDefinition(effect.id).slot === slot;
    });
  const slotLabel = slot === "def" ? "DEF HACK" : "ATK HACK";

  if (heldHack) {
    const definition = getHackPickupDefinition(heldHack);
    hud.label.setText(`${slotLabel}: ${definition.displayName}`);
    hud.effect.setText(definition.hudDescription);
    return;
  }

  if (active) {
    const label =
      active.id === "overclock-rebound"
        ? "SURGE"
        : getHackPickupDefinition(active.id).displayName;
    hud.label.setText(`${slotLabel}: ${label}`);
    hud.effect.setText(`${Math.ceil(active.remainingMs / 1000)}s`);
    return;
  }

  hud.label.setText(`${slotLabel}: EMPTY`);
  hud.effect.setText(slot === "def" ? "Q ready" : "E ready");
}
```

- [ ] **Step 7: Run focused Game tests**

Run:

```bash
bun nx test maze-runner -- --run tests/scenes/Game.spec.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/maze-runner/src/game/scenes/Game.ts apps/maze-runner/tests/scenes/Game.spec.ts apps/maze-runner/tests/helpers/createMockScene.ts
git commit -m "feat: add dual hack command hud" -m "- Bind Q for DEF hacks and E for ATK hacks\n- Preserve pickups when matching hack slot is full\n- Render rounded DEF and ATK command slots"
```

---

### Task 8: Boot Asset Loading And SVG Verification

**Files:**

- Modify: `apps/maze-runner/src/game/scenes/Boot.ts`
- Modify: `apps/maze-runner/tests/scenes/Boot.spec.ts`
- Assets: `apps/maze-runner/public/assets/vector/hacks/*.svg`

- [ ] **Step 1: Verify Boot test covers all hack definitions**

In `apps/maze-runner/tests/scenes/Boot.spec.ts`, add or update the hack asset assertion so it loops over `hackPickupDefinitions`:

```ts
for (const definition of hackPickupDefinitions) {
  expect(scene.load.text).toHaveBeenCalledWith(
    definition.svgCacheKey,
    definition.assetPath,
  );
}
```

- [ ] **Step 2: Run Boot test**

Run:

```bash
bun nx test maze-runner -- --run tests/scenes/Boot.spec.ts
```

Expected: PASS because Boot already loops over `hackPickupDefinitions`. Keep the expected path consistent with the existing asset-base-url expectations in `Boot.spec.ts`.

- [ ] **Step 3: Render every hack SVG**

Run:

```bash
mkdir -p test-results/vector-sprite-pipeline/hacks
for asset in apps/maze-runner/public/assets/vector/hacks/*.svg; do
  name="$(basename "$asset" .svg)"
  bun run libs/sprite-tools/src/bin/render-svg.ts "$asset" "test-results/vector-sprite-pipeline/hacks/${name}-raw.png"
done
```

Expected: every render command exits 0 and produces a PNG under `test-results/vector-sprite-pipeline/hacks/`.

- [ ] **Step 4: Run sprite parser tests**

Run:

```bash
bun nx test sprite-tools
```

Expected: PASS.

- [ ] **Step 5: Commit if Boot test changed**

If `Boot.spec.ts` changed, commit it:

```bash
git add apps/maze-runner/tests/scenes/Boot.spec.ts test-results/vector-sprite-pipeline/hacks
git commit -m "test: verify maze runner hack asset loading" -m "- Assert Boot loads every hack definition asset\n- Render hack SVG previews for sprite verification"
```

If only render artifacts were produced and the team does not want them committed, leave them untracked and record their paths in final verification notes.

---

### Task 9: Full Maze Runner Verification And Browser HUD Check

**Files:**

- No required source edits.
- Optional evidence: `test-results/browser-qa/maze-runner-hack-hud.png`

- [ ] **Step 1: Run the Maze Runner unit suite**

Run:

```bash
bun nx test maze-runner
```

Expected: PASS. If the process prints success but hangs until timeout, treat it as a regression and debug before continuing.

- [ ] **Step 2: Run typecheck**

Run:

```bash
bun nx run maze-runner:typecheck
```

Expected: PASS.

- [ ] **Step 3: Run build**

Run:

```bash
bun nx run maze-runner:build
```

Expected: PASS.

- [ ] **Step 4: Start the app for browser verification**

Run:

```bash
bun nx serve maze-runner
```

Expected: dev server starts on the configured Vite port, normally `http://localhost:4200`.

- [ ] **Step 5: Verify in browser**

Per repo debugging instructions, first check whether Chrome DevTools is available:

```bash
curl -s http://127.0.0.1:9222/json/version
```

If available, use the Chrome DevTools path. Otherwise use the in-app browser or Playwright. Verify:

- level 1 contains no hack pickups
- level 2 contains two hack pickups
- bottom-left slot reads `DEF HACK`
- bottom-right slot reads `ATK HACK`
- slots have rounded corners
- Q activates a held DEF hack
- E activates a held ATK hack
- walking over a second same-slot hack shows `FULL`
- Null Lance shows `MISS` on no target and defeats the first target in line when set up manually/debug-assisted

- [ ] **Step 6: Final status**

Run:

```bash
git status --short
```

Expected: only intended source/test changes are present, or the worktree is clean after commits. Do not revert unrelated existing `.omo` deletions or `.superpowers/` scratch files unless the user explicitly asks.

---

## Self-Review Checklist

- Spec coverage:
  - DEF/ATK slots: Tasks 4 and 7
  - Q/E activation: Tasks 4 and 7
  - full-slot rejection: Tasks 4 and 7
  - level 1 zero and level-based pools: Tasks 2 and 3
  - Null Lance: Tasks 1, 5, and 6
  - Signal Hack SVG asset: Tasks 1 and 8
  - browser/HUD verification: Task 9
- No new loadout system is introduced.
- Existing hack effects are preserved except for inventory and activation routing.
- All commands use `bun nx` for Nx tasks.
