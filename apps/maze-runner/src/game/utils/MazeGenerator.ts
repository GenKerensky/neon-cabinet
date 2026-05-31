export enum CellType {
  WALL = 0,
  PASSAGE = 1,
}

export interface MazeCell {
  type: CellType;
  visited: boolean;
}

export interface GridPosition {
  x: number;
  y: number;
}

/**
 * Candidate wall placement used by the upcoming open-first topology algorithm.
 * Coordinates are interior cells and `adjacentPassages` describes resulting local degree.
 */
export type GeneratedWallCandidate = GridPosition & {
  adjacentPassages: number;
};

/**
 * Set of interior coordinates that wall placement must not overwrite.
 * Key format: `${x},${y}`.
 */
export type ProtectedCellSet = Set<string>;

function pointKey(x: number, y: number): string {
  return `${x},${y}`;
}

export function buildProtectedCellSet(
  width: number,
  height: number,
): ProtectedCellSet {
  const protectedCells: ProtectedCellSet = new Set();
  if (width === 0 || height === 0) {
    return protectedCells;
  }

  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const markProtected = (x: number, y: number): void => {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      protectedCells.add(pointKey(x, y));
    }
  };

  for (let x = 0; x < width; x++) {
    protectedCells.add(pointKey(x, 0));
    protectedCells.add(pointKey(x, height - 1));
  }
  for (let y = 0; y < height; y++) {
    protectedCells.add(pointKey(0, y));
    protectedCells.add(pointKey(width - 1, y));
  }

  for (let y = centerY; y <= centerY + 1; y++) {
    for (let x = centerX - 1; x <= centerX + 1; x++) {
      markProtected(x, y);
    }
  }

  for (let x = centerX - 1; x <= centerX + 1; x++) {
    markProtected(x, centerY - 1);
  }

  for (let y = centerY; y <= centerY + 1; y++) {
    markProtected(centerX - 2, y);
    markProtected(centerX + 2, y);
  }

  markProtected(centerX - 1, centerY + 2);
  markProtected(centerX, centerY + 2);
  markProtected(centerX + 1, centerY + 2);

  for (let x = centerX - 2; x <= centerX + 2; x++) {
    markProtected(x, centerY - 2);
    markProtected(x, centerY + 3);
  }
  for (let y = centerY - 1; y <= centerY + 2; y++) {
    markProtected(centerX - 3, y);
    markProtected(centerX + 3, y);
  }

  return protectedCells;
}

export function getNormalGameplayCells<T>(
  grid: T[][],
  protectedCells: ProtectedCellSet,
): GridPosition[] {
  const cells: GridPosition[] = [];
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      if (protectedCells.has(pointKey(x, y))) {
        continue;
      }
      cells.push({ x, y });
    }
  }
  return cells;
}

export class MazeGenerator {
  /**
   * Open-first topology contract: keep at least this interior passage ratio after sparse wall placement.
   */
  static readonly MIN_INTERIOR_OPEN_RATIO = 0.6;

  /**
   * Open-first topology contract: guard rail for bounded wall placement search.
   */
  static readonly MAX_WALL_PLACEMENT_ATTEMPTS = 500;

  private grid: MazeCell[][] = [];
  private width: number;
  private height: number;
  private rng: () => number;
  private protectedCells: ProtectedCellSet = new Set();
  private generatedWallCells: GridPosition[] = [];

  /**
   * @param difficulty Controls maze dimensions.
   * @param stage Accepted for backward compatibility with existing callsites.
   * Topology rules are now contract-driven and no longer intended to be stage-gated
   * (including no dead-end enabling by stage).
   */
  constructor(difficulty = 1, stage = 1, rng: () => number = Math.random) {
    this.width = 21 + (difficulty - 1) * 2;
    this.height = 17 + (difficulty - 1) * 2;
    this.rng = rng;
    void stage;
  }

  /**
   * Generates a maze grid using the open-first no-dead-end algorithm.
   */
  create(): MazeCell[][] {
    this.initializeOpenInteriorGrid();
    this.applyProtectedStructures();
    this.placeSparseWalls();
    this.repairByOpeningWalls();
    this.validateFinalMazeOrFallback();
    return this.grid;
  }

  getGrid(): MazeCell[][] {
    return this.grid;
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  private initializeOpenInteriorGrid(): void {
    this.grid = [];
    for (let y = 0; y < this.height; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.width; x++) {
        const isBorder =
          x === 0 || y === 0 || x === this.width - 1 || y === this.height - 1;
        this.grid[y][x] = {
          type: isBorder ? CellType.WALL : CellType.PASSAGE,
          visited: false,
        };
      }
    }
  }

  private applyProtectedStructures(): void {
    this.createSpawnArea();
    this.createEnemyEnclosure();
    this.createPlayerSpawnArea();
    this.protectedCells = buildProtectedCellSet(this.width, this.height);
    this.generatedWallCells = [];
  }

  private placeSparseWalls(): void {
    const candidates = this.getInteriorNonProtectedCells();
    if (candidates.length === 0) {
      return;
    }

    let attempts = 0;
    while (attempts < MazeGenerator.MAX_WALL_PLACEMENT_ATTEMPTS) {
      attempts++;

      const candidate = candidates[Math.floor(this.rng() * candidates.length)];
      if (this.grid[candidate.y][candidate.x].type === CellType.WALL) {
        continue;
      }

      this.grid[candidate.y][candidate.x].type = CellType.WALL;
      const validation = this.validateInvariantState();

      if (validation.isValid) {
        this.generatedWallCells.push(candidate);
      } else {
        this.grid[candidate.y][candidate.x].type = CellType.PASSAGE;
      }
    }
  }

  private repairByOpeningWalls(): void {
    let guard = this.generatedWallCells.length * 3 + 10;
    while (guard > 0) {
      guard--;
      const validation = this.validateInvariantState();
      if (validation.isValid) {
        return;
      }

      const toOpen = this.findGeneratedWallAdjacentToViolations(
        validation.violationCells,
      );
      if (toOpen) {
        this.openGeneratedWall(toOpen.x, toOpen.y);
        continue;
      }

      const last = this.generatedWallCells[this.generatedWallCells.length - 1];
      if (!last) {
        return;
      }
      this.openGeneratedWall(last.x, last.y);
    }
  }

  private validateFinalMazeOrFallback(): void {
    const validation = this.validateInvariantState();
    if (validation.isValid) {
      return;
    }

    const acceptedWalls = [...this.generatedWallCells];
    this.initializeOpenInteriorGrid();
    this.applyProtectedStructures();

    for (const wall of acceptedWalls) {
      if (
        !this.isInterior(wall.x, wall.y) ||
        this.isProtectedCell(wall.x, wall.y)
      ) {
        continue;
      }

      this.grid[wall.y][wall.x].type = CellType.WALL;
      const nextValidation = this.validateInvariantState();
      if (nextValidation.isValid) {
        this.generatedWallCells.push({ x: wall.x, y: wall.y });
      } else {
        this.grid[wall.y][wall.x].type = CellType.PASSAGE;
      }
    }

    this.repairByOpeningWalls();
    if (!this.validateInvariantState().isValid) {
      this.initializeOpenInteriorGrid();
      this.applyProtectedStructures();
    }
  }

  private validateInvariantState(): {
    isValid: boolean;
    violationCells: GridPosition[];
  } {
    const degreeOne = this.countDegreeOnePassages();
    const pockets = this.findSingleEntryPockets();
    const openRatio = this.getInteriorOpenRatio();
    const wallBlocks = this.countForbiddenSolidWallBlocks();
    const connectivity = this.assertAllPassagesReachableFromPlayerSpawn();

    const violationCells: GridPosition[] = [];
    violationCells.push(...degreeOne.cells);
    for (const pocket of pockets) {
      violationCells.push(...pocket);
    }
    violationCells.push(...wallBlocks.cells);
    violationCells.push(...connectivity.unreachable);

    return {
      isValid:
        degreeOne.count === 0 &&
        pockets.length === 0 &&
        wallBlocks.count === 0 &&
        connectivity.connected &&
        openRatio >= MazeGenerator.MIN_INTERIOR_OPEN_RATIO,
      violationCells,
    };
  }

  private countDegreeOnePassages(): { count: number; cells: GridPosition[] } {
    let count = 0;
    const cells: GridPosition[] = [];
    for (const cell of getNormalGameplayCells(this.grid, this.protectedCells)) {
      if (this.grid[cell.y][cell.x].type !== CellType.PASSAGE) {
        continue;
      }

      const degree = this.getPassageNeighbors(cell.x, cell.y).length;
      if (degree === 1) {
        count++;
        cells.push(cell);
      }
    }

    return { count, cells };
  }

  private findSingleEntryPockets(): GridPosition[][] {
    const nodes = getNormalGameplayCells(this.grid, this.protectedCells).filter(
      (cell) => this.grid[cell.y][cell.x].type === CellType.PASSAGE,
    );
    const nodeKeys = new Set(
      nodes.map((cell) => this.pointKey(cell.x, cell.y)),
    );
    const adjacency = new Map<string, string[]>();

    for (const cell of nodes) {
      const key = this.pointKey(cell.x, cell.y);
      adjacency.set(
        key,
        this.getPassageNeighbors(cell.x, cell.y)
          .map((neighbor) => this.pointKey(neighbor.x, neighbor.y))
          .filter(
            (neighborKey) =>
              nodeKeys.has(neighborKey) &&
              !this.protectedCells.has(neighborKey),
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
          const lowKey = low.get(key);
          const lowNeighbor = low.get(neighbor);
          if (lowKey !== undefined && lowNeighbor !== undefined) {
            low.set(key, Math.min(lowKey, lowNeighbor));
          }

          if (parent.get(key) === null && childCount > 1) {
            articulation.add(key);
          }

          const lowN = low.get(neighbor);
          const discK = discovery.get(key);
          if (
            lowN !== undefined &&
            discK !== undefined &&
            parent.get(key) !== null &&
            lowN >= discK
          ) {
            articulation.add(key);
          }
        } else if (neighbor !== parent.get(key)) {
          const lowKey = low.get(key);
          const discNeighbor = discovery.get(neighbor);
          if (lowKey !== undefined && discNeighbor !== undefined) {
            low.set(key, Math.min(lowKey, discNeighbor));
          }
        }
      }
    };

    for (const key of adjacency.keys()) {
      if (visited.has(key)) {
        continue;
      }
      parent.set(key, null);
      dfs(key);
    }

    const pocketKeys = new Set<string>();
    const pockets: GridPosition[][] = [];

    for (const blockedKey of articulation) {
      const blocked = new Set([blockedKey]);
      const localSeen = new Set<string>();

      for (const seed of adjacency.get(blockedKey) ?? []) {
        if (blocked.has(seed) || localSeen.has(seed)) {
          continue;
        }

        const stack = [seed];
        const componentKeys: string[] = [];
        localSeen.add(seed);

        while (stack.length > 0) {
          const current = stack.pop();
          if (!current) break;
          componentKeys.push(current);

          for (const next of adjacency.get(current) ?? []) {
            if (blocked.has(next) || localSeen.has(next)) {
              continue;
            }
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
                .map((point) => {
                  const [x, y] = point.split(",").map(Number);
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

  private getInteriorOpenRatio(): number {
    const cells = getNormalGameplayCells(this.grid, this.protectedCells);
    if (cells.length === 0) {
      return 0;
    }

    const openCells = cells.filter(
      (cell) => this.grid[cell.y][cell.x].type === CellType.PASSAGE,
    ).length;
    return openCells / cells.length;
  }

  private countForbiddenSolidWallBlocks(): {
    count: number;
    cells: GridPosition[];
  } {
    let count = 0;
    const cells: GridPosition[] = [];

    for (let y = 0; y < this.height - 1; y++) {
      for (let x = 0; x < this.width - 1; x++) {
        const block = [
          this.pointKey(x, y),
          this.pointKey(x + 1, y),
          this.pointKey(x, y + 1),
          this.pointKey(x + 1, y + 1),
        ];

        if (block.some((key) => this.protectedCells.has(key))) {
          continue;
        }

        if (
          this.grid[y][x].type === CellType.WALL &&
          this.grid[y][x + 1].type === CellType.WALL &&
          this.grid[y + 1][x].type === CellType.WALL &&
          this.grid[y + 1][x + 1].type === CellType.WALL
        ) {
          count++;
          cells.push(
            { x, y },
            { x: x + 1, y },
            { x, y: y + 1 },
            { x: x + 1, y: y + 1 },
          );
        }
      }
    }

    return { count, cells };
  }

  private assertAllPassagesReachableFromPlayerSpawn(): {
    connected: boolean;
    unreachable: GridPosition[];
  } {
    const startX = Math.floor(this.width / 2);
    const startY = this.height - 3;
    if (this.grid[startY]?.[startX]?.type !== CellType.PASSAGE) {
      return { connected: false, unreachable: [{ x: startX, y: startY }] };
    }

    const visited = new Set<string>();
    const queue: GridPosition[] = [{ x: startX, y: startY }];
    visited.add(this.pointKey(startX, startY));

    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;
      const { x, y } = item;
      for (const neighbor of this.getPassageNeighbors(x, y)) {
        const key = this.pointKey(neighbor.x, neighbor.y);
        if (visited.has(key)) {
          continue;
        }
        visited.add(key);
        queue.push(neighbor);
      }
    }

    const unreachable: GridPosition[] = [];
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[y][x].type !== CellType.PASSAGE) {
          continue;
        }
        if (!visited.has(this.pointKey(x, y))) {
          unreachable.push({ x, y });
        }
      }
    }

    return { connected: unreachable.length === 0, unreachable };
  }

  private getInteriorNonProtectedCells(): GridPosition[] {
    const cells: GridPosition[] = [];
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        if (this.isProtectedCell(x, y)) {
          continue;
        }
        cells.push({ x, y });
      }
    }
    return cells;
  }

  private isProtectedCell(x: number, y: number): boolean {
    return this.protectedCells.has(this.pointKey(x, y));
  }

  private isInterior(x: number, y: number): boolean {
    return x > 0 && x < this.width - 1 && y > 0 && y < this.height - 1;
  }

  private pointKey(x: number, y: number): string {
    return `${x},${y}`;
  }

  private openGeneratedWall(x: number, y: number): void {
    this.grid[y][x].type = CellType.PASSAGE;
    this.generatedWallCells = this.generatedWallCells.filter(
      (cell) => cell.x !== x || cell.y !== y,
    );
  }

  private findGeneratedWallAdjacentToViolations(
    violationCells: GridPosition[],
  ): GridPosition | null {
    if (violationCells.length === 0) {
      return null;
    }

    for (const wall of [...this.generatedWallCells].reverse()) {
      for (const violation of violationCells) {
        const dx = Math.abs(wall.x - violation.x);
        const dy = Math.abs(wall.y - violation.y);
        if (dx + dy === 1) {
          return wall;
        }
      }
    }

    return null;
  }

  private createSpawnArea(): void {
    const centerX = Math.floor(this.width / 2);
    const centerY = Math.floor(this.height / 2);

    for (let y = centerY - 2; y <= centerY + 4; y++) {
      for (let x = centerX - 3; x <= centerX + 3; x++) {
        if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
          this.grid[y][x].type = CellType.PASSAGE;
        }
      }
    }
  }

  private createPlayerSpawnArea(): void {
    const centerX = Math.floor(this.width / 2);
    const spawnY = this.height - 3;

    for (let y = spawnY - 1; y <= spawnY + 1; y++) {
      for (let x = centerX - 1; x <= centerX + 1; x++) {
        if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
          this.grid[y][x].type = CellType.PASSAGE;
        }
      }
    }
  }

  private createEnemyEnclosure(): void {
    const centerX = Math.floor(this.width / 2);
    const centerY = Math.floor(this.height / 2);

    // Interior of enclosure (passage for enemies to walk inside)
    for (let y = centerY; y <= centerY + 1; y++) {
      for (let x = centerX - 1; x <= centerX + 1; x++) {
        this.grid[y][x].type = CellType.PASSAGE;
      }
    }

    this.grid[centerY - 1][centerX - 1].type = CellType.WALL;
    this.grid[centerY - 1][centerX].type = CellType.PASSAGE;
    this.grid[centerY - 1][centerX + 1].type = CellType.WALL;

    // Left wall
    this.grid[centerY][centerX - 2].type = CellType.WALL;
    this.grid[centerY + 1][centerX - 2].type = CellType.WALL;

    // Right wall
    this.grid[centerY][centerX + 2].type = CellType.WALL;
    this.grid[centerY + 1][centerX + 2].type = CellType.WALL;

    this.grid[centerY + 2][centerX - 1].type = CellType.WALL;
    this.grid[centerY + 2][centerX].type = CellType.WALL;
    this.grid[centerY + 2][centerX + 1].type = CellType.WALL;

    // Clear passage ring immediately outside the enclosure walls
    // Ring above top wall
    if (centerY - 2 >= 0) {
      for (let x = centerX - 2; x <= centerX + 2; x++) {
        this.grid[centerY - 2][x].type = CellType.PASSAGE;
      }
    }
    // Ring below bottom wall
    if (centerY + 3 < this.height) {
      for (let x = centerX - 2; x <= centerX + 2; x++) {
        this.grid[centerY + 3][x].type = CellType.PASSAGE;
      }
      this.grid[centerY + 3][centerX - 3].type = CellType.PASSAGE;
      this.grid[centerY + 3][centerX + 3].type = CellType.PASSAGE;
    }
    // Ring left of left wall
    for (let y = centerY - 1; y <= centerY + 2; y++) {
      if (centerX - 3 >= 0) {
        this.grid[y][centerX - 3].type = CellType.PASSAGE;
      }
    }
    // Ring right of right wall
    for (let y = centerY - 1; y <= centerY + 2; y++) {
      if (centerX + 3 < this.width) {
        this.grid[y][centerX + 3].type = CellType.PASSAGE;
      }
    }
  }

  private getPassageNeighbors(
    x: number,
    y: number,
  ): { x: number; y: number }[] {
    const neighbors: { x: number; y: number }[] = [];
    const dirs = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
    ];
    for (const dir of dirs) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;
      if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
        if (this.grid[ny][nx].type === CellType.PASSAGE) {
          neighbors.push({ x: nx, y: ny });
        }
      }
    }
    return neighbors;
  }
}
