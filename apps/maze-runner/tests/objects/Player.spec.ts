import { existsSync, readFileSync } from "node:fs";
import * as path from "node:path";
import { describe, it, expect, vi } from "vitest";
import * as Phaser from "phaser";

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
    play(_key: string, _ignoreIfPlaying?: boolean): void {
      /* noop */
    }
    on(_event: string, _callback: () => void): void {
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
    arc() {
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
import { Player } from "../../src/game/objects/Player";
import { createMockScene } from "../helpers/createMockScene";
import { SVGParser, VectorPuppet } from "@neon-cabinet/sprite-tools";

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
    grid,
    gridWidth,
    gridHeight,
    tileSize,
    offsetX,
    offsetY,
    speed,
  );
}

function readPlayerSvgFixture(): string {
  const candidates = [
    path.resolve(process.cwd(), "public/assets/vector/player.svg"),
    path.resolve(
      process.cwd(),
      "apps/maze-runner/public/assets/vector/player.svg",
    ),
  ];

  const svgPath = candidates.find((candidate) => existsSync(candidate));
  if (!svgPath) {
    throw new Error(
      "Unable to locate apps/maze-runner/public/assets/vector/player.svg",
    );
  }

  return readFileSync(svgPath, "utf8");
}

function createClassicPlayerScene(tweenConfigs: any[] = []) {
  const scene = createMockScene();
  const playerSvg = `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"></svg>`;

  scene.add.graphics = () =>
    new (Phaser.GameObjects.Graphics as any)(scene, 0, 0);

  scene.cache.text.get = (key: string) => {
    if (key === "player_svg") {
      return playerSvg;
    }
    return "";
  };

  scene.tweens.add = vi.fn((config: any) => {
    tweenConfigs.push(config);
    if (config?.targets && typeof config.targets === "object") {
      if (typeof config.rotation === "number") {
        config.targets.rotation = config.rotation;
      }
      if (typeof config.scaleX === "number") {
        config.targets.scaleX = config.scaleX;
      }
      if (typeof config.x === "number") {
        config.targets.x = config.x;
      }
      if (typeof config.y === "number") {
        config.targets.y = config.y;
      }
    }
    return {
      stop: () => {
        /* noop */
      },
    };
  });

  return scene;
}

const classicPlayerMetadata = {
  viewBox: { x: 0, y: 0, width: 32, height: 32 },
  layers: [
    {
      id: "body",
      type: "circle",
      cx: 16,
      cy: 16,
      r: 14,
      fill: "#998400",
      stroke: "#ffaa00",
      strokeWidth: 2,
      animations: [{ type: "chomp", frequency: 15, amplitude: 80 }],
      directionRotation: { RIGHT: 0, DOWN: 90, LEFT: 180, UP: -90 },
      material: {},
    },
  ],
  sockets: [{ id: "socket_exhaust", x: 2, y: 16, type: "particle" }],
};

describe("Player", () => {
  it("classic player asset uses direction rotation on the body and no eyes or slide range", () => {
    const svg = readPlayerSvgFixture();

    expect(svg).toContain('id="body"');
    expect(svg).toContain("data-anim-chomp");
    expect(svg).toContain("data-direction-rotation");
    expect(svg).not.toContain("eye");
    expect(svg).not.toContain("data-slide-range");
  });

  it.each([Direction.LEFT, Direction.UP, Direction.DOWN])(
    "uses body-layer direction rotation for %s without container rotation or scaleX",
    (direction) => {
      const tweenConfigs: any[] = [];
      const scene = createClassicPlayerScene(tweenConfigs);
      const parseSpy = vi
        .spyOn(SVGParser.prototype as any, "parse")
        .mockReturnValue(classicPlayerMetadata as any);
      const grid = gridFromPattern([
        "WWWWW",
        "W...W",
        "W...W",
        "W...W",
        "WWWWW",
      ]);
      try {
        const player = new Player(scene, 40, 40, grid, 5, 5, 16, 0, 0);
        const playerAny = player as any;
        const bodyLayer = playerAny.layers.get("body");
        const mouthLayer = playerAny.layers.get("body");
        const rotationTarget = playerAny.directionRotationTargets.get("body");
        const originalArc = mouthLayer.arc.bind(mouthLayer);
        let capturedStart = 0;

        mouthLayer.arc = (
          cx: number,
          cy: number,
          r: number,
          start: number,
          end: number,
          anticlockwise: boolean,
        ) => {
          capturedStart = start;
          return originalArc(cx, cy, r, start, end, anticlockwise);
        };

        const originalSetDirection = VectorPuppet.prototype.setDirection;
        const setDirectionSpy = vi
          .spyOn(VectorPuppet.prototype as any, "setDirection")
          .mockImplementation(function (this: any, ...args: any[]) {
            return (originalSetDirection as any).apply(this, args);
          });

        tweenConfigs.length = 0;
        setDirectionSpy.mockClear();

        player.setDirection(direction);
        VectorPuppet.prototype.update.call(player, 16, 0);

        const expectedMouthAngle =
          (Math.sin(16 * 0.001 * 15) + 1) * 0.5 * 80 * (Math.PI / 180);

        expect(setDirectionSpy).toHaveBeenCalled();
        expect(
          tweenConfigs.some(
            (config) =>
              config.targets === player && config.rotation !== undefined,
          ),
        ).toBe(false);
        expect(
          tweenConfigs.some(
            (config) =>
              config.targets === player && config.scaleX !== undefined,
          ),
        ).toBe(false);
        expect(rotationTarget).toBeDefined();
        expect(
          tweenConfigs.some(
            (config) =>
              config.targets === rotationTarget &&
              config.rotation !== undefined,
          ),
        ).toBe(true);
        expect(bodyLayer.x).toBe(-16);
        expect(bodyLayer.y).toBe(-16);
        expect(capturedStart).toBeCloseTo(expectedMouthAngle / 2, 5);

        setDirectionSpy.mockRestore();
      } finally {
        parseSpy.mockRestore();
      }
    },
  );

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
      p.movementDirection = Direction.DOWN;
      p.gridX = 1;
      p.gridY = 1;

      player.setDirection(Direction.RIGHT);

      expect(p.nextDirection).toBe(Direction.RIGHT);
      expect(player.getCurrentDirection()).toBe(Direction.DOWN);
    });

    it("does not rotate early toward a queued valid turn", () => {
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
      const setDirectionSpy = vi.spyOn(
        VectorPuppet.prototype as any,
        "setDirection",
      );

      player.setDirection(Direction.DOWN);
      p.movementDirection = Direction.DOWN;
      p.gridX = 1;
      p.gridY = 1;
      setDirectionSpy.mockClear();

      player.setDirection(Direction.RIGHT);

      expect(p.nextDirection).toBe(Direction.RIGHT);
      expect(player.getCurrentDirection()).toBe(Direction.DOWN);
      expect(setDirectionSpy).not.toHaveBeenCalledWith("RIGHT");

      setDirectionSpy.mockRestore();
    });

    it("commits queued turn at center with movement and visual update in same frame", () => {
      const grid = gridFromPattern([
        "WWWWWWW",
        "W..W..W",
        "W..W..W",
        "W.....W",
        "W..W..W",
        "W..W..W",
        "WWWWWWW",
      ]);
      const player = createPlayer(grid, 7, 7, 16, 0, 0, 16);
      const p = player as any;
      const setDirectionSpy = vi.spyOn(
        VectorPuppet.prototype as any,
        "setDirection",
      );

      player.setDirection(Direction.DOWN);
      p.movementDirection = Direction.DOWN;
      p.gridX = 1;
      p.gridY = 1;
      player.x = 1 * 16 + 8;
      player.y = 1 * 16 + 8;

      setDirectionSpy.mockClear();
      player.setDirection(Direction.RIGHT);
      expect(setDirectionSpy).not.toHaveBeenCalledWith("RIGHT");

      player.update(16, 1000);

      expect(player.getCurrentDirection()).toBe(Direction.RIGHT);
      expect(setDirectionSpy).toHaveBeenCalledWith("RIGHT");
      expect(p.nextDirection).toBe(Direction.NONE);

      setDirectionSpy.mockRestore();
    });

    it("keeps late queued turn until next valid center without snapping backward", () => {
      const grid = gridFromPattern([
        "WWWWWWW",
        "W..W..W",
        "W..W..W",
        "W.....W",
        "W..W..W",
        "W..W..W",
        "WWWWWWW",
      ]);
      const player = createPlayer(grid, 7, 7, 16, 0, 0, 16);
      const p = player as any;

      player.setDirection(Direction.DOWN);
      p.movementDirection = Direction.DOWN;
      p.gridX = 1;
      p.gridY = 3;
      player.x = 1 * 16 + 8;
      player.y = 3 * 16 + 12;

      player.setDirection(Direction.RIGHT);
      const yBefore = player.y;

      player.update(16, 250);

      expect(player.getCurrentDirection()).toBe(Direction.DOWN);
      expect(p.nextDirection).toBe(Direction.RIGHT);
      expect(player.y).toBeGreaterThan(yBefore);
      expect(player.x).toBe(1 * 16 + 8);
    });

    it("applies direction immediately at intersection only when centered", () => {
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
      p.movementDirection = Direction.RIGHT;
      p.gridX = 3;
      p.gridY = 3;
      player.x = 3 * 16 + 8;
      player.y = 3 * 16 + 8;

      player.setDirection(Direction.UP);

      expect(player.getCurrentDirection()).toBe(Direction.UP);
      expect(p.nextDirection).toBe(Direction.NONE);
    });

    it("queues direction at intersection when not centered", () => {
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
      p.movementDirection = Direction.RIGHT;
      p.gridX = 3;
      p.gridY = 3;
      player.x = 3 * 16 + 8;
      player.y = 3 * 16 + 8.8;

      player.setDirection(Direction.UP);

      expect(player.getCurrentDirection()).toBe(Direction.RIGHT);
      expect(p.nextDirection).toBe(Direction.UP);
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
      p.movementDirection = Direction.RIGHT;
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

    it("blocks entering pen from outside through gate", () => {
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
      p.gridX = 2;
      p.gridY = 2;

      // @ts-expect-error accessing private for test
      expect(player.canMove(Direction.RIGHT)).toBe(false);
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
      p.movementDirection = Direction.DOWN;
      p.gridX = 1;
      p.gridY = 1;
      player.x = 0 + 1 * 16 + 8;
      player.y = 0 + 1 * 16 + 8;

      player.update(1000, 1000);

      expect(player.y).toBeGreaterThan(0 + 1 * 16 + 8);
    });

    it("wall collision stops at cell boundary", () => {
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
      p.movementDirection = Direction.RIGHT;
      p.gridX = 1;
      p.gridY = 1;
      player.x = 0 + 1 * 16 + 8;
      player.y = 0 + 1 * 16 + 8;

      player.update(1000, 1000);

      expect(player.x).toBe(0 + (1 + 1) * 16 - 16 / 2);
      expect(player.y).toBe(0 + 1 * 16 + 8);
    });

    it("enforces centerline on horizontal movement", () => {
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
      p.movementDirection = Direction.RIGHT;
      p.gridX = 2;
      p.gridY = 2;
      player.x = 2 * 16 + 8;
      player.y = 2 * 16 + 10;

      player.update(16, 250);

      expect(player.y).toBe(2 * 16 + 8);
    });

    it("enforces centerline on vertical movement", () => {
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
      p.movementDirection = Direction.DOWN;
      p.gridX = 2;
      p.gridY = 2;
      player.x = 2 * 16 + 10;
      player.y = 2 * 16 + 8;

      player.update(16, 250);

      expect(player.x).toBe(2 * 16 + 8);
    });
  });

  describe("respawn", () => {
    it("clears both current and next direction", () => {
      const grid = gridFromPattern(["WWWWW", "W...W", "WWWWW"]);
      const player = createPlayer(grid, 5, 3);
      const p = player as any;
      p.movementDirection = Direction.RIGHT;
      p.nextDirection = Direction.DOWN;

      player.respawn();

      expect(player.getCurrentDirection()).toBe(Direction.NONE);
      expect(p.nextDirection).toBe(Direction.NONE);
    });

    it("restores scale ratio after repeated deaths and respawns", () => {
      const grid = gridFromPattern([
        "WWWWWWW",
        "W.....W",
        "W.....W",
        "W.....W",
        "W.....W",
        "W.....W",
        "WWWWWWW",
      ]);
      const tileSize = 18;
      const expectedScale = tileSize / 30;
      const scene = createMockScene();
      scene.cache.text.get = () => "<svg viewBox='0 0 32 32'></svg>";

      let tweenOnComplete: (() => void) | undefined;
      scene.tweens.add = vi.fn((config: any) => {
        tweenOnComplete = config.onComplete;
        return { stop: vi.fn() };
      });

      const player = new Player(
        scene,
        tileSize + tileSize / 2,
        tileSize + tileSize / 2,
        grid,
        7,
        7,
        tileSize,
        0,
        0,
        100,
      );

      expect((player as any).scale).toBe(expectedScale);

      player.triggerDeath();
      tweenOnComplete?.();
      expect((player as any).scale).toBe(expectedScale);

      player.respawn();
      expect((player as any).scale).toBe(expectedScale);

      player.triggerDeath();
      tweenOnComplete?.();
      player.respawn();
      expect((player as any).scale).toBe(expectedScale);
    });
  });
});
