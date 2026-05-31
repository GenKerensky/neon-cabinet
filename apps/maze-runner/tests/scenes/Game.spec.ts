import { describe, expect, it, vi } from "vitest";

const mockSceneTransitions = vi.hoisted(() => ({
  fadeInScene: vi.fn(),
  launchSceneWithFade: vi.fn(),
}));

vi.mock("phaser", () => ({
  GameObjects: {
    Container: class {},
    Sprite: class {},
    Graphics: class {},
    Text: class {},
    Rectangle: class {},
  },
  Math: {
    Vector2: class {
      constructor(
        public x = 0,
        public y = 0,
      ) {}
    },
  },
  Display: {
    Color: {
      HexStringToColor: (hex: string) => ({
        color: parseInt(hex.replace("#", ""), 16) || 0,
      }),
    },
  },
  Input: {},
  Scene: class {},
}));

vi.mock("../../src/game/utils/MazeGenerator", () => ({
  CellType: {
    WALL: 0,
    PASSAGE: 1,
  },
  MazeGenerator: class {
    create() {
      return [
        [
          { type: 0, visited: false },
          { type: 0, visited: false },
          { type: 0, visited: false },
          { type: 0, visited: false },
          { type: 0, visited: false },
        ],
        [
          { type: 0, visited: false },
          { type: 1, visited: false },
          { type: 1, visited: false },
          { type: 1, visited: false },
          { type: 0, visited: false },
        ],
        [
          { type: 0, visited: false },
          { type: 1, visited: false },
          { type: 1, visited: false },
          { type: 1, visited: false },
          { type: 0, visited: false },
        ],
        [
          { type: 0, visited: false },
          { type: 1, visited: false },
          { type: 1, visited: false },
          { type: 1, visited: false },
          { type: 0, visited: false },
        ],
        [
          { type: 0, visited: false },
          { type: 0, visited: false },
          { type: 0, visited: false },
          { type: 0, visited: false },
          { type: 0, visited: false },
        ],
      ];
    }
  },
}));

vi.mock("../../src/game/objects/Player", () => ({
  Player: class {
    x = 0;
    y = 0;
    triggerDeath = vi.fn((callback?: () => void) => callback?.());
    respawn = vi.fn();
    startInvulnerability = vi.fn();
    update = vi.fn();
    setDirection = vi.fn();
    getCurrentDirection = vi.fn(() => 0);
    getGridX = vi.fn(() => 0);
    getGridY = vi.fn(() => 0);
    isDyingState = vi.fn(() => false);
    setScale = vi.fn();
    constructor(..._args: any[]) {}
  },
}));

const mockHighScore = vi.hoisted(() => ({
  readHighScore: vi.fn(() => 500),
  formatScore: vi.fn((score: number) => score.toString().padStart(6, "0")),
  writeHighScore: vi.fn(),
}));

vi.mock("../../src/game/utils/highScore", () => mockHighScore);

vi.mock("../../src/game/config/ghostDefinitions", () => ({
  buildGhostAiProfile: vi.fn(() => ({
    speed: 80,
    ambusherPredictionCells: 4,
    wandererVectorScale: 2,
    timidDistanceThreshold: 6,
  })),
  getActiveGhostDefinitionsForLevel: vi.fn(() => [
    {
      id: "alpha",
      archetype: "chaser",
      svgCacheKey: "ghost_alpha",
      scatterTarget: { kind: "corner", corner: "topLeft" },
    },
    {
      id: "beta",
      archetype: "timid",
      svgCacheKey: "ghost_beta",
      scatterTarget: { kind: "corner", corner: "topRight" },
    },
  ]),
}));

vi.mock("../../src/game/objects/Collectible", () => ({
  CollectibleType: {
    DOT: "dot",
    POWER_PELLET: "power_pellet",
    BONUS_ITEM: "bonus_item",
  },
  CollectibleManager: class {
    createAll = vi.fn(() => []);
    getCollectibles = vi.fn(() => []);
    isLevelComplete = vi.fn(() => false);
    removeCollectible = vi.fn();
    shouldSpawnBonus = vi.fn(() => false);
    createBonusItem = vi.fn(() => null);
    constructor(..._args: any[]) {}
  },
}));

vi.mock("../../src/game/utils/sceneTransitions", () => mockSceneTransitions);

import { Game } from "../../src/game/scenes/Game";
import { CollectibleType } from "../../src/game/objects/Collectible";
import { EnemyState } from "../../src/game/objects/Enemy";

type MockEnemy = {
  getState: ReturnType<typeof vi.fn>;
  setEnemyState: ReturnType<typeof vi.fn>;
  setDeadReturnTarget: ReturnType<typeof vi.fn>;
  forcePenExit: ReturnType<typeof vi.fn>;
  activateFrightened: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  x: number;
  y: number;
};

function createMockEnemy(state: EnemyState): MockEnemy {
  return {
    getState: vi.fn(() => state),
    setEnemyState: vi.fn(),
    setDeadReturnTarget: vi.fn(),
    forcePenExit: vi.fn(),
    activateFrightened: vi.fn(),
    update: vi.fn(),
    x: 10,
    y: 20,
  };
}

function createGameHarness() {
  const game = new Game();
  const setText = vi.fn();
  const tweensAdd = vi.fn();
  const delayedCall = vi.fn();
  const floatingText = {
    setOrigin: vi.fn(),
    setDepth: vi.fn(),
    destroy: vi.fn(),
  };

  (game as any).countdownActive = false;
  (game as any).deathSequenceActive = false;
  (game as any).modeTimer = 0;
  (game as any).isScatterMode = true;
  (game as any).scatterDuration = 1000;
  (game as any).chaseDuration = 2000;
  (game as any).scoreValue = 0;
  (game as any).scoreText = { setText };
  (game as any).highScoreText = { setText: vi.fn() };
  (game as any).registry = { get: vi.fn(() => "Orbitron") };
  (game as any).add = { text: vi.fn(() => floatingText) };
  (game as any).screenFlashRect = { setAlpha: vi.fn() };
  (game as any).tweens = { add: tweensAdd };
  (game as any).time = { delayedCall };
  (game as any).collectibleManager = {
    isLevelComplete: vi.fn(() => false),
    removeCollectible: vi.fn(),
    shouldSpawnBonus: vi.fn(() => false),
    createBonusItem: vi.fn(),
  };
  (game as any).player = {
    x: 0,
    y: 0,
    update: vi.fn(),
    getCurrentDirection: vi.fn(() => 0),
    getGridX: vi.fn(() => 0),
    getGridY: vi.fn(() => 0),
    isDyingState: vi.fn(() => false),
  };
  (game as any).enemies = [];
  (game as any).wanderers = [];

  return { game, setText, tweensAdd, delayedCall };
}

describe("Game", () => {
  it("fades in during create", () => {
    const game = new Game();
    const handlers: Record<string | number, () => void> = {};

    (game as any).time = { now: 0 };
    (game as any).registry = { get: vi.fn(() => 1) };
    (game as any).cameras = {
      main: {
        width: 800,
        height: 600,
        setPostPipeline: vi.fn(),
      },
    };
    (game as any).add = {
      graphics: vi.fn(() => ({
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        arc: vi.fn(),
        closePath: vi.fn(),
        fillPath: vi.fn(),
        fillStyle: vi.fn(),
        fillCircle: vi.fn(),
        destroy: vi.fn(),
      })),
      rectangle: vi.fn(() => ({ setDepth: vi.fn() })),
      text: vi.fn(() => {
        const textObj: {
          setOrigin: ReturnType<typeof vi.fn>;
          setText: ReturnType<typeof vi.fn>;
        } = {
          setOrigin: vi.fn(() => textObj),
          setText: vi.fn(),
        };
        return textObj;
      }),
    };
    (game as any).physics = { add: { existing: vi.fn(), overlap: vi.fn() } };
    (game as any).input = {
      keyboard: {
        addKey: vi.fn((keyCode: number) => ({
          on: vi.fn((_event: string, handler: () => void) => {
            handlers[keyCode] = handler;
          }),
        })),
        on: vi.fn((event: string, handler: () => void) => {
          const match = event.match(/^keydown-(\d+)$/);
          if (match) handlers[parseInt(match[1], 10)] = handler;
          else handlers[event] = handler;
        }),
      },
    };
    (game as any).collectibleManager = {
      createAll: vi.fn(),
      getCollectibles: vi.fn(() => []),
    };
    (game as any).player = {
      x: 0,
      y: 0,
      setDirection: vi.fn(),
      getCurrentDirection: vi.fn(() => 0),
      getGridX: vi.fn(() => 0),
      getGridY: vi.fn(() => 0),
      update: vi.fn(),
    };
    (game as any).rebuildActiveGhosts = vi.fn();
    (game as any).registerEnemyOverlap = vi.fn();
    (game as any).runCountdown = vi.fn();
    (game as any).renderMaze = vi.fn();
    (game as any).scoreText = { setText: vi.fn() };
    (game as any).levelText = { setOrigin: vi.fn() };
    (game as any).highScoreText = { setOrigin: vi.fn(), setText: vi.fn() };
    (game as any).screenFlashRect = { setAlpha: vi.fn() };

    game.create();

    expect(mockSceneTransitions.fadeInScene).toHaveBeenCalledWith(game);
    handlers["keydown-ESC"]();
    expect(mockSceneTransitions.launchSceneWithFade).toHaveBeenCalledWith(
      game,
      "Pause",
    );
  });

  it("creates gameplay HUD with centered score/high, right level, and life icons", () => {
    const game = new Game();
    const textCalls: Array<{ x: number; y: number; value: string }> = [];
    const iconGraphics: any[] = [];
    const wallGraphics = {
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      closePath: vi.fn(),
      fillPath: vi.fn(),
      fillStyle: vi.fn(),
      fillCircle: vi.fn(),
      destroy: vi.fn(),
    };

    (game as any).time = { now: 0 };
    (game as any).registry = {
      get: vi.fn((k: string) => (k === "difficulty" ? 1 : "Orbitron")),
    };
    (game as any).cameras = {
      main: { width: 800, height: 600, setPostPipeline: vi.fn() },
    };
    (game as any).add = {
      graphics: vi.fn(() => {
        if (!(game as any).wallGraphics) {
          return wallGraphics;
        }
        const icon = {
          fillStyle: vi.fn(),
          fillCircle: vi.fn(),
          beginPath: vi.fn(),
          moveTo: vi.fn(),
          lineTo: vi.fn(),
          closePath: vi.fn(),
          fillPath: vi.fn(),
          destroy: vi.fn(),
        };
        iconGraphics.push(icon);
        return icon;
      }),
      rectangle: vi.fn(() => ({ setDepth: vi.fn() })),
      text: vi.fn((x: number, y: number, value: string) => {
        textCalls.push({ x, y, value });
        const textObj: {
          setOrigin: ReturnType<typeof vi.fn>;
          setText: ReturnType<typeof vi.fn>;
        } = {
          setOrigin: vi.fn(() => textObj),
          setText: vi.fn(),
        };
        return textObj;
      }),
    };
    (game as any).physics = { add: { existing: vi.fn(), overlap: vi.fn() } };
    (game as any).input = {
      keyboard: { addKey: vi.fn(() => ({ on: vi.fn() })), on: vi.fn() },
    };
    (game as any).renderMaze = vi.fn();
    (game as any).rebuildActiveGhosts = vi.fn();
    (game as any).registerEnemyOverlap = vi.fn();
    (game as any).runCountdown = vi.fn();

    game.create();

    expect(textCalls.some((c) => c.value.startsWith("LIVES:"))).toBe(false);
    expect(textCalls.some((c) => c.value.startsWith("SCORE:"))).toBe(true);
    expect(textCalls.some((c) => c.value.startsWith("LEVEL:"))).toBe(true);
    expect(textCalls.some((c) => c.value.startsWith("HIGH:"))).toBe(true);
    expect(textCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ x: 400, y: 20, value: "SCORE: 0" }),
        expect.objectContaining({ x: 780, y: 20, value: "LEVEL: 1" }),
        expect.objectContaining({ x: 400, y: 576, value: "HIGH: 000000" }),
      ]),
    );

    expect(iconGraphics).toHaveLength(3);
    for (const [index, icon] of iconGraphics.entries()) {
      expect(icon.fillCircle).toHaveBeenCalledWith(24 + index * 28, 30, 8);
    }
  });

  it("launches GameOver with fade when the last life is lost", () => {
    const { game } = createGameHarness();
    const triggerDeath = vi.fn((callback: () => void) => callback());

    (game as any).livesValue = 1;
    (game as any).renderLivesHud = vi.fn();
    (game as any).player = { triggerDeath };
    (game as any).scoreValue = 900;

    (game as any).loseLife({ id: "blitz" });

    expect(mockSceneTransitions.launchSceneWithFade).toHaveBeenCalledWith(
      game,
      "GameOver",
      { score: 900, killerGhostId: "blitz" },
    );
  });

  it("keeps updating frightened enemies while ghosts are frozen", () => {
    const game = new Game();
    const enemyUpdate = vi.fn();
    const playerUpdate = vi.fn();

    (game as any).countdownActive = false;
    (game as any).deathSequenceActive = false;
    (game as any).ghostsFrozen = true;
    (game as any).ghostFreezeTimer = 300;
    (game as any).modeTimer = 0;
    (game as any).isScatterMode = true;
    (game as any).enemies = [{ update: enemyUpdate }];
    (game as any).wanderers = [];
    (game as any).collectibleManager = { isLevelComplete: () => false };
    (game as any).player = {
      x: 0,
      y: 0,
      update: playerUpdate,
      getCurrentDirection: () => 0,
      getGridX: () => 0,
      getGridY: () => 0,
    };

    game.update(0, 16);

    expect(playerUpdate).toHaveBeenCalled();
    expect(enemyUpdate).toHaveBeenCalled();
  });

  it("activates frightened behavior for power pellet and increments score", () => {
    const { game, setText } = createGameHarness();
    const chaseEnemy = createMockEnemy(EnemyState.CHASE);
    const deadEnemy = createMockEnemy(EnemyState.DEAD);
    (game as any).enemies = [chaseEnemy, deadEnemy];

    const collectible = {
      getPoints: vi.fn(() => 50),
      getType: vi.fn(() => CollectibleType.POWER_PELLET),
    };

    game.onCollectibleHit({}, collectible);

    expect((game as any).scoreValue).toBe(50);
    expect(setText).toHaveBeenCalledWith("SCORE: 50");
    expect(chaseEnemy.activateFrightened).toHaveBeenCalledTimes(1);
    expect(deadEnemy.activateFrightened).toHaveBeenCalledTimes(1);
  });

  it("does not set FRIGHTENED directly on power pellet", () => {
    const { game } = createGameHarness();
    const enemy = createMockEnemy(EnemyState.CHASE);
    (game as any).enemies = [enemy];

    const collectible = {
      getPoints: vi.fn(() => 10),
      getType: vi.fn(() => CollectibleType.POWER_PELLET),
    };

    game.onCollectibleHit({}, collectible);

    expect(enemy.setEnemyState).not.toHaveBeenCalledWith(EnemyState.FRIGHTENED);
  });

  it("uses Math.max for ghostFreezeTimer extension from power pellet", () => {
    const { game } = createGameHarness();
    const enemy = createMockEnemy(EnemyState.CHASE);
    (game as any).enemies = [enemy];
    (game as any).ghostFreezeTimer = 100;

    const collectible = {
      getPoints: vi.fn(() => 10),
      getType: vi.fn(() => CollectibleType.POWER_PELLET),
    };

    game.onCollectibleHit({}, collectible);

    expect((game as any).ghostFreezeTimer).toBe(300);
  });

  it("skips FRIGHTENED and DEAD enemies during scatter-to-chase transition", () => {
    const { game } = createGameHarness();
    const scatterEnemy = createMockEnemy(EnemyState.SCATTER);
    const frightenedEnemy = createMockEnemy(EnemyState.FRIGHTENED);
    const deadEnemy = createMockEnemy(EnemyState.DEAD);
    (game as any).enemies = [scatterEnemy, frightenedEnemy, deadEnemy];
    (game as any).isScatterMode = true;
    (game as any).modeTimer = 999;
    (game as any).scatterDuration = 1000;

    game.update(0, 1);

    expect(scatterEnemy.setEnemyState).toHaveBeenCalledWith(EnemyState.CHASE);
    expect(frightenedEnemy.setEnemyState).not.toHaveBeenCalled();
    expect(deadEnemy.setEnemyState).not.toHaveBeenCalled();
  });

  it("awards +200 and sets DEAD when frightened enemy is eaten", () => {
    const { game, setText } = createGameHarness();
    const frightenedEnemy = createMockEnemy(EnemyState.FRIGHTENED);

    game.onEnemyHit({}, frightenedEnemy);

    expect((game as any).scoreValue).toBe(200);
    expect(setText).toHaveBeenCalledWith("SCORE: 200");
    expect(frightenedEnemy.setEnemyState).toHaveBeenCalledWith(EnemyState.DEAD);
  });

  it("calls forcePenExit for each ghost rebuilt from definitions", () => {
    const game = new Game();
    const enemyA = createMockEnemy(EnemyState.SCATTER);
    const enemyB = createMockEnemy(EnemyState.SCATTER);

    (game as any).gridWidth = 9;
    (game as any).gridHeight = 9;
    (game as any).tileSize = 30;
    (game as any).offsetX = 0;
    (game as any).offsetY = 0;
    (game as any).levelValue = 1;
    (game as any).enemies = [];
    (game as any).createEnemyFromDefinition = vi
      .fn()
      .mockReturnValueOnce(enemyA)
      .mockReturnValueOnce(enemyB);

    (game as any).rebuildActiveGhosts();

    expect(enemyA.forcePenExit).toHaveBeenCalledTimes(1);
    expect(enemyB.forcePenExit).toHaveBeenCalledTimes(1);
  });

  it("calls forcePenExit for each ghost during resetPositions", () => {
    const game = new Game();
    const enemyA = createMockEnemy(EnemyState.SCATTER);
    const enemyB = createMockEnemy(EnemyState.SCATTER);

    (game as any).gridWidth = 9;
    (game as any).gridHeight = 9;
    (game as any).tileSize = 30;
    (game as any).offsetX = 0;
    (game as any).offsetY = 0;
    (game as any).respawnPlayer = vi.fn();
    (game as any).enemies = [enemyA, enemyB];

    (game as any).resetPositions();

    expect(enemyA.forcePenExit).toHaveBeenCalledTimes(1);
    expect(enemyB.forcePenExit).toHaveBeenCalledTimes(1);
  });

  it("updates gameplay high-score display from max(readHighScore, score) without writes", () => {
    const { game } = createGameHarness();
    const highScoreSetText = vi.fn();
    (game as any).highScoreText = { setText: highScoreSetText };
    mockHighScore.readHighScore.mockReturnValue(500);

    game.onCollectibleHit(
      {},
      {
        getPoints: vi.fn(() => 200),
        getType: vi.fn(() => CollectibleType.DOT),
      },
    );
    expect(highScoreSetText).toHaveBeenLastCalledWith("HIGH: 000500");

    game.onCollectibleHit(
      {},
      {
        getPoints: vi.fn(() => 400),
        getType: vi.fn(() => CollectibleType.DOT),
      },
    );
    expect(highScoreSetText).toHaveBeenLastCalledWith("HIGH: 000600");
    expect(mockHighScore.writeHighScore).not.toHaveBeenCalled();
  });
});
