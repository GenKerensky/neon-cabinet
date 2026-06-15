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

  const shuffled = [...candidates].sort(() => rng() - 0.5);
  const slotBalancedPool = buildSlotBalancedPool(plan.pool);
  const targetCount = Math.min(plan.count, shuffled.length);
  const selected: HackPickupPlacement[] = [];

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
