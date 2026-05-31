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
  };
  return graphics;
}

function createContainerMock() {
  const container = {
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
  });
  return { handlers, scene };
}

describe("Title", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it("creates bounded attract loop with maze blocks and masked container", () => {
    const { scene } = createScene();
    scene.create();

    expect(scene.add.graphics).toHaveBeenCalled();
    expect(scene.add.container).toHaveBeenCalled();
    expect(scene.tweens.add).toHaveBeenCalled();
    expect(scene.tweens.chain).toHaveBeenCalled();
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
