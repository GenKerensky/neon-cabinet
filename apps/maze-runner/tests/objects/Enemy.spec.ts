import { describe, it, expect, vi } from "vitest";

vi.mock("phaser", () => {
  class MockGameObject {
    scene: any;
    x: number;
    y: number;
    active = true;
    alpha = 1;
    scale = 1;
    visible = true;
    depth = 0;
    parent: any = null;
    tint = 0xffffff;
    texture: { key: string } = { key: "test" };
    anims: {
      play: () => void;
      isPlaying: boolean;
      pause: () => void;
      resume: () => void;
    } = {
      play: () => void 0,
      isPlaying: false,
      pause: () => void 0,
      resume: () => void 0,
    };
    constructor(scene: any, x: number, y: number, _texture?: string) {
      this.scene = scene;
      this.x = x;
      this.y = y;
    }
    setTexture(_key: string): void {
      /* noop */
    }
    setAlpha(_value: number): void {
      this.alpha = _value;
    }
    setScale(_value: number): void {
      this.scale = _value;
    }
    setVisible(_value: boolean): void {
      this.visible = _value;
    }
    setDepth(_value: number): void {
      this.depth = _value;
    }
    setPosition(x: number, y: number) {
      this.x = x;
      this.y = y;
      return this;
    }
    clearTint(): void {
      /* noop */
    }
    setTint(_color: number): void {
      /* noop */
    }
    play(_key: string, _ignoreIfPlaying?: boolean): void {
      /* noop */
    }
    stop(): void {
      /* noop */
    }
    destroy() {
      this.active = false;
    }
  }

  class MockContainer extends MockGameObject {
    list: any[] = [];
    update(_time: number, _delta: number) {
      for (const child of this.list) {
        if (child && typeof child.update === "function")
          child.update(_time, _delta);
      }
    }
    add(child: any) {
      if (Array.isArray(child)) {
        child.forEach((c) => {
          if (c) c.parent = this;
        });
        this.list.push(...child);
      } else {
        if (child) child.parent = this;
        this.list.push(child);
      }
    }
    remove(child: any) {
      const idx = this.list.indexOf(child);
      if (idx !== -1) this.list.splice(idx, 1);
    }
    getWorldTransformMatrix() {
      return {
        transformPoint: (x: number, y: number, point: any) => {
          const px = this.parent ? this.parent.x : 0;
          const py = this.parent ? this.parent.y : 0;
          point.x = px + this.x + x;
          point.y = py + this.y + y;
        },
      };
    }
  }

  class MockGraphics extends MockGameObject {
    lineStyle() {
      return this;
    }
    fillStyle() {
      return this;
    }
    beginPath() {
      return this;
    }
    moveTo() {
      return this;
    }
    lineTo() {
      return this;
    }
    fillPath() {
      return this;
    }
    strokePath() {
      return this;
    }
    strokeCircle() {
      return this;
    }
    fillCircle() {
      return this;
    }
    strokeRoundedRect() {
      return this;
    }
    fillRoundedRect() {
      return this;
    }
    fillRect() {
      return this;
    }
    strokeRect() {
      return this;
    }
    closePath() {
      return this;
    }
    clear() {
      return this;
    }
  }

  class MockVector2 {
    constructor(
      public x = 0,
      public y = 0,
    ) {}
  }

  return {
    GameObjects: {
      Sprite: MockGameObject,
      Container: MockContainer,
      Graphics: MockGraphics,
    },
    Scene: class {},
    Math: {
      Vector2: MockVector2,
    },
    Display: {
      Color: {
        HexStringToColor: (hex: string) => {
          return { color: parseInt(hex.replace("#", ""), 16) || 0 };
        },
      },
    },
  };
});

import { CellType } from "../../src/game/utils/MazeGenerator";
import type { MazeCell } from "../../src/game/utils/MazeGenerator";
import { Direction } from "../../src/game/utils/DirectionUtils";
import { EnemyState } from "../../src/game/objects/Enemy";
import { getCellCenter } from "../../src/game/utils/gridGeometry";
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
  constructor(
    grid: MazeCell[][],
    gridWidth: number,
    gridHeight: number,
    mockScene = createMockScene(),
  ) {
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
    this.movementDirection = Direction.NONE;
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
    this.movementDirection = dir;
  }

  getCurrentDirection(): Direction {
    return this.movementDirection;
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

  forcePenExitPublic(): void {
    this.forcePenExit();
  }

  isExitingPenPublic(): boolean {
    return this.isExitingPen();
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
  constructor(
    grid: MazeCell[][],
    gridWidth: number,
    gridHeight: number,
    predictionCells?: number,
  ) {
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
      undefined,
      undefined,
      undefined,
      predictionCells,
    );
    this.movementDirection = Direction.NONE;
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
  constructor(
    grid: MazeCell[][],
    gridWidth: number,
    gridHeight: number,
    distanceThreshold?: number,
  ) {
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
      undefined,
      undefined,
      undefined,
      distanceThreshold,
    );
    this.movementDirection = Direction.NONE;
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
  constructor(
    grid: MazeCell[][],
    gridWidth: number,
    gridHeight: number,
    vectorScale?: number,
  ) {
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
      undefined,
      undefined,
      undefined,
      vectorScale,
    );
    this.movementDirection = Direction.NONE;
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
  describe("constructor", () => {
    it("registers an Arcade body for ghost enemies", () => {
      const grid = allPassageGrid(7, 7);
      const mockScene = createMockScene();

      const enemy = new TestEnemy(grid, 7, 7, mockScene);

      expect(mockScene.physics.add.existing).toHaveBeenCalledWith(enemy);
      expect((enemy as any).body).toBeDefined();
    });
  });

  describe("chooseDirection - target selection", () => {
    it("picks direction closest to target", () => {
      const grid = allPassageGrid(9, 9);
      const enemy = new TestEnemy(grid, 9, 9);
      enemy.setGridPosition(1, 1);
      enemy.setCurrentDirection(Direction.UP);

      const dir = enemy.chooseDirection(
        7 * 16 + 8,
        1 * 16 + 8,
        Direction.RIGHT,
      );

      expect(dir).toBe(Direction.RIGHT);
    });

    it("avoids wall cells even if shortest path", () => {
      const grid = gridFromPattern([
        "WWWWWWWWW",
        "W.W.....W",
        "W.......W",
        "W.......W",
        "W.......W",
        "W.......W",
        "W.......W",
        "W.......W",
        "WWWWWWWWW",
      ]);
      const enemy = new TestEnemy(grid, 9, 9);
      enemy.setGridPosition(2, 2);
      enemy.setCurrentDirection(Direction.RIGHT);

      const dir = enemy.chooseDirection(2 * 16 + 8, 0 * 16 + 8, Direction.UP);

      expect(dir).not.toBe(Direction.UP);
      expect([Direction.DOWN, Direction.LEFT, Direction.RIGHT]).toContain(dir);
    });

    it("prefers current direction on distance tie", () => {
      const grid = allPassageGrid(7, 7);
      const enemy = new TestEnemy(grid, 7, 7);
      enemy.setGridPosition(1, 1);
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
    it("activateFrightened adds duration while already FRIGHTENED", () => {
      const grid = allPassageGrid(7, 7);
      const enemy = new TestEnemy(grid, 7, 7);

      enemy.activateFrightened(2000);
      enemy.activateFrightened(500);

      expect(enemy.getState()).toBe(EnemyState.FRIGHTENED);
      expect(enemy.getFrightenedTimer()).toBe(2500);
    });

    it("activateFrightened is no-op in DEAD state", () => {
      const grid = allPassageGrid(7, 7);
      const enemy = new TestEnemy(grid, 7, 7);
      enemy.setEnemyState(EnemyState.DEAD);

      enemy.activateFrightened(3000);

      expect(enemy.getState()).toBe(EnemyState.DEAD);
      expect(enemy.getSpeed()).toBe(320);
      expect(enemy.getFrightenedTimer()).toBe(0);
    });

    it("DEAD return movement ignores walls and snaps to return target", () => {
      const grid = gridFromPattern([
        "WWWWWWW",
        "W.....W",
        "W.W.W.W",
        "W.....W",
        "W.W.W.W",
        "W.....W",
        "WWWWWWW",
      ]);
      const enemy = new TestEnemy(grid, 7, 7);
      enemy.setGridPosition(1, 1);
      enemy.setDeadReturnTarget(3, 3);
      enemy.setEnemyState(EnemyState.DEAD);

      enemy.update(0, 1000, 0, 0, Direction.NONE);

      expect(enemy.getGridX()).toBe(3);
      expect(enemy.getGridY()).toBe(3);
      expect(enemy.getState()).toBe(EnemyState.CHASE);
      expect(enemy.isExitingPenPublic()).toBe(true);

      enemy.setCurrentDirection(Direction.NONE);
      enemy.update(1001, 50, 0, 0, Direction.NONE);
      expect(enemy.getCurrentDirection()).toBe(Direction.UP);
    });

    it("initial/inside-pen ghosts prioritize pen exit even when FRIGHTENED", () => {
      const grid = allPassageGrid(7, 7);
      const enemy = new TestEnemy(grid, 7, 7);
      enemy.setGridPosition(3, 3);
      enemy.forcePenExitPublic();
      enemy.setCurrentDirection(Direction.NONE);
      enemy.setEnemyState(EnemyState.FRIGHTENED);

      enemy.update(0, 16, 0, 0, Direction.NONE);

      expect(enemy.getCurrentDirection()).toBe(Direction.UP);
      expect(enemy.isExitingPenPublic()).toBe(true);
    });

    it("living ghosts outside pen cannot choose re-entry through gate", () => {
      const grid = allPassageGrid(7, 7);
      const enemy = new TestEnemy(grid, 7, 7);
      enemy.setGridPosition(3, 1);
      enemy.setCurrentDirection(Direction.RIGHT);

      const dir = enemy.chooseDirection(3 * 16 + 8, 3 * 16 + 8, Direction.DOWN);

      expect(dir).not.toBe(Direction.DOWN);
    });

    it("dead ghosts ignore walls only while DEAD and still revive to pen-exit cycle", () => {
      const grid = gridFromPattern([
        "WWWWWWW",
        "WWWWWWW",
        "WWW.WWW",
        "WWW.WWW",
        "WWW.WWW",
        "WWWWWWW",
        "WWWWWWW",
      ]);
      const enemy = new TestEnemy(grid, 7, 7);
      enemy.setGridPosition(1, 1);
      enemy.setDeadReturnTarget(3, 3);
      enemy.setEnemyState(EnemyState.DEAD);

      enemy.update(0, 1200, 0, 0, Direction.NONE);

      expect(enemy.getGridX()).toBe(3);
      expect(enemy.getGridY()).toBe(3);
      expect(enemy.getState()).toBe(EnemyState.CHASE);
      expect(enemy.isExitingPenPublic()).toBe(true);
    });

    it("keeps movement on centerlines while moving along axis", () => {
      const grid = allPassageGrid(7, 7);
      const enemy = new TestEnemy(grid, 7, 7);
      enemy.setGridPosition(1, 1);
      enemy.setCurrentDirection(Direction.RIGHT);

      const center = getCellCenter(1, 1, 16, 0, 0);
      (enemy as any).y = center.y + 3;

      enemy.update(0, 100, 0, 0, Direction.NONE);

      expect((enemy as any).y).toBe(center.y);
    });

    it("FRIGHTENED timer expiry transitions to CHASE", () => {
      const grid = allPassageGrid(7, 7);
      const enemy = new TestEnemy(grid, 7, 7);
      enemy.setGridPosition(3, 3);
      enemy.setCurrentDirection(Direction.RIGHT);
      enemy.setEnemyState(EnemyState.FRIGHTENED);

      enemy.update(0, 8001, 0, 0, Direction.NONE);

      expect(enemy.getState()).toBe(EnemyState.CHASE);
    });

    it("FRIGHTENED timer not expired stays FRIGHTENED", () => {
      const grid = allPassageGrid(7, 7);
      const enemy = new TestEnemy(grid, 7, 7);
      enemy.setGridPosition(3, 3);
      enemy.setCurrentDirection(Direction.RIGHT);
      enemy.setEnemyState(EnemyState.FRIGHTENED);

      enemy.update(0, 100, 0, 0, Direction.NONE);

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

    it("uses custom prediction distance when provided", () => {
      const grid = allPassageGrid(12, 12);
      const enemy = new TestAmbusher(grid, 12, 12, 2);
      enemy.setGridPosition(1, 1);
      enemy.setEnemyState(EnemyState.CHASE);

      const target = enemy.getTargetPosition(
        3 * 16 + 8,
        3 * 16 + 8,
        Direction.RIGHT,
      );

      expect(target).toEqual({ x: 5, y: 3 });
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

    it("uses custom timid threshold when provided", () => {
      const grid = allPassageGrid(10, 10);
      const enemy = new TestTimid(grid, 10, 10, 2);
      enemy.setGridPosition(1, 1);
      enemy.setEnemyState(EnemyState.CHASE);

      const target = enemy.getTargetPosition(
        4 * 16 + 8,
        1 * 16 + 8,
        Direction.NONE,
      );

      expect(target).not.toEqual({ x: 4, y: 1 });
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

    it("uses custom pincer vector scale when provided", () => {
      const grid = allPassageGrid(12, 12);
      const enemy = new TestWanderer(grid, 12, 12, 1);
      enemy.setGridPosition(1, 1);
      enemy.setChaserPosition(1, 1);
      enemy.setEnemyState(EnemyState.CHASE);

      const target = enemy.getTargetPosition(
        3 * 16 + 8,
        1 * 16 + 8,
        Direction.RIGHT,
      );

      expect(target).toEqual({ x: 5, y: 1 });
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
