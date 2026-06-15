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
    HACK_PICKUP: "hack_pickup",
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
import { HackPickupId } from "../../src/game/config/hackDefinitions";
import { Direction } from "../../src/game/utils/DirectionUtils";
import { CellType, type MazeCell } from "../../src/game/utils/MazeGenerator";
import { MAZE_RUNNER_ACHIEVEMENTS_KEY } from "../../src/game/utils/hackProgression";

type MockEnemy = {
  getState: ReturnType<typeof vi.fn>;
  getGridX: ReturnType<typeof vi.fn>;
  getGridY: ReturnType<typeof vi.fn>;
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
    getGridX: vi.fn(() => 0),
    getGridY: vi.fn(() => 0),
    setEnemyState: vi.fn(),
    setDeadReturnTarget: vi.fn(),
    forcePenExit: vi.fn(),
    activateFrightened: vi.fn(),
    update: vi.fn(),
    x: 15,
    y: 15,
  };
}

function gridFromPattern(pattern: string[]): MazeCell[][] {
  return pattern.map((row) =>
    [...row].map((ch) => ({
      type: ch === "." ? CellType.PASSAGE : CellType.WALL,
      visited: false,
    })),
  );
}

function createGameHarness() {
  const game = new Game();
  const setText = vi.fn();
  const tweensAdd = vi.fn();
  const delayedCall = vi.fn();
  const floatingText = {
    setOrigin: vi.fn(),
    setDepth: vi.fn(),
    setScale: vi.fn(),
    setAlpha: vi.fn(),
    destroy: vi.fn(),
  };

  (game as any).countdownActive = false;
  (game as any).deathSequenceActive = false;
  (game as any).modeTimer = 0;
  (game as any).isScatterMode = true;
  (game as any).scatterDuration = 1000;
  (game as any).chaseDuration = 2000;
  (game as any).scoreValue = 0;
  (game as any).tileSize = 30;
  (game as any).offsetX = 0;
  (game as any).offsetY = 0;
  (game as any).gridWidth = 3;
  (game as any).gridHeight = 3;
  (game as any).grid = [
    [
      { type: 1, visited: false },
      { type: 1, visited: false },
      { type: 1, visited: false },
    ],
    [
      { type: 1, visited: false },
      { type: 1, visited: false },
      { type: 1, visited: false },
    ],
    [
      { type: 1, visited: false },
      { type: 1, visited: false },
      { type: 1, visited: false },
    ],
  ];
  (game as any).scoreText = { setText };
  (game as any).highScoreText = { setText: vi.fn() };
  (game as any).registry = { get: vi.fn(() => "Orbitron") };
  (game as any).add = { text: vi.fn(() => floatingText) };
  (game as any).screenFlashRect = { setAlpha: vi.fn() };
  (game as any).tweens = { add: tweensAdd };
  (game as any).time = { delayedCall };
  (game as any).cameras = {
    main: {
      fadeOut: vi.fn(),
      once: vi.fn(),
    },
  };
  (game as any).playSfx = vi.fn();
  (game as any).collectibleManager = {
    isLevelComplete: vi.fn(() => false),
    removeCollectible: vi.fn(),
    shouldSpawnBonus: vi.fn(() => false),
    createBonusItem: vi.fn(),
  };
  (game as any).player = {
    x: 15,
    y: 15,
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
        lineStyle: vi.fn(),
        fillRoundedRect: vi.fn(),
        strokeRoundedRect: vi.fn(),
        setDepth: vi.fn(),
        destroy: vi.fn(),
      })),
      rectangle: vi.fn(() => ({ setDepth: vi.fn() })),
      text: vi.fn(() => {
        const textObj: {
          setOrigin: ReturnType<typeof vi.fn>;
          setText: ReturnType<typeof vi.fn>;
          setDepth: ReturnType<typeof vi.fn>;
        } = {
          setOrigin: vi.fn(() => textObj),
          setText: vi.fn(),
          setDepth: vi.fn(() => textObj),
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
    (game as any).playSfx = vi.fn();

    game.create();

    expect(mockSceneTransitions.fadeInScene).toHaveBeenCalledWith(game);
    expect((game as any).input.keyboard.on).toHaveBeenCalledWith(
      "keydown-Q",
      expect.any(Function),
    );
    expect((game as any).input.keyboard.on).toHaveBeenCalledWith(
      "keydown-E",
      expect.any(Function),
    );
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
      lineStyle: vi.fn(),
      fillRoundedRect: vi.fn(),
      strokeRoundedRect: vi.fn(),
      setDepth: vi.fn(),
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
          lineStyle: vi.fn(),
          fillRoundedRect: vi.fn(),
          strokeRoundedRect: vi.fn(),
          setDepth: vi.fn(),
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
          setDepth: ReturnType<typeof vi.fn>;
        } = {
          setOrigin: vi.fn(() => textObj),
          setText: vi.fn(),
          setDepth: vi.fn(() => textObj),
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
        expect.objectContaining({ x: 728, y: 42, value: "LEVEL: 1" }),
        expect.objectContaining({ x: 400, y: 576, value: "HIGH: 000000" }),
      ]),
    );

    const lifeIcons = iconGraphics.filter(
      (icon) => icon.fillCircle.mock.calls.length > 0,
    );
    const hackSlotBackgrounds = iconGraphics.filter(
      (icon) => icon.fillRoundedRect.mock.calls.length > 0,
    );
    expect(lifeIcons).toHaveLength(3);
    expect(hackSlotBackgrounds).toHaveLength(2);
    for (const [index, icon] of lifeIcons.entries()) {
      expect(icon.x).toBe(72 + index * 24);
      expect(icon.y).toBe(70);
      expect(icon.fillCircle).toHaveBeenCalledWith(0, 0, 11);
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

  it("plays pellet and power-pellet sounds when collectibles are eaten", () => {
    const { game } = createGameHarness();
    const playSfx = (game as any).playSfx;

    game.onCollectibleHit(
      {},
      {
        getPoints: vi.fn(() => 10),
        getType: vi.fn(() => CollectibleType.DOT),
      },
    );

    expect(playSfx).toHaveBeenCalledWith("maze_runner_pellet", {
      volume: 0.35,
    });

    game.onCollectibleHit(
      {},
      {
        getPoints: vi.fn(() => 50),
        getType: vi.fn(() => CollectibleType.POWER_PELLET),
      },
    );

    expect(playSfx).toHaveBeenCalledWith("maze_runner_power_pellet", {
      volume: 0.65,
    });
    expect(playSfx).toHaveBeenCalledWith("maze_runner_ghost_vulnerable", {
      volume: 0.45,
    });
  });

  it("leaves a hack pickup in the maze and shows FULL when its slot is occupied", () => {
    const game = new Game();
    const collectible = {
      x: 50,
      y: 60,
      getType: vi.fn(() => CollectibleType.HACK_PICKUP),
      getHackId: vi.fn(() => HackPickupId.SHIELD_RING),
    };
    (game as any).hackSystem = {
      collectHack: vi.fn(() => ({
        heldHack: HackPickupId.PHASE_CHIP,
        slot: "def",
        collected: false,
        full: true,
      })),
    };
    (game as any).collectibleManager = {
      removeCollectible: vi.fn(),
      shouldSpawnBonus: vi.fn(() => false),
      isLevelComplete: vi.fn(() => false),
    };
    (game as any).refreshHackHud = vi.fn();
    (game as any).showHackEffect = vi.fn();
    (game as any).playSfx = vi.fn();

    game.onCollectibleHit({}, collectible);

    expect(
      (game as any).collectibleManager.removeCollectible,
    ).not.toHaveBeenCalled();
    expect((game as any).showHackEffect).toHaveBeenCalledWith("FULL", 50, 60);
  });

  it("plays movement sound from player motion during update", () => {
    const { game } = createGameHarness();
    const playSfx = (game as any).playSfx;
    (game as any).player.update = vi.fn(function (this: any) {
      (game as any).player.x += 4;
    });

    game.update(1000, 16);

    expect(playSfx).toHaveBeenCalledWith("maze_runner_move", { volume: 0.12 });
  });

  it("paces movement sound with the player's chomp cycle", () => {
    const { game } = createGameHarness();
    const playSfx = (game as any).playSfx;
    (game as any).player.update = vi.fn(function (this: any) {
      (game as any).player.x += 4;
    });

    (game as any).time.now = 1000;
    game.update(1000, 16);
    (game as any).time.now = 1100;
    game.update(1100, 16);
    (game as any).time.now = 1210;
    game.update(1210, 16);

    expect(playSfx).toHaveBeenCalledTimes(2);
    expect(playSfx).toHaveBeenNthCalledWith(1, "maze_runner_move", {
      volume: 0.12,
    });
    expect(playSfx).toHaveBeenNthCalledWith(2, "maze_runner_move", {
      volume: 0.12,
    });
  });

  it("freezes actors and starts victory fade when the last pellet is eaten", () => {
    const { game, delayedCall } = createGameHarness();
    const playSfx = (game as any).playSfx;
    (game as any).collectibleManager.isLevelComplete = vi.fn(() => true);

    game.onCollectibleHit(
      {},
      {
        getPoints: vi.fn(() => 10),
        getType: vi.fn(() => CollectibleType.DOT),
      },
    );

    expect((game as any).levelTransitionActive).toBe(true);
    expect((game as any).countdownActive).toBe(true);
    expect((game as any).ghostsFrozen).toBe(true);
    expect((game as any).ghostFreezeTimer).toBe(Infinity);
    expect(playSfx).toHaveBeenCalledWith("maze_runner_victory", {
      volume: 0.65,
    });
    expect((game as any).cameras.main.fadeOut).toHaveBeenCalledWith(
      500,
      0,
      0,
      0,
    );
    expect(delayedCall).toHaveBeenCalledWith(800, expect.any(Function));
  });

  it("fades the camera back in after loading the next level", () => {
    const { game } = createGameHarness();
    (game as any).levelValue = 1;
    (game as any).levelText = { setText: vi.fn() };
    (game as any).physics = { add: { overlap: vi.fn() } };
    (game as any).collectibleManager.getCollectibles = vi.fn(() => []);
    (game as any).rebuildActiveGhosts = vi.fn();
    (game as any).registerEnemyOverlap = vi.fn();
    (game as any).resetPositions = vi.fn();
    (game as any).runCountdown = vi.fn();

    (game as any).nextLevel();

    expect((game as any).levelValue).toBe(2);
    expect(mockSceneTransitions.fadeInScene).toHaveBeenCalledWith(game);
    expect((game as any).runCountdown).toHaveBeenCalled();
  });

  it("plays a countdown sound for each countdown step", () => {
    const { game } = createGameHarness();
    const playSfx = (game as any).playSfx;

    (game as any).runCountdown();

    expect(playSfx).toHaveBeenCalledWith("maze_runner_countdown", {
      volume: 0.45,
    });
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
    expect((game as any).playSfx).toHaveBeenCalledWith(
      "maze_runner_ghost_eaten",
      { volume: 0.6 },
    );
  });

  it("defeats the first living ghost hit by Null Lance as though eaten", () => {
    const game = new Game();
    const target = createMockEnemy(EnemyState.CHASE);
    target.x = 130;
    target.y = 100;
    (game as any).player = {
      x: 100,
      y: 100,
      getCurrentDirection: vi.fn(() => Direction.RIGHT),
    };
    (game as any).enemies = [target];
    (game as any).grid = gridFromPattern(["WWWWWWW", "W.....W", "WWWWWWW"]);
    (game as any).gridWidth = 7;
    (game as any).gridHeight = 3;
    (game as any).tileSize = 30;
    (game as any).offsetX = -5;
    (game as any).offsetY = 55;
    (game as any).addScore = vi.fn();
    (game as any).showFloatingScore = vi.fn();
    (game as any).playSfx = vi.fn();

    expect((game as any).fireNullLance()).toBe(true);
    expect((game as any).addScore).toHaveBeenCalledWith(200);
    expect((game as any).showFloatingScore).toHaveBeenCalledWith(130, 100, 200);
    expect((game as any).playSfx).toHaveBeenCalledWith(
      "maze_runner_ghost_eaten",
      { volume: 0.6 },
    );
    expect(target.setEnemyState).toHaveBeenCalledWith(EnemyState.DEAD);
  });

  it("does not count Null Lance defeats toward the power-window ghost streak", () => {
    const stored: Record<string, string> = {
      [MAZE_RUNNER_ACHIEVEMENTS_KEY]: "[]",
    };
    const storage = {
      getItem: vi.fn((key: string) => stored[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        stored[key] = value;
      }),
    };
    vi.stubGlobal("localStorage", storage as unknown as Storage);
    const game = new Game();
    const target = createMockEnemy(EnemyState.CHASE);
    target.x = 130;
    target.y = 100;
    (game as any).ghostsEatenInPowerWindow = 2;
    (game as any).player = {
      x: 100,
      y: 100,
      getCurrentDirection: vi.fn(() => Direction.RIGHT),
    };
    (game as any).enemies = [target];
    (game as any).grid = gridFromPattern(["WWWWWWW", "W.....W", "WWWWWWW"]);
    (game as any).gridWidth = 7;
    (game as any).gridHeight = 3;
    (game as any).tileSize = 30;
    (game as any).offsetX = -5;
    (game as any).offsetY = 55;
    (game as any).addScore = vi.fn();
    (game as any).showFloatingScore = vi.fn();
    (game as any).playSfx = vi.fn();

    expect((game as any).fireNullLance()).toBe(true);

    expect((game as any).ghostsEatenInPowerWindow).toBe(2);
    expect(stored[MAZE_RUNNER_ACHIEVEMENTS_KEY]).toBe("[]");
    vi.unstubAllGlobals();
  });

  it("plays player death sound when a life is lost", () => {
    const { game } = createGameHarness();
    const triggerDeath = vi.fn((callback: () => void) => callback());

    (game as any).livesValue = 2;
    (game as any).renderLivesHud = vi.fn();
    (game as any).player = { triggerDeath };

    (game as any).loseLife();

    expect((game as any).playSfx).toHaveBeenCalledWith("maze_runner_death", {
      volume: 0.75,
    });
  });

  it("plays a sound key even before Phaser has created a sound instance", () => {
    const game = new Game();
    const play = vi.fn();
    (game as any).sound = {
      get: vi.fn(() => null),
      play,
    };

    (game as any).playSfx("maze_runner_pellet", { volume: 0.35 });

    expect(play).toHaveBeenCalledWith("maze_runner_pellet", { volume: 0.35 });
  });

  it("ignores enemy sprite overlap when player and enemy are in different grid cells", () => {
    const { game } = createGameHarness();
    const enemy = createMockEnemy(EnemyState.CHASE);
    enemy.getGridX.mockReturnValue(1);
    enemy.getGridY.mockReturnValue(0);
    enemy.x = 45;
    enemy.y = 15;
    (game as any).loseLife = vi.fn();

    game.onEnemyHit({}, enemy);

    expect((game as any).loseLife).not.toHaveBeenCalled();
  });

  it("resolves contact when both actors cover at least half of the same tile", () => {
    const { game } = createGameHarness();
    const enemy = createMockEnemy(EnemyState.CHASE);
    enemy.getGridX.mockReturnValue(1);
    enemy.getGridY.mockReturnValue(0);
    enemy.x = 30;
    enemy.y = 15;
    (game as any).loseLife = vi.fn();

    game.onEnemyHit({}, enemy);

    expect((game as any).loseLife).toHaveBeenCalled();
  });

  it("resolves enemy contact during update when enemy enters the player grid cell", () => {
    const { game } = createGameHarness();
    const enemy = createMockEnemy(EnemyState.CHASE);
    (game as any).enemies = [enemy];
    (game as any).activeGhostDefinitions = [{ id: "alpha" }];
    (game as any).loseLife = vi.fn();

    game.update(0, 16);

    expect((game as any).loseLife).toHaveBeenCalledWith({ id: "alpha" });
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

  describe("harness freeze commands", () => {
    it("freezeGhosts(true) sets ghostsFrozen=true and prevents enemy movement while player still updates", () => {
      const { game } = createGameHarness();
      const enemy = createMockEnemy(EnemyState.CHASE);
      const playerUpdate = vi.fn();
      (game as any).enemies = [enemy];
      (game as any).player = {
        x: 0,
        y: 0,
        update: playerUpdate,
        getCurrentDirection: () => 0,
        getGridX: () => 0,
        getGridY: () => 0,
      };

      game.freezeGhosts(true);

      expect((game as any).ghostsFrozen).toBe(true);

      game.update(0, 16);

      expect(playerUpdate).toHaveBeenCalled();
      expect(enemy.update).toHaveBeenCalledWith(0, 16, 0, 0, 0, true);
    });

    it("unfreezeGhosts() resumes enemy movement", () => {
      const { game } = createGameHarness();
      const enemy = createMockEnemy(EnemyState.CHASE);
      (game as any).enemies = [enemy];
      (game as any).ghostsFrozen = true;
      (game as any).ghostFreezeTimer = 500;
      (game as any).player = {
        x: 0,
        y: 0,
        update: vi.fn(),
        getCurrentDirection: () => 0,
        getGridX: () => 0,
        getGridY: () => 0,
      };

      game.unfreezeGhosts();

      expect((game as any).ghostsFrozen).toBe(false);

      game.update(0, 16);

      expect(enemy.update).toHaveBeenCalledWith(0, 16, 0, 0, 0, false);
    });

    it("multiple toggles work correctly", () => {
      const { game } = createGameHarness();
      (game as any).enemies = [];
      (game as any).player = {
        x: 0,
        y: 0,
        update: vi.fn(),
        getCurrentDirection: () => 0,
        getGridX: () => 0,
        getGridY: () => 0,
      };

      game.toggleFreezeGhosts();
      expect((game as any).ghostsFrozen).toBe(true);

      game.toggleFreezeGhosts();
      expect((game as any).ghostsFrozen).toBe(false);

      game.toggleFreezeGhosts();
      expect((game as any).ghostsFrozen).toBe(true);

      game.toggleFreezeGhosts();
      expect((game as any).ghostsFrozen).toBe(false);
    });

    it("freeze while power-pellet active then unfreeze clears freeze", () => {
      const { game } = createGameHarness();
      const enemy = createMockEnemy(EnemyState.CHASE);
      (game as any).enemies = [enemy];
      (game as any).ghostFreezeTimer = 300;

      const collectible = {
        getPoints: vi.fn(() => 50),
        getType: vi.fn(() => CollectibleType.POWER_PELLET),
      };

      game.onCollectibleHit({}, collectible);
      expect((game as any).ghostsFrozen).toBe(true);

      game.freezeGhosts(true);
      expect((game as any).ghostsFrozen).toBe(true);

      game.unfreezeGhosts();
      expect((game as any).ghostsFrozen).toBe(false);
    });

    it("regression: power-pellet still sets ghostsFrozen", () => {
      const { game } = createGameHarness();
      const enemy = createMockEnemy(EnemyState.CHASE);
      (game as any).enemies = [enemy];

      const collectible = {
        getPoints: vi.fn(() => 50),
        getType: vi.fn(() => CollectibleType.POWER_PELLET),
      };

      game.onCollectibleHit({}, collectible);

      expect((game as any).ghostsFrozen).toBe(true);
      expect((game as any).ghostFreezeTimer).toBe(300);
      expect(enemy.activateFrightened).toHaveBeenCalledTimes(1);
    });
  });
});
