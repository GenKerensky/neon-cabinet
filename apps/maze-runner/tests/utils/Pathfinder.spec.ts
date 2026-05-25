import { describe, it, expect } from "vitest";
import { Pathfinder } from "../../src/game/utils/Pathfinder";
import { CellType } from "../../src/game/utils/MazeGenerator";
import type { MazeCell } from "../../src/game/utils/MazeGenerator";

function gridFromPattern(pattern: string[]): MazeCell[][] {
  return pattern.map((row) =>
    [...row].map((ch) => ({
      type: ch === "." ? CellType.PASSAGE : CellType.WALL,
      visited: false,
    })),
  );
}

describe("Pathfinder", () => {
  it("finds straight horizontal path through open corridor", () => {
    const grid = gridFromPattern(["WWWWWWW", "W.....W", "WWWWWWW"]);
    const pf = new Pathfinder(grid, 7, 3);
    const path = pf.findPath(1, 1, 5, 1);

    expect(path).not.toBeNull();
    expect(path!.length).toBe(5);
    expect(path![0]).toEqual({ x: 1, y: 1 });
    expect(path![4]).toEqual({ x: 5, y: 1 });
  });

  it("routes around wall obstacles", () => {
    const grid = gridFromPattern(["WWWWWWW", "W..W..W", "W......", "WWWWWWW"]);
    const pf = new Pathfinder(grid, 7, 4);
    const path = pf.findPath(1, 1, 4, 1);

    expect(path).not.toBeNull();
    const blockedCell = path!.find((p) => p.x === 3 && p.y === 1);
    expect(blockedCell).toBeUndefined();
    expect(path![0]).toEqual({ x: 1, y: 1 });
  });

  it("returns null for unreachable target", () => {
    const grid = gridFromPattern(["WWWWWWW", "W...W.W", "WWWWWWW"]);
    const pf = new Pathfinder(grid, 7, 3);
    const path = pf.findPath(1, 1, 5, 1);

    expect(path).toBeNull();
  });

  it("returns null when iteration limit exceeded", () => {
    const grid = gridFromPattern([
      "WWWWWWW",
      "W.....W",
      "W.....W",
      "W.....W",
      "WWWWWWW",
    ]);
    const pf = new Pathfinder(grid, 7, 5);
    const path = pf.findPath(1, 1, 5, 3, undefined, 10);

    expect(path).toBeNull();
  });

  it("returns single-node path when start equals end", () => {
    const grid = gridFromPattern(["WWWWWWW", "W.....W", "WWWWWWW"]);
    const pf = new Pathfinder(grid, 7, 3);
    const path = pf.findPath(3, 1, 3, 1);

    expect(path).not.toBeNull();
    expect(path!.length).toBe(1);
    expect(path![0]).toEqual({ x: 3, y: 1 });
  });

  it("works with custom zero heuristic (BFS behavior)", () => {
    const grid = gridFromPattern(["WWWWWWW", "W.....W", "WWWWWWW"]);
    const pf = new Pathfinder(grid, 7, 3);
    const path = pf.findPath(1, 1, 5, 1, () => 0);

    expect(path).not.toBeNull();
    expect(path![0]).toEqual({ x: 1, y: 1 });
    expect(path![path!.length - 1]).toEqual({ x: 5, y: 1 });
  });

  it("static maxDistance returns negative Manhattan distance", () => {
    const result = Pathfinder.maxDistance(1, 1, 4, 5);
    expect(result).toBe(-7);
  });
});
