import { describe, it, expect } from "vitest";
import {
  MazeGenerator,
  CellType,
  buildProtectedCellSet,
  getNormalGameplayCells,
} from "../../src/game/utils/MazeGenerator";

export type Point = { x: number; y: number };
type GridCell = { type: CellType };
type Grid = GridCell[][];

function pointKey(x: number, y: number): string {
  return `${x},${y}`;
}

function getPowerPelletPositions(width: number, height: number): Point[] {
  return [
    { x: 1, y: 1 },
    { x: width - 2, y: 1 },
    { x: 1, y: height - 2 },
    { x: width - 2, y: height - 2 },
  ];
}

function gridFromPattern(pattern: string[]): Grid {
  return pattern.map((row) =>
    [...row].map((ch) => ({
      type: ch === "." ? CellType.PASSAGE : CellType.WALL,
    })),
  );
}

export function getPassageNeighbors(grid: Grid, x: number, y: number): Point[] {
  const neighbors: Point[] = [];

  for (const [dx, dy] of [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ]) {
    const nx = x + dx;
    const ny = y + dy;
    if (
      ny >= 0 &&
      ny < grid.length &&
      nx >= 0 &&
      nx < grid[0].length &&
      grid[ny][nx].type === CellType.PASSAGE
    ) {
      neighbors.push({ x: nx, y: ny });
    }
  }

  return neighbors;
}

export function withMockedRandom(sequence: number[], run: () => void): void {
  const original = Math.random;
  let idx = 0;
  Math.random = () => {
    const value = sequence[idx] ?? sequence[sequence.length - 1] ?? 0;
    idx++;
    return value;
  };

  try {
    run();
  } finally {
    Math.random = original;
  }
}

export function createMazeForStage(difficulty: number, stage: number) {
  const MazeGeneratorCtor = MazeGenerator as unknown as new (
    difficulty: number,
    stage?: number,
  ) => MazeGenerator;
  const gen = new MazeGeneratorCtor(difficulty, stage);
  const grid = gen.create();
  return { gen, grid };
}

export function countDegreeOnePassages(grid: Grid): number {
  const protectedCells = buildProtectedCellSet(
    grid[0]?.length ?? 0,
    grid.length,
  );
  let count = 0;

  for (const cell of getNormalGameplayCells(grid, protectedCells)) {
    if (grid[cell.y][cell.x].type !== CellType.PASSAGE) continue;

    const degree = getPassageNeighbors(grid, cell.x, cell.y).length;

    if (degree === 1) count++;
  }

  return count;
}

export function assertAllPassagesReachableFromPlayerSpawn(grid: Grid): void {
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  const startX = Math.floor(width / 2);
  const startY = height - 3;

  expect(grid[startY]?.[startX]?.type).toBe(CellType.PASSAGE);

  const visited = new Set<string>();
  const queue: Point[] = [{ x: startX, y: startY }];
  visited.add(pointKey(startX, startY));

  while (queue.length > 0) {
    const { x, y } = queue.shift()!;
    for (const neighbor of getPassageNeighbors(grid, x, y)) {
      const key = pointKey(neighbor.x, neighbor.y);
      if (visited.has(key)) continue;
      visited.add(key);
      queue.push(neighbor);
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x].type !== CellType.PASSAGE) continue;
      expect(visited.has(pointKey(x, y))).toBe(true);
    }
  }
}

export function findSingleEntryPockets(grid: Grid): Point[][] {
  const protectedCells = buildProtectedCellSet(
    grid[0]?.length ?? 0,
    grid.length,
  );
  const nodes = getNormalGameplayCells(grid, protectedCells).filter(
    (cell) => grid[cell.y][cell.x].type === CellType.PASSAGE,
  );
  const nodeKeys = new Set(nodes.map((cell) => pointKey(cell.x, cell.y)));
  const adjacency = new Map<string, string[]>();

  for (const cell of nodes) {
    adjacency.set(
      pointKey(cell.x, cell.y),
      getPassageNeighbors(grid, cell.x, cell.y)
        .map((neighbor) => pointKey(neighbor.x, neighbor.y))
        .filter(
          (neighborKey) =>
            nodeKeys.has(neighborKey) && !protectedCells.has(neighborKey),
        ),
    );
  }

  const visited = new Set<string>();
  const discovery = new Map<string, number>();
  const low = new Map<string, number>();
  const parent = new Map<string, string | null>();
  const articulation = new Set<string>();
  let time = 0;

  const dfs = (key: string): void => {
    visited.add(key);
    discovery.set(key, ++time);
    low.set(key, time);
    let childCount = 0;

    for (const neighbor of adjacency.get(key) ?? []) {
      if (!visited.has(neighbor)) {
        parent.set(neighbor, key);
        childCount++;
        dfs(neighbor);
        low.set(key, Math.min(low.get(key)!, low.get(neighbor)!));

        if (parent.get(key) === null && childCount > 1) {
          articulation.add(key);
        }

        if (
          parent.get(key) !== null &&
          low.get(neighbor)! >= discovery.get(key)!
        ) {
          articulation.add(key);
        }
      } else if (neighbor !== parent.get(key)) {
        low.set(key, Math.min(low.get(key)!, discovery.get(neighbor)!));
      }
    }
  };

  for (const key of adjacency.keys()) {
    if (visited.has(key)) continue;
    parent.set(key, null);
    dfs(key);
  }

  const pocketKeys = new Set<string>();
  const pockets: Point[][] = [];

  for (const blockedKey of articulation) {
    const blocked = new Set([blockedKey]);
    const localSeen = new Set<string>();

    for (const seed of adjacency.get(blockedKey) ?? []) {
      if (blocked.has(seed) || localSeen.has(seed)) continue;

      const stack = [seed];
      const componentKeys: string[] = [];
      localSeen.add(seed);

      while (stack.length > 0) {
        const current = stack.pop()!;
        componentKeys.push(current);

        for (const next of adjacency.get(current) ?? []) {
          if (blocked.has(next) || localSeen.has(next)) continue;
          localSeen.add(next);
          stack.push(next);
        }
      }

      const componentSet = new Set(componentKeys);
      const internalDegrees = componentKeys.map(
        (key) =>
          (adjacency.get(key) ?? []).filter((neighbor) =>
            componentSet.has(neighbor),
          ).length,
      );
      const internalEdgeCount =
        internalDegrees.reduce((sum, degree) => sum + degree, 0) / 2;

      if (
        componentKeys.length >= 4 &&
        internalEdgeCount >= componentKeys.length &&
        internalDegrees.every((degree) => degree >= 2)
      ) {
        const pocketKey = [...componentKeys].sort().join("|");
        if (!pocketKeys.has(pocketKey)) {
          pocketKeys.add(pocketKey);
          pockets.push(
            componentKeys
              .map((key) => {
                const [x, y] = key.split(",").map(Number);
                return { x, y };
              })
              .sort((a, b) => a.y - b.y || a.x - b.x),
          );
        }
      }
    }
  }

  return pockets;
}

export function getInteriorOpenRatio(grid: Grid): number {
  const protectedCells = buildProtectedCellSet(
    grid[0]?.length ?? 0,
    grid.length,
  );
  const cells = getNormalGameplayCells(grid, protectedCells);
  if (cells.length === 0) return 0;

  const openCells = cells.filter(
    (cell) => grid[cell.y][cell.x].type === CellType.PASSAGE,
  ).length;
  return openCells / cells.length;
}

export function countForbiddenSolidWallBlocks(grid: Grid): number {
  const protectedCells = buildProtectedCellSet(
    grid[0]?.length ?? 0,
    grid.length,
  );
  let count = 0;

  for (let y = 0; y < grid.length - 1; y++) {
    for (let x = 0; x < grid[0].length - 1; x++) {
      const blockKeys = [
        pointKey(x, y),
        pointKey(x + 1, y),
        pointKey(x, y + 1),
        pointKey(x + 1, y + 1),
      ];

      if (blockKeys.some((key) => protectedCells.has(key))) continue;

      if (
        grid[y][x].type === CellType.WALL &&
        grid[y][x + 1].type === CellType.WALL &&
        grid[y + 1][x].type === CellType.WALL &&
        grid[y + 1][x + 1].type === CellType.WALL
      ) {
        count++;
      }
    }
  }

  return count;
}

function makeAllWallGrid(width: number, height: number): Grid {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({ type: CellType.WALL })),
  );
}

function makeAllPassageGrid(width: number, height: number): Grid {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({ type: CellType.PASSAGE })),
  );
}

function createSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function getEnclosureGeometryFromGrid(grid: Grid): {
  cx: number;
  cy: number;
  ringCells: Point[];
} {
  const width = grid[0]?.length ?? 0;
  const height = grid.length;
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  const ring = new Map<string, Point>();

  for (let x = cx - 2; x <= cx + 2; x++) {
    ring.set(pointKey(x, cy - 2), { x, y: cy - 2 });
    ring.set(pointKey(x, cy + 3), { x, y: cy + 3 });
  }

  for (let y = cy - 1; y <= cy + 2; y++) {
    ring.set(pointKey(cx - 3, y), { x: cx - 3, y });
    ring.set(pointKey(cx + 3, y), { x: cx + 3, y });
  }

  return { cx, cy, ringCells: [...ring.values()] };
}

function assertBorderWalls(grid: Grid): void {
  const width = grid[0]?.length ?? 0;
  const height = grid.length;

  for (let x = 0; x < width; x++) {
    expect(grid[0][x].type).toBe(CellType.WALL);
    expect(grid[height - 1][x].type).toBe(CellType.WALL);
  }

  for (let y = 0; y < height; y++) {
    expect(grid[y][0].type).toBe(CellType.WALL);
    expect(grid[y][width - 1].type).toBe(CellType.WALL);
  }
}

function assertEnclosureAndSpawnContract(grid: Grid): void {
  const { cx, cy, ringCells } = getEnclosureGeometryFromGrid(grid);

  for (let y = cy; y <= cy + 1; y++) {
    for (let x = cx - 1; x <= cx + 1; x++) {
      expect(grid[y][x].type).toBe(CellType.PASSAGE);
    }
  }

  for (let x = cx - 1; x <= cx + 1; x++) {
    expect(grid[cy - 1][x].type).toBe(
      x === cx ? CellType.PASSAGE : CellType.WALL,
    );
  }

  for (let y = cy; y <= cy + 1; y++) {
    expect(grid[y][cx - 2].type).toBe(CellType.WALL);
    expect(grid[y][cx + 2].type).toBe(CellType.WALL);
  }

  expect(grid[cy + 2][cx - 1].type).toBe(CellType.WALL);
  expect(grid[cy + 2][cx + 1].type).toBe(CellType.WALL);
  expect(grid[cy + 2][cx].type).toBe(CellType.WALL);

  for (const { x, y } of ringCells) {
    expect(grid[y][x].type).toBe(CellType.PASSAGE);
  }

  const spawnX = Math.floor((grid[0]?.length ?? 0) / 2);
  const spawnY = grid.length - 3;
  expect(grid[spawnY]?.[spawnX]?.type).toBe(CellType.PASSAGE);
}

describe("topology taxonomy helpers", () => {
  it("counts classic dead-end passages outside protected cells", () => {
    const grid = makeAllWallGrid(13, 13);
    const protectedCells = buildProtectedCellSet(
      grid[0]?.length ?? 0,
      grid.length,
    );

    for (const [x, y] of [
      [1, 1],
      [2, 1],
      [3, 1],
      [1, 2],
      [3, 2],
      [1, 3],
      [2, 3],
      [3, 3],
      [4, 2],
    ] as Array<[number, number]>) {
      grid[y][x].type = CellType.PASSAGE;
    }

    expect(
      getNormalGameplayCells(grid, protectedCells).some(
        (cell) => cell.x === 6 && cell.y === 6,
      ),
    ).toBe(false);
    expect(countDegreeOnePassages(grid)).toBe(1);
  });

  it("detects a single-entry loop pocket connected by one choke point", () => {
    const grid = makeAllWallGrid(19, 19);

    for (const [x, y] of [
      [2, 2],
      [3, 2],
      [4, 2],
      [2, 3],
      [4, 3],
      [2, 4],
      [3, 4],
      [4, 4],
      [5, 3],
      [6, 3],
      [7, 3],
    ] as Array<[number, number]>) {
      grid[y][x].type = CellType.PASSAGE;
    }

    const pockets = findSingleEntryPockets(grid);

    expect(pockets).toHaveLength(1);
    expect(pockets[0]).toHaveLength(8);
    expect(pockets[0]).toContainEqual({ x: 2, y: 2 });
    expect(pockets[0]).toContainEqual({ x: 4, y: 4 });
  });

  it("excludes protected cells from wall-clump counts", () => {
    const grid = makeAllPassageGrid(15, 15);

    for (let x = 0; x < 15; x++) {
      grid[0][x].type = CellType.WALL;
      grid[14][x].type = CellType.WALL;
    }
    for (let y = 0; y < 15; y++) {
      grid[y][0].type = CellType.WALL;
      grid[y][14].type = CellType.WALL;
    }

    for (const [x, y] of [
      [2, 2],
      [3, 2],
      [2, 3],
      [3, 3],
      [12, 1],
      [13, 1],
      [12, 2],
      [13, 2],
    ] as Array<[number, number]>) {
      grid[y][x].type = CellType.WALL;
    }

    expect(countForbiddenSolidWallBlocks(grid)).toBe(1);
  });

  it("reports the interior open ratio for a fully open gameplay area", () => {
    const grid = gridFromPattern([
      "WWWWWWW",
      "W.....W",
      "W.....W",
      "W.....W",
      "W.....W",
      "W.....W",
      "WWWWWWW",
    ]);

    expect(getInteriorOpenRatio(grid)).toBe(1);
  });

  it("confirms all passages are reachable from the player spawn", () => {
    const grid = gridFromPattern([
      "WWWWWWW",
      "W.....W",
      "W.....W",
      "W.....W",
      "W.....W",
      "W.....W",
      "WWWWWWW",
    ]);

    expect(() => assertAllPassagesReachableFromPlayerSpawn(grid)).not.toThrow();
  });
});

describe("MazeGenerator", () => {
  describe("grid dimensions", () => {
    it("difficulty 1 creates 21x17 grid", () => {
      const gen = new MazeGenerator(1);
      const grid = gen.create();
      expect(grid.length).toBe(17);
      expect(grid[0].length).toBe(21);
    });

    it("difficulty 2 creates 23x19 grid", () => {
      const gen = new MazeGenerator(2);
      const grid = gen.create();
      expect(grid.length).toBe(19);
      expect(grid[0].length).toBe(23);
    });

    it("difficulty 3 creates 25x21 grid", () => {
      const gen = new MazeGenerator(3);
      const grid = gen.create();
      expect(grid.length).toBe(21);
      expect(grid[0].length).toBe(25);
    });

    it("difficulty 4 creates 27x23 grid", () => {
      const gen = new MazeGenerator(4);
      const grid = gen.create();
      expect(grid.length).toBe(23);
      expect(grid[0].length).toBe(27);
    });

    it("difficulty 5 creates 29x25 grid", () => {
      const gen = new MazeGenerator(5);
      const grid = gen.create();
      expect(grid.length).toBe(25);
      expect(grid[0].length).toBe(29);
    });
  });

  describe("border cells", () => {
    it("top row is all walls", () => {
      const gen = new MazeGenerator(1);
      const grid = gen.create();
      for (let x = 0; x < gen.getWidth(); x++) {
        expect(grid[0][x].type).toBe(CellType.WALL);
      }
    });

    it("bottom row is all walls", () => {
      const gen = new MazeGenerator(1);
      const grid = gen.create();
      const h = gen.getHeight();
      for (let x = 0; x < gen.getWidth(); x++) {
        expect(grid[h - 1][x].type).toBe(CellType.WALL);
      }
    });

    it("left column is all walls", () => {
      const gen = new MazeGenerator(1);
      const grid = gen.create();
      for (let y = 0; y < gen.getHeight(); y++) {
        expect(grid[y][0].type).toBe(CellType.WALL);
      }
    });

    it("right column is all walls", () => {
      const gen = new MazeGenerator(1);
      const grid = gen.create();
      const w = gen.getWidth();
      for (let y = 0; y < gen.getHeight(); y++) {
        expect(grid[y][w - 1].type).toBe(CellType.WALL);
      }
    });
  });

  describe("interior cell types", () => {
    it("interior has both WALL and PASSAGE cells", () => {
      const gen = new MazeGenerator(1);
      const grid = gen.create();
      let hasWall = false;
      let hasPassage = false;
      for (let y = 1; y < gen.getHeight() - 1; y++) {
        for (let x = 1; x < gen.getWidth() - 1; x++) {
          if (grid[y][x].type === CellType.WALL) hasWall = true;
          if (grid[y][x].type === CellType.PASSAGE) hasPassage = true;
        }
      }
      expect(hasWall).toBe(true);
      expect(hasPassage).toBe(true);
    });

    it("keeps all power pellet positions passable", () => {
      const gen = new MazeGenerator(1);
      const grid = gen.create();

      for (const position of getPowerPelletPositions(
        gen.getWidth(),
        gen.getHeight(),
      )) {
        expect(grid[position.y][position.x].type).toBe(CellType.PASSAGE);
      }
    });
  });

  describe("passage connectivity", () => {
    it("all passages are reachable via BFS from center", () => {
      const gen = new MazeGenerator(1);
      const grid = gen.create();
      const w = gen.getWidth();
      const h = gen.getHeight();
      const cx = Math.floor(w / 2);
      const cy = Math.floor(h / 2);

      const visited = new Set<string>();
      const queue: { x: number; y: number }[] = [{ x: cx, y: cy }];
      visited.add(`${cx},${cy}`);

      while (queue.length > 0) {
        const { x, y } = queue.shift()!;
        for (const [dx, dy] of [
          [0, -1],
          [0, 1],
          [-1, 0],
          [1, 0],
        ]) {
          const nx = x + dx;
          const ny = y + dy;
          const key = `${nx},${ny}`;
          if (
            nx >= 0 &&
            nx < w &&
            ny >= 0 &&
            ny < h &&
            !visited.has(key) &&
            grid[ny][nx].type === CellType.PASSAGE
          ) {
            visited.add(key);
            queue.push({ x: nx, y: ny });
          }
        }
      }

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (grid[y][x].type === CellType.PASSAGE) {
            expect(visited.has(`${x},${y}`)).toBe(true);
          }
        }
      }
    });
  });

  describe("enemy enclosure", () => {
    it("enemy enclosure contract is preserved", () => {
      const gen = new MazeGenerator(1);
      const grid = gen.create();
      assertEnclosureAndSpawnContract(grid);
      const { cx, cy } = getEnclosureGeometryFromGrid(grid);

      expect(grid[cy - 1][cx].type).toBe(CellType.PASSAGE);
      expect(grid[cy + 2][cx].type).toBe(CellType.WALL);
    });

    it("enclosure ring has no adjacent dead ends", () => {
      const rng = createSeededRng(42);
      const gen = new MazeGenerator(1, 1, rng);
      const grid = gen.create();
      const { ringCells } = getEnclosureGeometryFromGrid(grid);
      const protectedCells = buildProtectedCellSet(
        grid[0]?.length ?? 0,
        grid.length,
      );

      const deadEndsAdjacentToRing = getNormalGameplayCells(
        grid,
        protectedCells,
      ).filter((cell) => {
        const degree = getPassageNeighbors(grid, cell.x, cell.y).length;

        if (degree !== 1) {
          return false;
        }

        return ringCells.some(
          (ringCell) =>
            Math.max(
              Math.abs(cell.x - ringCell.x),
              Math.abs(cell.y - ringCell.y),
            ) <= 1,
        );
      });

      expect(deadEndsAdjacentToRing).toHaveLength(0);
    });

    it("enclosure ring is reachable from player spawn", () => {
      const gen = new MazeGenerator(1);
      const grid = gen.create();
      const { ringCells } = getEnclosureGeometryFromGrid(grid);

      const startX = Math.floor(gen.getWidth() / 2);
      const startY = gen.getHeight() - 3;
      expect(grid[startY][startX].type).toBe(CellType.PASSAGE);

      const visited = new Set<string>([pointKey(startX, startY)]);
      const queue: Point[] = [{ x: startX, y: startY }];

      while (queue.length > 0) {
        const current = queue.shift()!;
        for (const neighbor of getPassageNeighbors(
          grid,
          current.x,
          current.y,
        )) {
          const key = pointKey(neighbor.x, neighbor.y);
          if (visited.has(key)) {
            continue;
          }
          visited.add(key);
          queue.push(neighbor);
        }
      }

      for (const ringCell of ringCells) {
        expect(grid[ringCell.y][ringCell.x].type).toBe(CellType.PASSAGE);
        expect(visited.has(pointKey(ringCell.x, ringCell.y))).toBe(true);
      }
    });

    it("has no single-entry pocket violations around protected structures", () => {
      const gen = new MazeGenerator(1);
      const grid = gen.create();
      const pockets = findSingleEntryPockets(grid);

      expect(pockets).toHaveLength(0);
    });
  });

  describe("deterministic topology invariants", () => {
    const difficulties = [1, 2, 3] as const;
    const stages = [1, 2, 3, 5] as const;
    const seeds = [1, 17, 42, 1337, 2026] as const;
    const combinations = difficulties.flatMap((difficulty) =>
      stages.flatMap((stage) =>
        seeds.map((seed) => ({ difficulty, stage, seed })),
      ),
    );

    it.each(combinations)(
      "difficulty=$difficulty stage=$stage seed=$seed preserves structural invariants",
      ({ difficulty, stage, seed }) => {
        const rng = createSeededRng(seed);
        const gen = new MazeGenerator(difficulty, stage, rng);
        const grid = gen.create();

        expect(countDegreeOnePassages(grid)).toBe(0);
        expect(() =>
          assertAllPassagesReachableFromPlayerSpawn(grid),
        ).not.toThrow();
        expect(findSingleEntryPockets(grid)).toHaveLength(0);
        expect(getInteriorOpenRatio(grid)).toBeGreaterThanOrEqual(0.6);
        expect(countForbiddenSolidWallBlocks(grid)).toBe(0);
        assertBorderWalls(grid);
        assertEnclosureAndSpawnContract(grid);
        for (const position of getPowerPelletPositions(
          gen.getWidth(),
          gen.getHeight(),
        )) {
          expect(grid[position.y][position.x].type).toBe(CellType.PASSAGE);
        }
      },
    );
  });
});
