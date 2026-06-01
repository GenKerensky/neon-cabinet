import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const mockEventBus = vi.hoisted(() => ({
  emit: vi.fn(),
}));

const mockHighScore = vi.hoisted(() => ({
  readHighScore: vi.fn(() => 1000),
  formatScore: vi.fn((score) => score.toString()),
}));

const mockSceneTransitions = vi.hoisted(() => ({
  fadeInScene: vi.fn(),
  startSceneWithFade: vi.fn(),
}));

const mockVectorPuppets = vi.hoisted(() => ({
  instances: [] as Array<{
    x: number;
    y: number;
    setScale: ReturnType<typeof vi.fn>;
    setDirection: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  }>,
}));

vi.mock("phaser", () => ({
  GameObjects: {
    Container: class {},
    Graphics: class {},
    Rectangle: class {},
    Sprite: class {},
    Text: class {},
  },
  Cameras: {
    Scene2D: {
      Camera: class {},
    },
  },
  Input: {
    Keyboard: {
      Key: class {},
      KeyboardPlugin: class {},
      Events: {},
    },
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
  Scene: class {
    key: string;
    constructor(key: string) {
      this.key = key;
    }
  },
}));

vi.mock("@neon-cabinet/sprite-tools", () => ({
  SVGParser: class {
    parse = vi.fn(() => ({
      viewBox: { x: 0, y: 0, width: 30, height: 30 },
      layers: [],
    }));
  },
  VectorPuppet: class {
    x: number;
    y: number;
    setScale = vi.fn(() => this);
    setDirection = vi.fn(() => this);
    update = vi.fn();

    constructor(_scene: unknown, x: number, y: number, _metadata: unknown) {
      this.x = x;
      this.y = y;
      mockVectorPuppets.instances.push(this);
    }
  },
}));

vi.mock("../../src/game/EventBus", () => ({
  EventBus: mockEventBus,
}));

vi.mock("../../src/game/utils/highScore", () => mockHighScore);
vi.mock("../../src/game/utils/sceneTransitions", () => mockSceneTransitions);

import { Title } from "../../src/game/scenes/Title";

function createTextMock() {
  const text = {
    setOrigin: vi.fn(() => text),
    setAlpha: vi.fn(() => text),
    setDepth: vi.fn(() => text),
  };
  return text;
}

function createGraphicsMock() {
  const graphics = {
    setDepth: vi.fn(() => graphics),
    lineStyle: vi.fn(() => graphics),
    strokeRoundedRect: vi.fn(() => graphics),
    fillStyle: vi.fn(() => graphics),
    fillCircle: vi.fn(() => graphics),
    fillRect: vi.fn(() => graphics),
    strokeRect: vi.fn(() => graphics),
    beginPath: vi.fn(() => graphics),
    moveTo: vi.fn(() => graphics),
    arc: vi.fn(() => graphics),
    closePath: vi.fn(() => graphics),
    fillPath: vi.fn(() => graphics),
    lineTo: vi.fn(() => graphics),
    slice: vi.fn(() => graphics),
    createGeometryMask: vi.fn(() => ({})),
    setVisible: vi.fn(() => graphics),
    generateTexture: vi.fn(() => graphics),
    destroy: vi.fn(() => graphics),
  };
  return graphics;
}

function createContainerMock() {
  const container = {
    scaleX: 1,
    setDepth: vi.fn(() => container),
    setMask: vi.fn(() => container),
    add: vi.fn(() => container),
    setPosition: vi.fn(() => container),
  };
  return container;
}

function createCircleMock() {
  const circle = {
    setDepth: vi.fn(() => circle),
    setAlpha: vi.fn(() => circle),
  };
  return circle;
}

function createTileSpriteMock() {
  const tileSprite = {
    tilePositionX: 0,
    tilePositionY: 0,
    setOrigin: vi.fn(() => tileSprite),
    setDepth: vi.fn(() => tileSprite),
    setAlpha: vi.fn(() => tileSprite),
  };
  return tileSprite;
}

function createScene() {
  const handlers: Record<string, () => void> = {};
  const scene = new Title();
  const keyboard = {
    on: vi.fn((event: string, handler: () => void) => {
      handlers[event] = handler;
    }),
  };
  const input = {
    keyboard,
    on: vi.fn((event: string, handler: () => void) => {
      handlers[event] = handler;
    }),
  };
  Object.assign(scene, {
    add: {
      rectangle: vi.fn(),
      text: vi.fn(() => createTextMock()),
      graphics: vi.fn(() => createGraphicsMock()),
      circle: vi.fn(() => createCircleMock()),
      container: vi.fn(() => createContainerMock()),
      tileSprite: vi.fn(() => createTileSpriteMock()),
      existing: vi.fn(),
    },
    cameras: {
      main: {
        width: 800,
        height: 600,
        setPostPipeline: vi.fn(),
        setBackgroundColor: vi.fn(),
      },
    },
    input,
    registry: {
      get: vi.fn(() => undefined),
      set: vi.fn(),
    },
    scene: {
      start: vi.fn(),
    },
    time: {
      delayedCall: vi.fn((_delay, callback) => {
        handlers["delayedCall"] = callback;
      }),
    },
    tweens: {
      add: vi.fn(),
      chain: vi.fn(),
    },
    sound: {
      play: vi.fn(),
      stopByKey: vi.fn(),
    },
    textures: {
      exists: vi.fn(() => false),
    },
    cache: {
      text: {
        get: vi.fn((key: string) => `<svg id="${key}"></svg>`),
      },
    },
  });
  return { handlers, scene };
}

describe("Title", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVectorPuppets.instances.length = 0;
  });

  afterEach(() => {
    window.history.replaceState({}, "", window.location.pathname);
  });

  it("instantiates with name Title", () => {
    const scene = new Title();
    expect(Reflect.get(scene, "key")).toBe("Title");
  });

  it("emits current-scene-ready during create", () => {
    const { scene } = createScene();

    scene.create();

    expect(mockEventBus.emit).toHaveBeenCalledWith(
      "current-scene-ready",
      scene,
    );
  });

  it("creates title text with color #ffff00", () => {
    const { scene } = createScene();
    scene.create();

    expect(scene.add.text).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      "MAZE RUNNER",
      expect.objectContaining({
        color: "#ffff00",
      }),
    );
  });

  it("creates high score text", () => {
    const { scene } = createScene();
    scene.create();

    expect(scene.add.text).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      "HIGH SCORE: 1000",
      expect.objectContaining({
        color: "#ffffcc",
      }),
    );
  });

  it("plays title music and start sound", () => {
    const { handlers, scene } = createScene();

    scene.create();

    expect((scene as any).sound.play).toHaveBeenCalledWith(
      "maze_runner_title_theme",
      {
        loop: true,
        volume: 0.3,
      },
    );

    handlers["keydown-SPACE"]();

    expect((scene as any).sound.stopByKey).toHaveBeenCalledWith(
      "maze_runner_title_theme",
    );
    expect((scene as any).sound.play).toHaveBeenCalledWith(
      "maze_runner_game_start",
      { volume: 0.65 },
    );
  });

  it("creates bounded attract loop with maze blocks and masked container", () => {
    const { scene } = createScene();
    scene.create();

    expect(scene.add.graphics).toHaveBeenCalled();
    expect(scene.add.container).toHaveBeenCalled();
    expect(scene.tweens.chain).toHaveBeenCalled();
  });

  it("uses vector character assets for the full-width title chase", () => {
    const { scene } = createScene();

    scene.create();

    expect(mockVectorPuppets.instances).toHaveLength(4);
    expect((scene as any).cache.text.get).toHaveBeenCalledWith("player_svg");
    expect((scene as any).cache.text.get).toHaveBeenCalledWith(
      "ghost_chaser_svg",
    );
    expect((scene as any).cache.text.get).toHaveBeenCalledWith(
      "ghost_ambusher_svg",
    );
    expect((scene as any).cache.text.get).toHaveBeenCalledWith(
      "ghost_wanderer_svg",
    );

    for (const puppet of mockVectorPuppets.instances) {
      expect(puppet.setScale).toHaveBeenCalledWith(1.15);
      expect(puppet.setDirection).toHaveBeenCalledWith("RIGHT");
    }
    expect(mockVectorPuppets.instances.map((puppet) => puppet.x)).toEqual([
      0, -44, -88, -132,
    ]);

    expect(scene.tweens.chain).toHaveBeenCalledWith(
      expect.objectContaining({
        tweens: [
          expect.objectContaining({
            x: 884,
            y: 120,
            duration: 8500,
          }),
          expect.objectContaining({
            x: 884,
            y: 324,
            duration: 1700,
          }),
          expect.objectContaining({
            x: -84,
            y: 324,
            duration: 8500,
          }),
          expect.objectContaining({
            x: -84,
            y: 120,
            duration: 1700,
          }),
        ],
      }),
    );

    const chainConfig = vi.mocked(scene.tweens.chain).mock.calls[0][0] as {
      tweens: Array<{ onStart?: () => void }>;
    };
    const chaseGroup = vi.mocked(scene.add.container).mock.results[1]
      .value as ReturnType<typeof createContainerMock>;

    chainConfig.tweens[2].onStart?.();

    expect(chaseGroup.scaleX).toBe(1);
    expect(chaseGroup.setPosition).toHaveBeenCalledWith(884, 324);
    for (const puppet of mockVectorPuppets.instances) {
      expect(puppet.setDirection).toHaveBeenCalledWith("LEFT");
    }
    expect(mockVectorPuppets.instances.map((puppet) => puppet.x)).toEqual([
      0, 44, 88, 132,
    ]);
  });

  it("pre-renders and scrolls a dim maze background", () => {
    const { scene } = createScene();
    scene.create();

    expect(scene.add.tileSprite).toHaveBeenCalledWith(
      400,
      300,
      800,
      600,
      "maze_runner_title_background_maze",
    );

    const tileSprite = vi.mocked(scene.add.tileSprite).mock.results[0]
      .value as ReturnType<typeof createTileSpriteMock>;
    expect(tileSprite.setDepth).toHaveBeenCalledWith(1);
    expect(tileSprite.setAlpha).toHaveBeenCalledWith(0.33);

    scene.update(1000, 1000);

    expect(tileSprite.tilePositionX).toBe(25);
    expect(tileSprite.tilePositionY).toBe(18);
    expect(mockVectorPuppets.instances[0].update).toHaveBeenCalledWith(
      1000,
      1000,
    );
  });

  it("starts Game with fade when SPACE is pressed", () => {
    const { handlers, scene } = createScene();

    scene.create();
    mockEventBus.emit.mockClear();

    handlers["keydown-SPACE"]();

    expect(mockSceneTransitions.startSceneWithFade).toHaveBeenCalledWith(
      scene,
      "Game",
    );
  });

  it("starts Game with fade when ENTER is pressed", () => {
    const { handlers, scene } = createScene();

    scene.create();
    mockEventBus.emit.mockClear();

    handlers["keydown-ENTER"]();

    expect(mockSceneTransitions.startSceneWithFade).toHaveBeenCalledWith(
      scene,
      "Game",
    );
  });

  it("starts Game with fade when the title is clicked", () => {
    const { handlers, scene } = createScene();

    scene.create();
    mockEventBus.emit.mockClear();

    handlers["pointerdown"]();

    expect(mockSceneTransitions.startSceneWithFade).toHaveBeenCalledWith(
      scene,
      "Game",
    );
  });

  it("auto-starts with fade when ?test=1 is in URL", () => {
    window.history.replaceState({}, "", "?test=1");
    const { handlers, scene } = createScene();

    scene.create();

    expect(scene.time.delayedCall).toHaveBeenCalledWith(
      500,
      expect.any(Function),
    );

    handlers["delayedCall"]();

    expect(mockSceneTransitions.startSceneWithFade).toHaveBeenCalledWith(
      scene,
      "Game",
    );
  });
});
