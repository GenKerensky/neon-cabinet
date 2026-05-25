import { describe, it, expect, vi } from "vitest";

vi.mock("phaser", () => {
  class MockGameObject {
    scene: any;
    x: number;
    y: number;
    active = true;
    alpha = 1;
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
    setTexture(_key: string): void {}
    setAlpha(_value: number): void {}
    play(_key: string, _ignoreIfPlaying?: boolean): void {}
    on(_event: string, _callback: () => void): void {}
    destroy() {
      this.active = false;
    }
  }
  return { GameObjects: { Sprite: MockGameObject }, Scene: class {} };
});

import { CellType } from "../../src/game/utils/MazeGenerator";
import type { MazeCell } from "../../src/game/utils/MazeGenerator";
import { Direction } from "../../src/game/utils/DirectionUtils";
import { Player } from "../../src/game/objects/Player";
import { createMockScene } from "../helpers/createMockScene";

function gridFromPattern(pattern: string[]): MazeCell[][] {
  return pattern.map((row) =>
    [...row].map((ch) => ({
      type: ch === "." ? CellType.PASSAGE : CellType.WALL,
      visited: false,
    })),
  );
}

function createPlayer(
  grid: MazeCell[][],
  gridWidth: number,
  gridHeight: number,
  tileSize = 16,
  offsetX = 0,
  offsetY = 0,
  speed = 200,
): Player {
  const mockScene = createMockScene();
  const startX = offsetX + 1 * tileSize + tileSize / 2;
  const startY = offsetY + 1 * tileSize + tileSize / 2;
  return new Player(
    mockScene,
    startX,
    startY,
    "player",
    grid,
    gridWidth,
    gridHeight,
    tileSize,
    offsetX,
    offsetY,
    speed,
  );
}

describe("Player", () => {
  describe("setDirection", () => {
    it("sets current direction when none", () => {
      const grid = gridFromPattern(["WWWWW", "W...W", "WWWWW"]);
      const player = createPlayer(grid, 5, 3);

      player.setDirection(Direction.RIGHT);

      expect(player.getCurrentDirection()).toBe(Direction.RIGHT);
    });

    it("queues direction in corridor (2 passages)", () => {
      const grid = gridFromPattern([
        "WWWWWWW",
        "W..W..W",
        "W..W..W",
        "W.....W",
        "W..W..W",
        "W..W..W",
        "WWWWWWW",
      ]);
      const player = createPlayer(grid, 7, 7);
      const p = player as any;
      player.setDirection(Direction.DOWN);
      p.currentDirection = Direction.DOWN;
      p.gridX = 1;
      p.gridY = 1;

      player.setDirection(Direction.RIGHT);

      expect(p.nextDirection).toBe(Direction.RIGHT);
      expect(player.getCurrentDirection()).toBe(Direction.DOWN);
    });

    it("applies direction immediately at intersection", () => {
      const grid = gridFromPattern([
        "WWWWWWW",
        "W.....W",
        "W.....W",
        "W.....W",
        "W.....W",
        "W.....W",
        "WWWWWWW",
      ]);
      const player = createPlayer(grid, 7, 7);
      const p = player as any;
      player.setDirection(Direction.RIGHT);
      p.currentDirection = Direction.RIGHT;
      p.gridX = 3;
      p.gridY = 3;

      player.setDirection(Direction.UP);

      expect(player.getCurrentDirection()).toBe(Direction.UP);
      expect(p.nextDirection).toBe(Direction.NONE);
    });

    it("queues direction at dead-end intersection (blocked current)", () => {
      const grid = gridFromPattern([
        "WWWWWWW",
        "W..W..W",
        "W..W..W",
        "W.....W",
        "W..W..W",
        "W..W..W",
        "WWWWWWW",
      ]);
      const player = createPlayer(grid, 7, 7);
      const p = player as any;
      player.setDirection(Direction.RIGHT);
      p.currentDirection = Direction.RIGHT;
      p.gridX = 1;
      p.gridY = 1;

      player.setDirection(Direction.DOWN);

      expect(p.nextDirection).toBe(Direction.DOWN);
    });
  });

  describe("canMove", () => {
    it("wall blocks movement", () => {
      const grid = gridFromPattern(["WWWWW", "W.W.W", "WWWWW"]);
      const player = createPlayer(grid, 5, 3);
      const p = player as any;
      p.gridX = 1;
      p.gridY = 1;

      // @ts-expect-error accessing private for test
      expect(player.canMove(Direction.RIGHT)).toBe(false);
    });

    it("passage allows movement", () => {
      const grid = gridFromPattern(["WWWWW", "W...W", "WWWWW"]);
      const player = createPlayer(grid, 5, 3);
      const p = player as any;
      p.gridX = 1;
      p.gridY = 1;

      // @ts-expect-error accessing private for test
      expect(player.canMove(Direction.RIGHT)).toBe(true);
    });

    it("out-of-bounds returns false", () => {
      const grid = gridFromPattern(["WWWWW", "W...W", "WWWWW"]);
      const player = createPlayer(grid, 5, 3);
      const p = player as any;
      p.gridX = 0;
      p.gridY = 0;

      // @ts-expect-error accessing private for test
      expect(player.canMove(Direction.UP)).toBe(false);
    });
  });

  describe("update", () => {
    it("normal movement advances position", () => {
      const grid = gridFromPattern([
        "WWWWWWW",
        "W.....W",
        "W.....W",
        "W.....W",
        "W.....W",
        "W.....W",
        "WWWWWWW",
      ]);
      const player = createPlayer(grid, 7, 7, 16, 0, 0, 16);
      const p = player as any;
      p.currentDirection = Direction.DOWN;
      p.gridX = 3;
      p.gridY = 1;
      player.x = 0 + 3 * 16 + 8;
      player.y = 0 + 1 * 16 + 8;

      player.update(1000);

      expect(player.y).toBeGreaterThan(0 + 1 * 16 + 8);
    });

    it("wall collision snaps to current cell center", () => {
      const grid = gridFromPattern([
        "WWWWWWW",
        "W.WW...",
        "W......",
        "W......",
        "W......",
        "W......",
        "WWWWWWW",
      ]);
      const player = createPlayer(grid, 7, 7, 16, 0, 0, 16);
      const p = player as any;
      p.currentDirection = Direction.RIGHT;
      p.gridX = 1;
      p.gridY = 1;
      player.x = 0 + 1 * 16 + 8;
      player.y = 0 + 1 * 16 + 8;

      player.update(1000);

      expect(player.x).toBe(0 + 1 * 16 + 8);
      expect(player.y).toBe(0 + 1 * 16 + 8);
    });
  });

  describe("respawn", () => {
    it("clears both current and next direction", () => {
      const grid = gridFromPattern(["WWWWW", "W...W", "WWWWW"]);
      const player = createPlayer(grid, 5, 3);
      const p = player as any;
      p.currentDirection = Direction.RIGHT;
      p.nextDirection = Direction.DOWN;

      player.respawn();

      expect(player.getCurrentDirection()).toBe(Direction.NONE);
      expect(p.nextDirection).toBe(Direction.NONE);
    });
  });
});
