import { afterEach, describe, expect, it, vi } from "vitest";

const mockStartSceneWithFade = vi.hoisted(() => vi.fn());
const mockFadeInScene = vi.hoisted(() => vi.fn());
const mockEventBus = vi.hoisted(() => ({
  emit: vi.fn(),
}));
const mockVectorPuppets = vi.hoisted(() => ({
  instances: [] as any[],
}));

vi.mock("phaser", () => ({
  GameObjects: {
    Container: class {},
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
  VectorPuppet: class {
    setScale = vi.fn();
    setDirection = vi.fn();
    update = vi.fn();

    constructor(..._args: any[]) {
      mockVectorPuppets.instances.push(this);
    }
  },
  SVGParser: class {
    parse() {
      return {};
    }
  },
}));

vi.mock("../../src/game/EventBus", () => ({
  EventBus: mockEventBus,
}));

vi.mock("../../src/game/utils/sceneTransitions", () => ({
  fadeInScene: mockFadeInScene,
  startSceneWithFade: mockStartSceneWithFade,
}));

import {
  GameOver,
  resolveGameOverKillerPresentation,
} from "../../src/game/scenes/GameOver";
import { MAZE_RUNNER_HIGH_SCORE_KEY } from "../../src/game/utils/highScore";
import { MAZE_RUNNER_BYTES_KEY } from "../../src/game/utils/hackProgression";

function createTextMock() {
  const text = {
    setOrigin: vi.fn(() => text),
  };

  return text;
}

function stubLocalStorage(
  values: Record<string, string> = {},
  options?: { getItemThrows?: boolean; setItemThrows?: boolean },
) {
  const storage = {
    getItem: vi.fn((key: string) => {
      if (options?.getItemThrows) {
        throw new Error("getItem failed");
      }

      return Object.prototype.hasOwnProperty.call(values, key)
        ? values[key]
        : null;
    }),
    setItem: vi.fn((key: string, value: string) => {
      if (options?.setItemThrows) {
        throw new Error("setItem failed");
      }

      values[key] = value;
    }),
  };

  vi.stubGlobal("localStorage", storage as unknown as Storage);

  return storage;
}

function createSceneHarness(options?: {
  score?: number;
  registryHighScore?: unknown;
  localStorageValues?: Record<string, string>;
  localStorageOptions?: { getItemThrows?: boolean; setItemThrows?: boolean };
}) {
  const scene = new GameOver();
  const textCalls: any[][] = [];
  const keyboardHandlers: Record<string, () => void> = {};
  const eventHandlers: Record<string, (time: number, delta: number) => void> =
    {};
  const storage = stubLocalStorage(
    options?.localStorageValues ?? {},
    options?.localStorageOptions,
  );

  Object.assign(scene, {
    add: {
      rectangle: vi.fn(),
      text: vi.fn((...args: any[]) => {
        textCalls.push(args);
        return createTextMock();
      }),
    },
    cameras: {
      main: {
        width: 800,
        height: 600,
        setPostPipeline: vi.fn(),
      },
    },
    cache: {
      text: {
        get: vi.fn((key: string) =>
          key === "ghost_chaser_svg" ? "<svg viewBox='0 0 32 32'></svg>" : "",
        ),
      },
    },
    input: {
      keyboard: {
        on: vi.fn((event: string, handler: () => void) => {
          keyboardHandlers[event] = handler;
        }),
      },
    },
    registry: {
      get: vi.fn((key: string) => {
        if (key === "fontFamily") {
          return "Orbitron";
        }

        if (key === "highScore") {
          return options?.registryHighScore;
        }

        return undefined;
      }),
      set: vi.fn(),
    },
    scene: {
      start: vi.fn(),
      stop: vi.fn(),
    },
    tweens: {
      add: vi.fn(),
    },
    sound: {
      play: vi.fn(),
    },
    events: {
      on: vi.fn(
        (eventName: string, handler: (time: number, delta: number) => void) => {
          eventHandlers[eventName] = handler;
        },
      ),
    },
  });

  scene.init({ score: options?.score ?? 0 });

  return { scene, eventHandlers, keyboardHandlers, storage, textCalls };
}

afterEach(() => {
  vi.clearAllMocks();
  mockVectorPuppets.instances.length = 0;
  vi.unstubAllGlobals();
});

describe("resolveGameOverKillerPresentation", () => {
  it("resolves killer-specific copy and svg cache key from ghost id", () => {
    const resolved = resolveGameOverKillerPresentation({
      killerGhostId: "chaser",
      score: 1200,
    });

    expect(resolved.killerGhostId).toBe("chaser");
    expect(resolved.killerSvgCacheKey).toBe("ghost_chaser_svg");
    expect(resolved.killerHeadline).toBe("Caught by Blitz!");
    expect(resolved.killerSubline).toContain("relentless hunter");
    expect(resolved.killerSubline).toContain("No corners left.");
  });

  it("falls back to generic text when killer id is missing or unknown", () => {
    expect(resolveGameOverKillerPresentation()).toEqual({
      killerGhostId: undefined,
      killerHeadline: "Caught by a Ghost!",
      killerSubline: "The maze always wants one more run.",
      killerSvgCacheKey: undefined,
    });

    expect(
      resolveGameOverKillerPresentation({ killerGhostId: "missing-ghost" }),
    ).toEqual({
      killerGhostId: "missing-ghost",
      killerHeadline: "Caught by a Ghost!",
      killerSubline: "The maze always wants one more run.",
      killerSvgCacheKey: undefined,
    });
  });
});

describe("GameOver", () => {
  it("shows and persists a new high score when the final score beats the previous score", () => {
    const { scene, textCalls, storage } = createSceneHarness({
      score: 1200,
      localStorageValues: {
        [MAZE_RUNNER_HIGH_SCORE_KEY]: "300",
      },
    });

    scene.create();

    expect(mockFadeInScene).toHaveBeenCalledWith(scene);

    expect(storage.setItem).toHaveBeenCalledWith(
      MAZE_RUNNER_HIGH_SCORE_KEY,
      "1200",
    );
    expect(storage.setItem).toHaveBeenCalledWith(MAZE_RUNNER_BYTES_KEY, "12");
    expect(textCalls).toEqual(
      expect.arrayContaining([
        [400, 444, "NEW HIGH SCORE!", expect.any(Object)],
        [400, 474, "HIGH SCORE: 001200", expect.any(Object)],
        [400, 522, "PRESS SPACE TO RESTART", expect.any(Object)],
        [400, 558, "PRESS M FOR MENU", expect.any(Object)],
      ]),
    );
  });

  it("keeps an existing high score display when the final score is lower", () => {
    const { scene, textCalls, storage } = createSceneHarness({
      score: 1200,
      localStorageValues: {
        [MAZE_RUNNER_HIGH_SCORE_KEY]: "2000",
      },
    });

    scene.create();

    expect(mockFadeInScene).toHaveBeenCalledWith(scene);

    expect(storage.setItem).toHaveBeenCalledWith(MAZE_RUNNER_BYTES_KEY, "12");
    expect(storage.setItem).not.toHaveBeenCalledWith(
      MAZE_RUNNER_HIGH_SCORE_KEY,
      expect.any(String),
    );
    expect(textCalls).toEqual(
      expect.arrayContaining([
        [400, 444, "HIGH SCORE: 002000", expect.any(Object)],
      ]),
    );
    expect(textCalls.some((args) => args[2] === "NEW HIGH SCORE!")).toBe(false);
  });

  it("renders safely when high-score storage write fails", () => {
    const { scene, textCalls } = createSceneHarness({
      score: 1200,
      localStorageValues: {
        [MAZE_RUNNER_HIGH_SCORE_KEY]: "300",
      },
      localStorageOptions: {
        setItemThrows: true,
      },
    });

    expect(() => scene.create()).not.toThrow();
    expect(mockFadeInScene).toHaveBeenCalledWith(scene);
    expect(textCalls).toEqual(
      expect.arrayContaining([
        [400, 444, "NEW HIGH SCORE!", expect.any(Object)],
        [400, 474, "HIGH SCORE: 001200", expect.any(Object)],
      ]),
    );
  });

  it("starts fade transitions for restart and menu handlers", () => {
    const { scene, keyboardHandlers } = createSceneHarness({
      score: 1200,
      localStorageValues: {
        [MAZE_RUNNER_HIGH_SCORE_KEY]: "300",
      },
    });

    scene.create();
    expect(mockFadeInScene).toHaveBeenCalledWith(scene);
    mockStartSceneWithFade.mockClear();
    (scene.registry.set as any).mockClear();

    keyboardHandlers["keydown-SPACE"]();
    keyboardHandlers["keydown-M"]();

    expect(mockStartSceneWithFade).toHaveBeenNthCalledWith(
      1,
      scene,
      "Game",
      undefined,
      { stop: ["Game", "GameOver"] },
    );
    expect(mockStartSceneWithFade).toHaveBeenNthCalledWith(
      2,
      scene,
      "Title",
      undefined,
      { stop: ["Game", "GameOver"] },
    );
    expect(scene.registry.set).not.toHaveBeenCalledWith(
      "highScore",
      expect.anything(),
    );
  });

  it("plays game over tune and animates a larger killer ghost", () => {
    const { scene, eventHandlers } = createSceneHarness({
      score: 1200,
      localStorageValues: {
        [MAZE_RUNNER_HIGH_SCORE_KEY]: "300",
      },
    });
    scene.init({ score: 1200, killerGhostId: "chaser" });

    scene.create();

    expect((scene as any).sound.play).toHaveBeenCalledWith(
      "maze_runner_game_over",
      { volume: 0.7 },
    );
    expect(mockVectorPuppets.instances).toHaveLength(1);
    expect(mockVectorPuppets.instances[0].setScale).toHaveBeenCalledWith(2.1);
    expect(mockVectorPuppets.instances[0].setDirection).toHaveBeenCalledWith(
      "RIGHT",
    );

    eventHandlers.update(100, 16);

    expect(mockVectorPuppets.instances[0].update).toHaveBeenCalledWith(100, 16);
  });
});
