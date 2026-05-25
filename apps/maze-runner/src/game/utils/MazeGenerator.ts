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

export class MazeGenerator {
  private grid: MazeCell[][] = [];
  private width: number;
  private height: number;

  constructor(difficulty = 1) {
    this.width = 21 + (difficulty - 1) * 2;
    this.height = 17 + (difficulty - 1) * 2;
  }

  create(): MazeCell[][] {
    this.initializeGrid();
    this.generateMaze(1, 1);
    this.reduceDeadEnds();
    this.createSpawnArea();
    this.createEnemyEnclosure();
    this.createPlayerSpawnArea();
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

  private initializeGrid(): void {
    this.grid = [];
    for (let y = 0; y < this.height; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.grid[y][x] = {
          type: CellType.WALL,
          visited: false,
        };
      }
    }
  }

  private generateMaze(startX: number, startY: number): void {
    const stack: GridPosition[] = [{ x: startX, y: startY }];
    this.grid[startY][startX].type = CellType.PASSAGE;
    this.grid[startY][startX].visited = true;

    const directions = [
      { dx: 0, dy: -2 },
      { dx: 0, dy: 2 },
      { dx: -2, dy: 0 },
      { dx: 2, dy: 0 },
    ];

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const neighbors = this.getUnvisitedNeighbors(
        current.x,
        current.y,
        directions,
      );

      if (neighbors.length > 0) {
        const chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
        this.carvePath(current.x, current.y, chosen.x, chosen.y);
        stack.push(chosen);
      } else {
        stack.pop();
      }
    }
  }

  private getUnvisitedNeighbors(
    x: number,
    y: number,
    directions: { dx: number; dy: number }[],
  ): GridPosition[] {
    const neighbors: GridPosition[] = [];

    for (const dir of directions) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;

      if (
        nx > 0 &&
        nx < this.width - 1 &&
        ny > 0 &&
        ny < this.height - 1 &&
        !this.grid[ny][nx].visited
      ) {
        neighbors.push({ x: nx, y: ny });
      }
    }

    return neighbors;
  }

  private carvePath(x1: number, y1: number, x2: number, y2: number): void {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    this.grid[midY][midX].type = CellType.PASSAGE;
    this.grid[midY][midX].visited = true;
    this.grid[y2][x2].type = CellType.PASSAGE;
    this.grid[y2][x2].visited = true;
  }

  private reduceDeadEnds(): void {
    const deadEnds: {
      x: number;
      y: number;
      backtrackDir: { dx: number; dy: number };
    }[] = [];

    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        if (this.grid[y][x].type === CellType.PASSAGE) {
          const neighbors = this.getPassageNeighbors(x, y);
          if (neighbors.length === 1) {
            const neighbor = neighbors[0];
            const backtrackDir = { dx: neighbor.x - x, dy: neighbor.y - y };
            deadEnds.push({ x, y, backtrackDir });
          }
        }
      }
    }

    for (const deadEnd of deadEnds) {
      const { x, y, backtrackDir } = deadEnd;
      const oppositeDirs = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
      ].filter((d) => !(d.dx === backtrackDir.dx && d.dy === backtrackDir.dy));

      for (const dir of oppositeDirs) {
        const wallX = x + dir.dx;
        const wallY = y + dir.dy;

        if (this.isBorderCell(wallX, wallY)) continue;

        if (
          wallX <= 0 ||
          wallX >= this.width - 1 ||
          wallY <= 0 ||
          wallY >= this.height - 1
        )
          continue;

        if (this.grid[wallY][wallX].type === CellType.WALL) {
          const beyondX = wallX + dir.dx;
          const beyondY = wallY + dir.dy;

          if (
            beyondX > 0 &&
            beyondX < this.width - 1 &&
            beyondY > 0 &&
            beyondY < this.height - 1
          ) {
            if (this.grid[beyondY][beyondX].type === CellType.PASSAGE) {
              const dist = Math.abs(beyondX - x) + Math.abs(beyondY - y);
              if (dist >= 3 && Math.random() < 0.6) {
                this.grid[wallY][wallX].type = CellType.PASSAGE;
              }
              break;
            }
          }
        }
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

  private isBorderCell(x: number, y: number): boolean {
    return x <= 0 || x >= this.width - 1 || y <= 0 || y >= this.height - 1;
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

    // Top wall
    this.grid[centerY - 1][centerX - 1].type = CellType.WALL;
    this.grid[centerY - 1][centerX].type = CellType.WALL;
    this.grid[centerY - 1][centerX + 1].type = CellType.WALL;

    // Left wall
    this.grid[centerY][centerX - 2].type = CellType.WALL;
    this.grid[centerY + 1][centerX - 2].type = CellType.WALL;

    // Right wall
    this.grid[centerY][centerX + 2].type = CellType.WALL;
    this.grid[centerY + 1][centerX + 2].type = CellType.WALL;

    // Bottom walls (with gate at center)
    this.grid[centerY + 2][centerX - 1].type = CellType.WALL;
    this.grid[centerY + 2][centerX + 1].type = CellType.WALL;
    // Gate at (centerY + 2, centerX) remains passage

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
}
