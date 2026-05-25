import { describe, it, expect } from "vitest";
import {
  Direction,
  directionToDx,
  directionToDy,
  oppositeDirection,
  getValidDirections,
} from "../../src/game/utils/DirectionUtils";
import { CellType } from "../../src/game/utils/MazeGenerator";
import type { MazeCell } from "../../src/game/utils/MazeGenerator";

describe("directionToDx", () => {
  it("LEFT returns -1", () => {
    expect(directionToDx(Direction.LEFT)).toBe(-1);
  });

  it("RIGHT returns 1", () => {
    expect(directionToDx(Direction.RIGHT)).toBe(1);
  });

  it("UP returns 0", () => {
    expect(directionToDx(Direction.UP)).toBe(0);
  });

  it("DOWN returns 0", () => {
    expect(directionToDx(Direction.DOWN)).toBe(0);
  });

  it("NONE returns 0", () => {
    expect(directionToDx(Direction.NONE)).toBe(0);
  });
});

describe("directionToDy", () => {
  it("UP returns -1", () => {
    expect(directionToDy(Direction.UP)).toBe(-1);
  });

  it("DOWN returns 1", () => {
    expect(directionToDy(Direction.DOWN)).toBe(1);
  });

  it("LEFT returns 0", () => {
    expect(directionToDy(Direction.LEFT)).toBe(0);
  });

  it("RIGHT returns 0", () => {
    expect(directionToDy(Direction.RIGHT)).toBe(0);
  });

  it("NONE returns 0", () => {
    expect(directionToDy(Direction.NONE)).toBe(0);
  });
});

describe("oppositeDirection", () => {
  it("UP opposite is DOWN", () => {
    expect(oppositeDirection(Direction.UP)).toBe(Direction.DOWN);
  });

  it("DOWN opposite is UP", () => {
    expect(oppositeDirection(Direction.DOWN)).toBe(Direction.UP);
  });

  it("LEFT opposite is RIGHT", () => {
    expect(oppositeDirection(Direction.LEFT)).toBe(Direction.RIGHT);
  });

  it("RIGHT opposite is LEFT", () => {
    expect(oppositeDirection(Direction.RIGHT)).toBe(Direction.LEFT);
  });

  it("NONE opposite is NONE", () => {
    expect(oppositeDirection(Direction.NONE)).toBe(Direction.NONE);
  });
});

describe("getValidDirections", () => {
  function makeGrid(
    w: number,
    h: number,
    passages: { x: number; y: number }[],
  ): MazeCell[][] {
    const grid: MazeCell[][] = [];
    for (let y = 0; y < h; y++) {
      grid[y] = [];
      for (let x = 0; x < w; x++) {
        grid[y][x] = { type: CellType.WALL, visited: false };
      }
    }
    for (const p of passages) {
      grid[p.y][p.x].type = CellType.PASSAGE;
    }
    return grid;
  }

  it("returns all 4 directions when all adjacent cells are passages", () => {
    const grid = makeGrid(3, 3, [
      { x: 0, y: 1 },
      { x: 1, y: 0 },
      { x: 1, y: 2 },
      { x: 2, y: 1 },
    ]);
    const dirs = getValidDirections(1, 1, grid, 3, 3);
    expect(dirs).toContain(Direction.UP);
    expect(dirs).toContain(Direction.DOWN);
    expect(dirs).toContain(Direction.LEFT);
    expect(dirs).toContain(Direction.RIGHT);
    expect(dirs.length).toBe(4);
  });

  it("excludes wall cells", () => {
    const grid = makeGrid(3, 3, [
      { x: 0, y: 1 },
      { x: 2, y: 1 },
    ]);
    const dirs = getValidDirections(1, 1, grid, 3, 3);
    expect(dirs).not.toContain(Direction.UP);
    expect(dirs).not.toContain(Direction.DOWN);
    expect(dirs).toContain(Direction.LEFT);
    expect(dirs).toContain(Direction.RIGHT);
  });

  it("excludes out-of-bounds directions at top-left corner", () => {
    const grid = makeGrid(3, 3, [
      { x: 0, y: 1 },
      { x: 1, y: 0 },
    ]);
    const dirs = getValidDirections(0, 0, grid, 3, 3);
    expect(dirs).not.toContain(Direction.UP);
    expect(dirs).not.toContain(Direction.LEFT);
    expect(dirs).toContain(Direction.DOWN);
    expect(dirs).toContain(Direction.RIGHT);
  });

  it("excludes out-of-bounds directions at bottom-right corner", () => {
    const grid = makeGrid(3, 3, [
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ]);
    const dirs = getValidDirections(2, 2, grid, 3, 3);
    expect(dirs).not.toContain(Direction.DOWN);
    expect(dirs).not.toContain(Direction.RIGHT);
    expect(dirs).toContain(Direction.UP);
    expect(dirs).toContain(Direction.LEFT);
  });
});
