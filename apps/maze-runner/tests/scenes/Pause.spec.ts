import { describe, expect, it, vi } from "vitest";

const mockFadeInScene = vi.hoisted(() => vi.fn());
const mockResumeSceneWithFade = vi.hoisted(() => vi.fn());
const mockStartSceneWithFade = vi.hoisted(() => vi.fn());

const mockEventBus = vi.hoisted(() => ({
  emit: vi.fn(),
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

vi.mock("../../src/game/utils/settings", () => ({
  VectorMode: {
    MONOCHROME: 0,
    COLOR: 1,
  },
}));

vi.mock("../../src/game/utils/sceneTransitions", () => ({
  fadeInScene: mockFadeInScene,
  resumeSceneWithFade: mockResumeSceneWithFade,
  startSceneWithFade: mockStartSceneWithFade,
}));

import { Pause } from "../../src/game/scenes/Pause";

function createTextMock() {
  const text = {
    setOrigin: vi.fn(() => text),
  };
  return text;
}

function createScene() {
  const handlers: Record<string, () => void> = {};
  const registryStore = new Map<string, unknown>();
  const scene = new Pause();
  const keyboard = {
    on: vi.fn((event: string, handler: () => void) => {
      handlers[event] = handler;
    }),
  };
  Object.assign(scene, {
    add: {
      rectangle: vi.fn(),
      text: vi.fn(() => createTextMock()),
    },
    cameras: {
      main: {
        width: 800,
        height: 600,
        setPostPipeline: vi.fn(),
      },
    },
    input: { keyboard },
    registry: {
      get: vi.fn((key: string) => registryStore.get(key)),
      set: vi.fn((key: string, value: unknown) => {
        registryStore.set(key, value);
      }),
    },
    scene: {
      resume: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    },
    tweens: {
      add: vi.fn(),
    },
  });
  return { handlers, scene };
}

describe("Pause", () => {
  it("instantiates with name Pause", () => {
    const scene = new Pause();
    expect(Reflect.get(scene, "key")).toBe("Pause");
  });

  it("emits current-scene-ready during create", () => {
    const { scene } = createScene();

    scene.create();

    expect(mockFadeInScene).toHaveBeenCalledWith(scene);

    expect(mockEventBus.emit).toHaveBeenCalledWith(
      "current-scene-ready",
      scene,
    );
  });

  it("resumes Game and stops Pause when ESC is pressed", () => {
    const { handlers, scene } = createScene();

    scene.create();

    handlers["keydown-ESC"]();

    expect(mockResumeSceneWithFade).toHaveBeenCalledWith(
      scene,
      "Game",
      "Pause",
    );
  });

  it("toggles vector mode when V is pressed", () => {
    const { handlers, scene } = createScene();

    scene.create();
    mockEventBus.emit.mockClear();

    handlers["keydown-V"]();

    expect(scene.registry.set).toHaveBeenCalledWith("vectorMode", 0);
    expect(mockEventBus.emit).toHaveBeenCalledWith("vector-mode-changed", 0);
  });

  it("quits to Title when Q is pressed", () => {
    const { handlers, scene } = createScene();

    scene.create();

    handlers["keydown-Q"]();

    expect(mockStartSceneWithFade).toHaveBeenCalledWith(
      scene,
      "Title",
      undefined,
      {
        stop: ["Game", "Pause"],
      },
    );
  });
});
