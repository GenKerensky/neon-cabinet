import type { MazeCell } from "../utils/MazeGenerator";
import { CellType } from "../utils/MazeGenerator";

export interface GridNode {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
  parent: GridNode | null;
}

export type HeuristicFunction = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) => number;

export class Pathfinder {
  private grid: MazeCell[][];
  private width: number;
  private height: number;

  constructor(grid: MazeCell[][], width: number, height: number) {
    this.grid = grid;
    this.width = width;
    this.height = height;
  }

  findPath(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    heuristic?: HeuristicFunction,
    maxIterations?: number,
  ): { x: number; y: number }[] | null {
    const h = heuristic ?? this.manhattanDistance.bind(this);
    const openSet: GridNode[] = [];
    const closedSet = new Set<string>();
    const maxIters = maxIterations ?? this.width * this.height;

    const startNode: GridNode = {
      x: startX,
      y: startY,
      g: 0,
      h: h(startX, startY, endX, endY),
      f: 0,
      parent: null,
    };
    startNode.f = startNode.g + startNode.h;
    openSet.push(startNode);

    const directions = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
    ];

    let iterations = 0;

    while (openSet.length > 0) {
      iterations++;
      if (iterations > maxIters) return null;

      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift()!;

      if (current.x === endX && current.y === endY) {
        return this.reconstructPath(current);
      }

      const key = `${current.x},${current.y}`;
      closedSet.add(key);

      for (const dir of directions) {
        const nx = current.x + dir.dx;
        const ny = current.y + dir.dy;

        if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) continue;
        if (this.grid[ny][nx].type !== CellType.PASSAGE) continue;
        if (closedSet.has(`${nx},${ny}`)) continue;

        const tentativeG = current.g + 1;
        let existing = openSet.find((n) => n.x === nx && n.y === ny);

        if (!existing) {
          existing = {
            x: nx,
            y: ny,
            g: tentativeG,
            h: h(nx, ny, endX, endY),
            f: 0,
            parent: current,
          };
          existing.f = existing.g + existing.h;
          openSet.push(existing);
        } else if (tentativeG < existing.g) {
          existing.g = tentativeG;
          existing.f = existing.g + existing.h;
          existing.parent = current;
        }
      }
    }

    return null;
  }

  private reconstructPath(node: GridNode): { x: number; y: number }[] {
    const path: { x: number; y: number }[] = [];
    let current: GridNode | null = node;

    while (current) {
      path.unshift({ x: current.x, y: current.y });
      current = current.parent;
    }

    return path;
  }

  manhattanDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  }

  static maxDistance(x1: number, y1: number, x2: number, y2: number): number {
    return -(Math.abs(x1 - x2) + Math.abs(y1 - y2));
  }
}
