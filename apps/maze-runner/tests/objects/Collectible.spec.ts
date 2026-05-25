import { describe, it, expect, vi } from "vitest";

vi.mock("phaser", () => {
  class MockGameObject {
    scene: any;
    x: number;
    y: number;
    active = true;
    constructor(scene: any, x: number, y: number, _texture?: string) {
      this.scene = scene;
      this.x = x;
      this.y = y;
    }
    destroy() {
      this.active = false;
    }
  }
  return { GameObjects: { Sprite: MockGameObject }, Scene: class {} };
});

import { CellType } from "../../src/game/utils/MazeGenerator";
import type { MazeCell } from "../../src/game/utils/MazeGenerator";
import {
  CollectibleManager,
  CollectibleType,
} from "../../src/game/objects/Collectible";

function gridFromPattern(pattern: string[]): MazeCell[][] {
  return pattern.map((row) =>
    [...row].map((ch) => ({
      type: ch === "." ? CellType.PASSAGE : CellType.WALL,
      visited: false,
    })),
  );
}

function createMockScene(): any {
  const delayedCallbacks: (() => void)[] = [];
  return {
    add: {
      existing: vi.fn(),
      sprite: vi.fn(),
    },
    physics: {
      add: { existing: vi.fn() },
    },
    time: {
      delayedCall: vi.fn((_ms: number, fn: () => void) => {
        delayedCallbacks.push(fn);
        return {};
      }),
    },
    sys: {
      displayList: { add: vi.fn() },
      updateList: { add: vi.fn() },
      textures: {
        get: vi.fn(),
        addCanvas: vi.fn(),
        exists: vi.fn().mockReturnValue(true),
      },
      queueDepthSort: vi.fn(),
      events: { on: vi.fn(), emit: vi.fn() },
    },
    textures: {
      get: vi.fn(),
      addCanvas: vi.fn(),
      exists: vi.fn().mockReturnValue(true),
    },
    children: { add: vi.fn() },
  };
}

function createManager(
  grid: MazeCell[][],
  gridWidth: number,
  gridHeight: number,
  level = 1,
): CollectibleManager {
  const scene = createMockScene();
  return new CollectibleManager(
    scene,
    grid,
    gridWidth,
    gridHeight,
    16,
    0,
    0,
    level,
  );
}

describe("CollectibleManager", () => {
  describe("createAll", () => {
    it("creates DOTs on all passage cells excluding spawn area", () => {
      const grid = gridFromPattern([
        "WWWWWWW",
        "W.....W",
        "W.....W",
        "W.....W",
        "W.....W",
        "W.....W",
        "WWWWWWW",
      ]);
      const mgr = createManager(grid, 7, 7);
      const collectibles = mgr.createAll();

      const totalPassageCells = 5 * 5;
      const spawnAreaCells = 9;
      const expectedCount = totalPassageCells - spawnAreaCells;
      expect(collectibles.length).toBe(expectedCount);

      const dots = collectibles.filter(
        (c) => c.getType() === CollectibleType.DOT,
      );
      expect(dots.length).toBe(expectedCount - 4);
    });

    it("creates POWER_PELLET at corner positions", () => {
      const grid = gridFromPattern([
        "WWWWWWW",
        "W.....W",
        "W.....W",
        "W.....W",
        "W.....W",
        "W.....W",
        "WWWWWWW",
      ]);
      const mgr = createManager(grid, 7, 7);
      const collectibles = mgr.createAll();

      const powerPellets = collectibles.filter(
        (c) => c.getType() === CollectibleType.POWER_PELLET,
      );
      expect(powerPellets.length).toBe(4);
    });

    it("excludes the 3x3 center spawn area", () => {
      const grid = gridFromPattern([
        "WWWWWWW",
        "W.....W",
        "W.....W",
        "W.....W",
        "W.....W",
        "W.....W",
        "WWWWWWW",
      ]);
      const mgr = createManager(grid, 7, 7);
      const collectibles = mgr.createAll();

      const centerX = 3;
      const centerY = 3;
      for (let gy = centerY - 1; gy <= centerY + 1; gy++) {
        for (let gx = centerX - 1; gx <= centerX + 1; gx++) {
          const found = collectibles.some((c) => {
            const cx = Math.floor((c.x - 0) / 16);
            const cy = Math.floor((c.y - 0) / 16);
            return cx === gx && cy === gy;
          });
          expect(found).toBe(false);
        }
      }
    });
  });

  describe("removeCollectible", () => {
    it("DOT increments dotsCollected", () => {
      const grid = gridFromPattern([
        "WWWWWWW",
        "W.....W",
        "W.....W",
        "W.....W",
        "WWWWWWW",
      ]);
      const mgr = createManager(grid, 7, 5);
      mgr.createAll();

      const dot = mgr
        .getCollectibles()
        .find((c) => c.getType() === CollectibleType.DOT)!;
      const before = mgr.getDotsCollected();
      mgr.removeCollectible(dot);

      expect(mgr.getDotsCollected()).toBe(before + 1);
    });

    it("BONUS_ITEM does not increment dotsCollected", () => {
      const grid = gridFromPattern([
        "WWWWWWW",
        "W.....W",
        "W.....W",
        "W.....W",
        "W.....W",
        "W.....W",
        "WWWWWWW",
      ]);
      const mgr = createManager(grid, 7, 7, 2);
      mgr.createAll();
      const bonus = mgr.createBonusItem()!;

      const before = mgr.getDotsCollected();
      mgr.removeCollectible(bonus);

      expect(mgr.getDotsCollected()).toBe(before);
    });
  });

  describe("isLevelComplete", () => {
    it("returns false when dots remain", () => {
      const grid = gridFromPattern(["WWWWWWW", "W.....W", "WWWWWWW"]);
      const mgr = createManager(grid, 7, 3);
      mgr.createAll();

      expect(mgr.isLevelComplete()).toBe(false);
    });

    it("returns true when all dots removed", () => {
      const grid = gridFromPattern([
        "WWWWWWW",
        "W.....W",
        "W.....W",
        "W.....W",
        "WWWWWWW",
      ]);
      const mgr = createManager(grid, 7, 5);
      mgr.createAll();

      for (const c of [...mgr.getCollectibles()]) {
        mgr.removeCollectible(c);
      }

      expect(mgr.isLevelComplete()).toBe(true);
    });
  });

  describe("shouldSpawnBonus", () => {
    it("returns true at half threshold for level 2-7", () => {
      const grid = gridFromPattern([
        "WWWWWWW",
        "W.....W",
        "W.....W",
        "W.....W",
        "WWWWWWW",
      ]);
      const mgr = createManager(grid, 7, 5, 2);
      mgr.createAll();

      const half = Math.ceil(mgr.getTotalDots() / 2);
      for (let i = 0; i < half; i++) {
        const c = mgr
          .getCollectibles()
          .find((col) => col.getType() !== CollectibleType.BONUS_ITEM);
        if (c) mgr.removeCollectible(c);
      }

      expect(mgr.shouldSpawnBonus()).toBe(true);
    });

    it("returns false for level 1 even if all dots collected", () => {
      const grid = gridFromPattern([
        "WWWWWWW",
        "W.....W",
        "W.....W",
        "W.....W",
        "WWWWWWW",
      ]);
      const mgr = createManager(grid, 7, 5, 1);
      mgr.createAll();

      for (const c of [...mgr.getCollectibles()]) {
        mgr.removeCollectible(c);
      }

      expect(mgr.shouldSpawnBonus()).toBe(false);
    });

    it("returns false below half threshold", () => {
      const grid = gridFromPattern([
        "WWWWWWW",
        "W.....W",
        "W.....W",
        "W.....W",
        "WWWWWWW",
      ]);
      const mgr = createManager(grid, 7, 5, 3);
      mgr.createAll();

      expect(mgr.shouldSpawnBonus()).toBe(false);
    });
  });

  describe("createBonusItem", () => {
    it("creates bonus item at center for valid level", () => {
      const grid = gridFromPattern([
        "WWWWWWW",
        "W.....W",
        "W.....W",
        "W.....W",
        "W.....W",
        "W.....W",
        "WWWWWWW",
      ]);
      const mgr = createManager(grid, 7, 7, 2);
      mgr.createAll();

      const bonus = mgr.createBonusItem();

      expect(bonus).not.toBeNull();
      expect(bonus!.getType()).toBe(CollectibleType.BONUS_ITEM);
    });

    it("returns null for level 1", () => {
      const grid = gridFromPattern(["WWWWWWW", "W.....W", "WWWWWWW"]);
      const mgr = createManager(grid, 7, 3, 1);
      mgr.createAll();

      const bonus = mgr.createBonusItem();

      expect(bonus).toBeNull();
    });
  });
});
