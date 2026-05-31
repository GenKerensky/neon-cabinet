import { afterEach, describe, expect, it, vi } from "vitest";
import { getMazeRunnerStateSnapshot } from "../../src/game/utils/harnessSnapshot";

function createRegistry(values: Record<string, unknown> = {}) {
  const store = new Map<string, unknown>(Object.entries(values));

  return {
    get: vi.fn((key: string) => store.get(key)),
    set: vi.fn((key: string, value: unknown) => {
      store.set(key, value);
    }),
  };
}

function createScene(
  key: string,
  registryValues: Record<string, unknown> = {},
) {
  return {
    scene: { key },
    registry: createRegistry(registryValues),
  } as any;
}

function createGameInstance(scenes: any[]) {
  return {
    scene: {
      getScenes: vi.fn(() => scenes),
    },
  };
}

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("getMazeRunnerStateSnapshot", () => {
  it("returns title-only observability when no Game scene player exists", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    } as unknown as Storage);

    const titleScene = createScene("Title", {
      highScore: 9_012,
      transitionState: "fading-in",
    });
    (titleScene as any).children = {
      list: [{ mask: { geometryMask: {} } }],
    };

    expect(
      getMazeRunnerStateSnapshot(createGameInstance([titleScene])),
    ).toEqual({
      activeScenes: ["Title"],
      highScore: 9_012,
      formattedHighScore: "009012",
      transitionState: "fading-in",
      titleAttract: {
        bounds: { x: 80, y: 40, width: 864, height: 120 },
        maskApplied: true,
        playerCount: 1,
        ghostCount: 3,
      },
    });
  });

  it("returns active-game state plus observability fields", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    } as unknown as Storage);

    const gameScene: any = createScene("Game", {
      highScore: 42,
      transitionState: "fading-out",
    });
    const titleScene = createScene("Title", { highScore: 1 });

    gameScene.player = {
      x: 12,
      y: 34,
      scaleX: 2,
      scaleY: 2,
      getGridX: vi.fn(() => 1),
      getGridY: vi.fn(() => 2),
      getCurrentDirection: vi.fn(() => 3),
      isDyingState: vi.fn(() => false),
    };
    gameScene.enemies = [
      {
        texture: { key: "ghost" },
        getState: vi.fn(() => "CHASE"),
        x: 5,
        y: 6,
        scaleX: 2,
        scaleY: 2,
        getGridX: vi.fn(() => 7),
        getGridY: vi.fn(() => 8),
        getCurrentDirection: vi.fn(() => 9),
        isExitingPen: vi.fn(() => true),
      },
    ];
    gameScene.scoreValue = 100;
    gameScene.livesValue = 2;
    gameScene.levelValue = 4;
    gameScene.collectibleManager = {
      getCollectibles: vi.fn(() => [1, 2, 3]),
    };
    gameScene.gridWidth = 28;
    gameScene.gridHeight = 31;
    gameScene.tileSize = 60;
    gameScene.offsetX = 10;
    gameScene.offsetY = 20;
    gameScene.scoreText = {
      text: "SCORE: 100",
      x: 500,
      y: 20,
      originX: 0.5,
      originY: 0,
    };
    gameScene.levelText = {
      text: "LEVEL: 4",
      x: 980,
      y: 20,
      originX: 1,
      originY: 0,
    };
    gameScene.highScoreText = {
      text: "HIGH: 000100",
      x: 500,
      y: 1180,
      originX: 0.5,
      originY: 1,
    };
    gameScene.lifeIcons = [
      { x: 24, y: 30 },
      { x: 52, y: 30 },
    ];

    expect(
      getMazeRunnerStateSnapshot(createGameInstance([titleScene, gameScene])),
    ).toEqual({
      activeScenes: ["Title", "Game"],
      highScore: 42,
      formattedHighScore: "000042",
      transitionState: "fading-out",
      titleAttract: {
        bounds: { x: 80, y: 40, width: 864, height: 120 },
        maskApplied: false,
        playerCount: 1,
        ghostCount: 3,
      },
      tileSize: 60,
      expectedScale: 2,
      player: {
        gridX: 1,
        gridY: 2,
        x: 12,
        y: 34,
        direction: 3,
        isDying: false,
        scale: {
          x: 2,
          y: 2,
          matchesExpected: true,
        },
        centerline: {
          isCentered: false,
          deltaX: -88,
          deltaY: -136,
          tolerance: 1.2,
        },
      },
      enemies: [
        {
          texture: "ghost",
          state: "CHASE",
          x: 5,
          y: 6,
          gridX: 7,
          gridY: 8,
          direction: 9,
          scale: {
            x: 2,
            y: 2,
            matchesExpected: true,
          },
          pen: {
            inPen: false,
            exitingPen: true,
            atGate: false,
            atExit: false,
          },
          centerline: {
            isCentered: false,
            deltaX: -455,
            deltaY: -524,
            tolerance: 1.2,
          },
        },
      ],
      score: 100,
      lives: 2,
      level: 4,
      collectibles: 3,
      pen: {
        centerX: 14,
        centerY: 15,
        interiorCells: [
          { gridX: 13, gridY: 15 },
          { gridX: 14, gridY: 15 },
          { gridX: 15, gridY: 15 },
          { gridX: 13, gridY: 16 },
          { gridX: 14, gridY: 16 },
          { gridX: 15, gridY: 16 },
        ],
        gateCell: { gridX: 14, gridY: 14 },
        exitCell: { gridX: 14, gridY: 13 },
        topGateRow: 14,
        bottomWallRow: 17,
      },
      hud: {
        score: { text: "SCORE: 100", x: 500, y: 20, originX: 0.5, originY: 0 },
        level: { text: "LEVEL: 4", x: 980, y: 20, originX: 1, originY: 0 },
        highScore: {
          text: "HIGH: 000100",
          x: 500,
          y: 1180,
          originX: 0.5,
          originY: 1,
        },
        livesIcons: {
          count: 2,
          centers: [
            { index: 0, x: 24, y: 30 },
            { index: 1, x: 52, y: 30 },
          ],
        },
      },
      scene: "Game",
    });
  });

  it("handles an empty game instance", () => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    } as unknown as Storage);

    expect(getMazeRunnerStateSnapshot({})).toEqual({
      activeScenes: [],
      highScore: 0,
      formattedHighScore: "000000",
      transitionState: "idle",
    });
  });

  it("returns safe fallback when snapshot throws", () => {
    expect(
      getMazeRunnerStateSnapshot({
        scene: {
          getScenes: vi.fn(() => {
            throw new Error("boom");
          }),
        },
      }),
    ).toEqual({
      activeScenes: [],
      highScore: 0,
      formattedHighScore: "000000",
      transitionState: "idle",
    });
  });
});
