import { describe, it, expect } from "vitest";
import { MazeGenerator, CellType } from "../../src/game/utils/MazeGenerator";

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
  });

  describe("dead end reduction", () => {
    it("identifies dead-end cells correctly", () => {
      const gen = new MazeGenerator(1);
      const grid = gen.create();
      let deadEndCount = 0;
      for (let y = 1; y < gen.getHeight() - 1; y++) {
        for (let x = 1; x < gen.getWidth() - 1; x++) {
          if (grid[y][x].type === CellType.PASSAGE) {
            let passageNeighbors = 0;
            if (grid[y - 1][x].type === CellType.PASSAGE) passageNeighbors++;
            if (grid[y + 1][x].type === CellType.PASSAGE) passageNeighbors++;
            if (grid[y][x - 1].type === CellType.PASSAGE) passageNeighbors++;
            if (grid[y][x + 1].type === CellType.PASSAGE) passageNeighbors++;
            if (passageNeighbors === 1) deadEndCount++;
          }
        }
      }
      expect(deadEndCount).toBeGreaterThan(0);
    });

    it("wall removal creates loops (BFS connectivity preserved)", () => {
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

    it("at least 20% of original dead ends remain after reduction", () => {
      const gen1 = new MazeGenerator(1);
      const grid1 = gen1.create();
      let originalDeadEnds = 0;
      for (let y = 1; y < gen1.getHeight() - 1; y++) {
        for (let x = 1; x < gen1.getWidth() - 1; x++) {
          if (grid1[y][x].type === CellType.PASSAGE) {
            let passageNeighbors = 0;
            if (grid1[y - 1][x].type === CellType.PASSAGE) passageNeighbors++;
            if (grid1[y + 1][x].type === CellType.PASSAGE) passageNeighbors++;
            if (grid1[y][x - 1].type === CellType.PASSAGE) passageNeighbors++;
            if (grid1[y][x + 1].type === CellType.PASSAGE) passageNeighbors++;
            if (passageNeighbors === 1) originalDeadEnds++;
          }
        }
      }

      const gen2 = new MazeGenerator(1);
      const grid2 = gen2.create();
      let remainingDeadEnds = 0;
      for (let y = 1; y < gen2.getHeight() - 1; y++) {
        for (let x = 1; x < gen2.getWidth() - 1; x++) {
          if (grid2[y][x].type === CellType.PASSAGE) {
            let passageNeighbors = 0;
            if (grid2[y - 1][x].type === CellType.PASSAGE) passageNeighbors++;
            if (grid2[y + 1][x].type === CellType.PASSAGE) passageNeighbors++;
            if (grid2[y][x - 1].type === CellType.PASSAGE) passageNeighbors++;
            if (grid2[y][x + 1].type === CellType.PASSAGE) passageNeighbors++;
            if (passageNeighbors === 1) remainingDeadEnds++;
          }
        }
      }

      expect(remainingDeadEnds).toBeGreaterThan(originalDeadEnds * 0.2);
    });
  });

  describe("maze connectivity", () => {
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
    it("enclosure interior cells are passages", () => {
      const gen = new MazeGenerator(1);
      const grid = gen.create();
      const cx = Math.floor(gen.getWidth() / 2);
      const cy = Math.floor(gen.getHeight() / 2);

      // Check all 6 interior cells of the 3x2 enclosure
      for (let y = cy; y <= cy + 1; y++) {
        for (let x = cx - 1; x <= cx + 1; x++) {
          expect(grid[y][x].type).toBe(CellType.PASSAGE);
        }
      }
    });

    it("top wall of enclosure is walls", () => {
      const gen = new MazeGenerator(1);
      const grid = gen.create();
      const cx = Math.floor(gen.getWidth() / 2);
      const cy = Math.floor(gen.getHeight() / 2);

      // Check top wall: row cy-1, columns cx-1, cx, cx+1
      expect(grid[cy - 1][cx - 1].type).toBe(CellType.WALL);
      expect(grid[cy - 1][cx].type).toBe(CellType.WALL);
      expect(grid[cy - 1][cx + 1].type).toBe(CellType.WALL);
    });

    it("left and right walls of enclosure are walls", () => {
      const gen = new MazeGenerator(1);
      const grid = gen.create();
      const cx = Math.floor(gen.getWidth() / 2);
      const cy = Math.floor(gen.getHeight() / 2);

      // Left wall: column cx-2, rows cy and cy+1
      expect(grid[cy][cx - 2].type).toBe(CellType.WALL);
      expect(grid[cy + 1][cx - 2].type).toBe(CellType.WALL);

      // Right wall: column cx+2, rows cy and cy+1
      expect(grid[cy][cx + 2].type).toBe(CellType.WALL);
      expect(grid[cy + 1][cx + 2].type).toBe(CellType.WALL);
    });

    it("bottom walls with gate are correct", () => {
      const gen = new MazeGenerator(1);
      const grid = gen.create();
      const cx = Math.floor(gen.getWidth() / 2);
      const cy = Math.floor(gen.getHeight() / 2);

      // Bottom walls: columns cx-1 and cx+1, row cy+2 are walls
      expect(grid[cy + 2][cx - 1].type).toBe(CellType.WALL);
      expect(grid[cy + 2][cx + 1].type).toBe(CellType.WALL);
      // Gate: column cx, row cy+2 is passage
      expect(grid[cy + 2][cx].type).toBe(CellType.PASSAGE);
    });

    it("clear passage ring exists around enclosure", () => {
      const gen = new MazeGenerator(1);
      const grid = gen.create();
      const cx = Math.floor(gen.getWidth() / 2);
      const cy = Math.floor(gen.getHeight() / 2);

      // Ring above top wall: row cy-2, columns cx-1 to cx+1
      if (cy - 2 >= 0) {
        for (let x = cx - 1; x <= cx + 1; x++) {
          expect(grid[cy - 2][x].type).toBe(CellType.PASSAGE);
        }
      }
      // Ring below bottom wall: row cy+3, columns cx-1 to cx+1
      if (cy + 3 < gen.getHeight()) {
        for (let x = cx - 1; x <= cx + 1; x++) {
          expect(grid[cy + 3][x].type).toBe(CellType.PASSAGE);
        }
      }
      // Ring left of left wall: column cx-3, rows cy-1 to cy+2
      if (cx - 3 >= 0) {
        for (let y = cy - 1; y <= cy + 2; y++) {
          expect(grid[y][cx - 3].type).toBe(CellType.PASSAGE);
        }
      }
      // Ring right of right wall: column cx+3, rows cy-1 to cy+2
      if (cx + 3 < gen.getWidth()) {
        for (let y = cy - 1; y <= cy + 2; y++) {
          expect(grid[y][cx + 3].type).toBe(CellType.PASSAGE);
        }
      }
    });
  });
});
