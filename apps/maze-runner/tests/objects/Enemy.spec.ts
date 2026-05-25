import { describe, it, expect, vi } from "vitest";

vi.mock("phaser", () => {
  class MockGameObject {
    scene: any;
    x: number;
    y: number;
    active = true;
    alpha = 1;
    tint = 0xffffff;
    texture: { key: string } = { key: "test" };
    anims: {
      play: () => {};
      isPlaying: boolean;
      pause: () => {};
      resume: () => {};
    } = {
      play: () => ({}),
      isPlaying: false,
      pause: () => ({}),
      resume: () => ({}),
    };
    constructor(scene: any, x: number, y: number, _texture?: string) {
      this.scene = scene;
      this.x = x;
      this.y = y;
    }
    setTexture(_key: string): void {}
    setAlpha(_value: number): void {}
    clearTint(): void {}
    setTint(_color: number): void {}
    play(_key: string, _ignoreIfPlaying?: boolean): void {}
    stop(): void {}
    destroy() {
      this.active = false;
    }
  }
  return { GameObjects: { Sprite: MockGameObject }, Scene: class {} };
});

import { CellType } from "../../src/game/utils/MazeGenerator";
import type { MazeCell } from "../../src/game/utils/MazeGenerator";
import { Direction } from "../../src/game/utils/DirectionUtils";
import { EnemyState } from "../../src/game/objects/Enemy";
import { Chaser } from "../../src/game/ai/Chaser";
import { Ambusher } from "../../src/game/ai/Ambusher";
import { Timid } from "../../src/game/ai/Timid";
import { Wanderer } from "../../src/game/ai/Wanderer";
import { createMockScene } from "../helpers/createMockScene";

function gridFromPattern(pattern: string[]): MazeCell[][] {
  return pattern.map((row) =>
    [...row].map((ch) => ({
      type: ch === "." ? CellType.PASSAGE : CellType.WALL,
      visited: false,
    })),
  );
}

class TestEnemy extends Chaser {
  constructor(grid: MazeCell[][], gridWidth: number, gridHeight: number) {
    const mockScene = createMockScene();
    const tileSize = 16;
    const offsetX = 0;
    const offsetY = 0;
    const startX = offsetX + 1 * tileSize + tileSize / 2;
    const startY = offsetY + 1 * tileSize + tileSize / 2;
    super(
      mockScene,
      startX,
      startY,
      "test",
      grid,
      gridWidth,
      gridHeight,
      tileSize,
      offsetX,
      offsetY,
      { x: 100, y: 100 },
      80,
    );
    this.currentDirection = Direction.NONE;
  }

  chooseDirection(
    playerX: number,
    playerY: number,
    playerDir: Direction,
  ): Direction {
    return super.chooseDirection(playerX, playerY, playerDir);
  }

  moveStep(
    dt: number,
    playerX: number,
    playerY: number,
    playerDir: Direction,
  ): void {
    super.moveStep(dt, playerX, playerY, playerDir);
  }

  findNearestPassage(
    startX: number,
    startY: number,
  ): { x: number; y: number } | null {
    return super.findNearestPassage(startX, startY);
  }

  randomValidDirection(allowReverse: boolean): Direction {
    return super.randomValidDirection(allowReverse);
  }

  setCurrentDirection(dir: Direction): void {
    this.currentDirection = dir;
  }

  getCurrentDirection(): Direction {
    return this.currentDirection;
  }

  setGridPosition(gx: number, gy: number): void {
    this.gridX = gx;
    this.gridY = gy;
    const tileSize = 16;
    this.x = this.offsetX + gx * tileSize + tileSize / 2;
    this.y = this.offsetY + gy * tileSize + tileSize / 2;
  }

  getGridX(): number {
    return this.gridX;
  }

  getGridY(): number {
    return this.gridY;
  }

  getSpeed(): number {
    return this.speed;
  }

  getFrightenedTimer(): number {
    return this.frightenedTimer;
  }
}

function allPassageGrid(w: number, h: number): MazeCell[][] {
  const grid: MazeCell[][] = [];
  for (let y = 0; y < h; y++) {
    grid[y] = [];
    for (let x = 0; x < w; x++) {
      grid[y][x] = { type: CellType.PASSAGE, visited: false };
    }
  }
  return grid;
}

class TestAmbusher extends Ambusher {
  constructor(grid: MazeCell[][], gridWidth: number, gridHeight: number) {
    const mockScene = createMockScene();
    const tileSize = 16;
    const offsetX = 0;
    const offsetY = 0;
    const startX = offsetX + 1 * tileSize + tileSize / 2;
    const startY = offsetY + 1 * tileSize + tileSize / 2;
    super(
      mockScene,
      startX,
      startY,
      "test",
      grid,
      gridWidth,
      gridHeight,
      tileSize,
      offsetX,
      offsetY,
      { x: 100, y: 100 },
      80,
    );
    this.currentDirection = Direction.NONE;
  }

  setGridPosition(gx: number, gy: number): void {
    this.gridX = gx;
    this.gridY = gy;
    const tileSize = 16;
    this.x = this.offsetX + gx * tileSize + tileSize / 2;
    this.y = this.offsetY + gy * tileSize + tileSize / 2;
  }

  setEnemyStatePublic(state: EnemyState): void {
    this.setEnemyState(state);
  }
}

class TestTimid extends Timid {
  constructor(grid: MazeCell[][], gridWidth: number, gridHeight: number) {
    const mockScene = createMockScene();
    const tileSize = 16;
    const offsetX = 0;
    const offsetY = 0;
    const startX = offsetX + 1 * tileSize + tileSize / 2;
    const startY = offsetY + 1 * tileSize + tileSize / 2;
    super(
      mockScene,
      startX,
      startY,
      "test",
      grid,
      gridWidth,
      gridHeight,
      tileSize,
      offsetX,
      offsetY,
      { x: 100, y: 100 },
      80,
    );
    this.currentDirection = Direction.NONE;
  }

  setGridPosition(gx: number, gy: number): void {
    this.gridX = gx;
    this.gridY = gy;
    const tileSize = 16;
    this.x = this.offsetX + gx * tileSize + tileSize / 2;
    this.y = this.offsetY + gy * tileSize + tileSize / 2;
  }

  setEnemyStatePublic(state: EnemyState): void {
    this.setEnemyState(state);
  }
}

class TestWanderer extends Wanderer {
  constructor(grid: MazeCell[][], gridWidth: number, gridHeight: number) {
    const mockScene = createMockScene();
    const tileSize = 16;
    const offsetX = 0;
    const offsetY = 0;
    const startX = offsetX + 1 * tileSize + tileSize / 2;
    const startY = offsetY + 1 * tileSize + tileSize / 2;
    super(
      mockScene,
      startX,
      startY,
      "test",
      grid,
      gridWidth,
      gridHeight,
      tileSize,
      offsetX,
      offsetY,
      { x: 100, y: 100 },
      80,
    );
    this.currentDirection = Direction.NONE;
  }

  setGridPosition(gx: number, gy: number): void {
    this.gridX = gx;
    this.gridY = gy;
    const tileSize = 16;
    this.x = this.offsetX + gx * tileSize + tileSize / 2;
    this.y = this.offsetY + gy * tileSize + tileSize / 2;
  }

  setEnemyStatePublic(state: EnemyState): void {
    this.setEnemyState(state);
  }
}

describe("Enemy", () => {
  describe("chooseDirection - target selection", () => {
    it("picks direction closest to target", () => {
      const grid = allPassageGrid(7, 7);
      const enemy = new TestEnemy(grid, 7, 7);
      enemy.setGridPosition(3, 3);
      enemy.setCurrentDirection(Direction.UP);

      const dir = enemy.chooseDirection(
        5 * 16 + 8,
        3 * 16 + 8,
        Direction.RIGHT,
      );

      expect(dir).toBe(Direction.RIGHT);
    });

    it("avoids wall cells even if shortest path", () => {
      const grid = gridFromPattern([
        "WWWWWWW",
        "W.....W",
        "W.W...W",
        "W.....W",
        "W.....W",
        "W.....W",
        "WWWWWWW",
      ]);
      const enemy = new TestEnemy(grid, 7, 7);
      enemy.setGridPosition(3, 3);
      enemy.setCurrentDirection(Direction.UP);

      const dir = enemy.chooseDirection(
        5 * 16 + 8,
        3 * 16 + 8,
        Direction.RIGHT,
      );

      expect(dir).not.toBe(Direction.UP);
      expect([Direction.DOWN, Direction.LEFT, Direction.RIGHT]).toContain(dir);
    });

    it("prefers current direction on distance tie", () => {
      const grid = allPassageGrid(7, 7);
      const enemy = new TestEnemy(grid, 7, 7);
      enemy.setGridPosition(2, 2);
      enemy.setCurrentDirection(Direction.DOWN);

      const dir = enemy.chooseDirection(
        4 * 16 + 8,
        4 * 16 + 8,
        Direction.RIGHT,
      );

      expect(dir).toBe(Direction.DOWN);
    });
  });

  describe("chooseDirection - no-reverse rule", () => {
    it("skips reverse direction at intersection", () => {
      const grid = gridFromPattern([
        "WWWWWWW",
        "W.....W",
        "W.....W",
        "W..WW.W",
        "W.....W",
        "W.....W",
        "WWWWWWW",
      ]);
      const enemy = new TestEnemy(grid, 7, 7);
      enemy.setGridPosition(3, 3);
      enemy.setCurrentDirection(Direction.RIGHT);

      const dir = enemy.chooseDirection(0, 0, Direction.LEFT);

      expect(dir).not.toBe(Direction.LEFT);
      expect([Direction.UP, Direction.DOWN, Direction.RIGHT]).toContain(dir);
    });

    it("allows reverse in dead-end corridor", () => {
      const grid = gridFromPattern([
        "WWWWWW",
        "..W..W",
        "WWWWWW",
        "......",
        "WWWWWW",
        "WWWWWW",
      ]);
      const enemy = new TestEnemy(grid, 6, 6);
      enemy.setGridPosition(1, 1);
      enemy.setCurrentDirection(Direction.RIGHT);

      const dir = enemy.chooseDirection(
        5 * 16 + 8,
        1 * 16 + 8,
        Direction.RIGHT,
      );

      expect(dir).toBe(Direction.LEFT);
    });
  });

  describe("chooseDirection - DEAD state", () => {
    it("allows reverse direction", () => {
      const grid = allPassageGrid(7, 7);
      const enemy = new TestEnemy(grid, 7, 7);
      enemy.setGridPosition(3, 3);
      enemy.setCurrentDirection(Direction.RIGHT);
      enemy.setEnemyState(EnemyState.DEAD);

      const dir = enemy.chooseDirection(0, 0, Direction.NONE);

      expect([
        Direction.UP,
        Direction.DOWN,
        Direction.LEFT,
        Direction.RIGHT,
      ]).toContain(dir);
    });

    it("targets maze center", () => {
      const grid = gridFromPattern([
        "WWWWW",
        "W...W",
        "W...W",
        "W...W",
        "WWWWW",
      ]);
      const enemy = new TestEnemy(grid, 5, 5);
      enemy.setGridPosition(1, 1);
      enemy.setCurrentDirection(Direction.UP);
      enemy.setEnemyState(EnemyState.DEAD);

      const dir = enemy.chooseDirection(0, 0, Direction.NONE);

      expect(dir).toBe(Direction.DOWN);
    });
  });

  describe("chooseDirection - FRIGHTENED state", () => {
    it("picks random non-reverse direction", () => {
      const grid = allPassageGrid(7, 7);
      const enemy = new TestEnemy(grid, 7, 7);
      enemy.setGridPosition(3, 3);
      enemy.setCurrentDirection(Direction.LEFT);
      enemy.setEnemyState(EnemyState.FRIGHTENED);

      for (let i = 0; i < 50; i++) {
        const dir = enemy.chooseDirection(0, 0, Direction.NONE);
        expect(dir).not.toBe(Direction.RIGHT);
        expect([Direction.UP, Direction.DOWN, Direction.LEFT]).toContain(dir);
      }
    });

    it("allows reverse in dead-end (only valid direction)", () => {
      const grid = gridFromPattern([
        "WWWWWW",
        "..W..W",
        "WWWWWW",
        "......",
        "WWWWWW",
        "WWWWWW",
      ]);
      const enemy = new TestEnemy(grid, 6, 6);
      enemy.setGridPosition(1, 1);
      enemy.setCurrentDirection(Direction.RIGHT);
      enemy.setEnemyState(EnemyState.FRIGHTENED);

      const dir = enemy.chooseDirection(0, 0, Direction.NONE);

      expect(dir).toBe(Direction.LEFT);
    });
  });

  describe("setEnemyState", () => {
    it("SCATTER speed equals baseSpeed", () => {
      const grid = allPassageGrid(7, 7);
      const enemy = new TestEnemy(grid, 7, 7);

      expect(enemy.getSpeed()).toBe(80);
    });

    it("CHASE speed equals baseSpeed", () => {
      const grid = allPassageGrid(7, 7);
      const enemy = new TestEnemy(grid, 7, 7);
      enemy.setEnemyState(EnemyState.CHASE);
      expect(enemy.getSpeed()).toBe(80);
    });

    it("FRIGHTENED speed is halved and timer set", () => {
      const grid = allPassageGrid(7, 7);
      const enemy = new TestEnemy(grid, 7, 7);
      enemy.setEnemyState(EnemyState.FRIGHTENED);
      expect(enemy.getSpeed()).toBe(40);
      expect(enemy.getFrightenedTimer()).toBe(8000);
    });

    it("DEAD speed is quadrupled", () => {
      const grid = allPassageGrid(7, 7);
      const enemy = new TestEnemy(grid, 7, 7);
      enemy.setEnemyState(EnemyState.DEAD);
      expect(enemy.getSpeed()).toBe(320);
    });
  });

  describe("update", () => {
    it("FRIGHTENED timer expiry transitions to CHASE", () => {
      const grid = allPassageGrid(7, 7);
      const enemy = new TestEnemy(grid, 7, 7);
      enemy.setGridPosition(3, 3);
      enemy.setCurrentDirection(Direction.RIGHT);
      enemy.setEnemyState(EnemyState.FRIGHTENED);

      enemy.update(8001, 0, 0, Direction.NONE);

      expect(enemy.getState()).toBe(EnemyState.CHASE);
    });

    it("FRIGHTENED timer not expired stays FRIGHTENED", () => {
      const grid = allPassageGrid(7, 7);
      const enemy = new TestEnemy(grid, 7, 7);
      enemy.setGridPosition(3, 3);
      enemy.setCurrentDirection(Direction.RIGHT);
      enemy.setEnemyState(EnemyState.FRIGHTENED);

      enemy.update(100, 0, 0, Direction.NONE);

      expect(enemy.getState()).toBe(EnemyState.FRIGHTENED);
    });
  });

  describe("findNearestPassage", () => {
    it("finds adjacent passage cell", () => {
      const grid = gridFromPattern(["WWWWW", "W...W", "WWWWW"]);
      const enemy = new TestEnemy(grid, 5, 3);

      const result = enemy.findNearestPassage(2, 1);

      expect(result).not.toBeNull();
      expect(result!.x).toBe(2);
      expect(result!.y).toBe(1);
    });

    it("finds passage after BFS", () => {
      const grid = gridFromPattern([
        "WWWWWWW",
        "W.....W",
        "W..W..W",
        "W..W..W",
        "W.....W",
        "W.....W",
        "WWWWWWW",
      ]);
      const enemy = new TestEnemy(grid, 7, 7);

      const result = enemy.findNearestPassage(3, 3);

      expect(result).not.toBeNull();
      expect(result!.x).toBeGreaterThanOrEqual(0);
      expect(result!.y).toBeGreaterThanOrEqual(0);
    });

    it("returns null for completely wall-surrounded cell", () => {
      const grid = gridFromPattern([
        "WWWWW",
        "WWWWW",
        "WWWWW",
        "WWWWW",
        "WWWWW",
      ]);
      const enemy = new TestEnemy(grid, 5, 5);

      const result = enemy.findNearestPassage(2, 2);

      expect(result).toBeNull();
    });
  });

  describe("Chaser AI", () => {
    it("CHASE state returns player grid position", () => {
      const grid = allPassageGrid(7, 7);
      const enemy = new TestEnemy(grid, 7, 7);
      enemy.setGridPosition(1, 1);
      enemy.setEnemyState(EnemyState.CHASE);

      const target = enemy.getTargetPosition(
        3 * 16 + 8,
        3 * 16 + 8,
        Direction.RIGHT,
      );

      expect(target).toEqual({ x: 3, y: 3 });
    });

    it("SCATTER state returns scatter target", () => {
      const grid = allPassageGrid(7, 7);
      const enemy = new TestEnemy(grid, 7, 7);
      enemy.setEnemyState(EnemyState.SCATTER);

      const target = enemy.getTargetPosition(0, 0, Direction.NONE);

      expect(target).toEqual({ x: 100, y: 100 });
    });

    it("FRIGHTENED state returns null", () => {
      const grid = allPassageGrid(7, 7);
      const enemy = new TestEnemy(grid, 7, 7);
      enemy.setEnemyState(EnemyState.FRIGHTENED);

      const target = enemy.getTargetPosition(0, 0, Direction.NONE);

      expect(target).toBeNull();
    });
  });

  describe("Ambusher AI", () => {
    it("predicts target ahead in CHASE state", () => {
      const grid = allPassageGrid(7, 7);
      const enemy = new TestAmbusher(grid, 7, 7);
      enemy.setGridPosition(1, 1);

      const target = enemy.getTargetPosition(
        3 * 16 + 8,
        3 * 16 + 8,
        Direction.RIGHT,
      );

      expect(target!.x).toBeGreaterThan(3);
    });

    it("clamps prediction to grid bounds", () => {
      const grid = allPassageGrid(10, 10);
      const enemy = new TestAmbusher(grid, 10, 10);
      enemy.setGridPosition(1, 1);
      enemy.setEnemyState(EnemyState.CHASE);

      const target = enemy.getTargetPosition(
        8 * 16 + 8,
        5 * 16 + 8,
        Direction.RIGHT,
      );

      expect(target!.x).toBeLessThanOrEqual(8);
      expect(target!.y).toBe(5);
    });

    it("SCATTER state returns scatter target", () => {
      const grid = allPassageGrid(7, 7);
      const enemy = new TestAmbusher(grid, 7, 7);
      enemy.setEnemyStatePublic(EnemyState.SCATTER);

      const target = enemy.getTargetPosition(0, 0, Direction.NONE);

      expect(target).toEqual({ x: 100, y: 100 });
    });

    it("FRIGHTENED state returns null", () => {
      const grid = allPassageGrid(7, 7);
      const enemy = new TestAmbusher(grid, 7, 7);
      enemy.setEnemyStatePublic(EnemyState.FRIGHTENED);

      const target = enemy.getTargetPosition(0, 0, Direction.NONE);

      expect(target).toBeNull();
    });
  });

  describe("Timid AI", () => {
    it("chases player within distance threshold", () => {
      const grid = allPassageGrid(10, 10);
      const enemy = new TestTimid(grid, 10, 10);
      enemy.setGridPosition(1, 1);
      enemy.setEnemyState(EnemyState.CHASE);

      const target = enemy.getTargetPosition(
        3 * 16 + 8,
        3 * 16 + 8,
        Direction.NONE,
      );

      expect(target).toEqual({ x: 3, y: 3 });
    });

    it("flees to random target when player beyond threshold", () => {
      const grid = allPassageGrid(10, 12);
      const enemy = new TestTimid(grid, 10, 12);
      enemy.setGridPosition(1, 1);
      enemy.setEnemyState(EnemyState.CHASE);

      const target = enemy.getTargetPosition(
        1 * 16 + 8,
        10 * 16 + 8,
        Direction.NONE,
      );

      expect(target).not.toBeNull();
      expect(target!.x).toBeGreaterThanOrEqual(1);
      expect(target!.x).toBeLessThan(10);
      expect(target!.y).toBeGreaterThanOrEqual(1);
      expect(target!.y).toBeLessThan(12);
    });

    it("SCATTER state returns scatter target", () => {
      const grid = allPassageGrid(7, 7);
      const enemy = new TestTimid(grid, 7, 7);
      enemy.setEnemyStatePublic(EnemyState.SCATTER);

      const target = enemy.getTargetPosition(0, 0, Direction.NONE);

      expect(target).toEqual({ x: 100, y: 100 });
    });

    it("FRIGHTENED state returns null", () => {
      const grid = allPassageGrid(7, 7);
      const enemy = new TestTimid(grid, 7, 7);
      enemy.setEnemyStatePublic(EnemyState.FRIGHTENED);

      const target = enemy.getTargetPosition(0, 0, Direction.NONE);

      expect(target).toBeNull();
    });
  });

  describe("Wanderer AI", () => {
    it("computes pincer target from chaser and player positions", () => {
      const grid = allPassageGrid(10, 10);
      const enemy = new TestWanderer(grid, 10, 10);
      enemy.setGridPosition(1, 1);
      enemy.setChaserPosition(1, 1);
      enemy.setEnemyState(EnemyState.CHASE);

      const target = enemy.getTargetPosition(
        3 * 16 + 8,
        1 * 16 + 8,
        Direction.RIGHT,
      );

      expect(target!.x).toBe(7);
      expect(target!.y).toBe(1);
    });

    it("clamps pincer target to grid bounds", () => {
      const grid = allPassageGrid(7, 7);
      const enemy = new TestWanderer(grid, 7, 7);
      enemy.setGridPosition(1, 1);
      enemy.setChaserPosition(0, 1);
      enemy.setEnemyState(EnemyState.CHASE);

      const target = enemy.getTargetPosition(
        3 * 16 + 8,
        1 * 16 + 8,
        Direction.RIGHT,
      );

      expect(target!.x).toBeLessThanOrEqual(5);
    });

    it("uses stored chaser position from setter", () => {
      const grid = allPassageGrid(10, 10);
      const enemy = new TestWanderer(grid, 10, 10);
      enemy.setGridPosition(1, 1);
      enemy.setChaserPosition(2, 3);
      enemy.setEnemyState(EnemyState.CHASE);

      const target = enemy.getTargetPosition(
        5 * 16 + 8,
        5 * 16 + 8,
        Direction.RIGHT,
      );

      expect(target).toEqual({ x: 8, y: 8 });
    });

    it("SCATTER state returns scatter target", () => {
      const grid = allPassageGrid(7, 7);
      const enemy = new TestWanderer(grid, 7, 7);
      enemy.setEnemyStatePublic(EnemyState.SCATTER);

      const target = enemy.getTargetPosition(0, 0, Direction.NONE);

      expect(target).toEqual({ x: 100, y: 100 });
    });

    it("FRIGHTENED state returns null", () => {
      const grid = allPassageGrid(7, 7);
      const enemy = new TestWanderer(grid, 7, 7);
      enemy.setEnemyStatePublic(EnemyState.FRIGHTENED);

      const target = enemy.getTargetPosition(0, 0, Direction.NONE);

      expect(target).toBeNull();
    });
  });
});
