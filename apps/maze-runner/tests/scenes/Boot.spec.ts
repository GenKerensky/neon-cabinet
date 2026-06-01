import { describe, expect, it, vi } from "vitest";

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

import { Boot } from "../../src/game/scenes/Boot";

function createScene() {
  const registryStore = new Map<string, unknown>();
  const scene = new Boot();
  Object.assign(scene, {
    cameras: {
      main: {
        setPostPipeline: vi.fn(),
      },
    },
    game: {
      config: {
        customFontFamily: "Neon Arcade",
      },
    },
    registry: {
      get: vi.fn((key: string) => registryStore.get(key)),
      set: vi.fn((key: string, value: unknown) => {
        registryStore.set(key, value);
      }),
    },
    scene: {
      start: vi.fn(),
    },
  });
  return scene;
}

describe("Boot", () => {
  it("instantiates with name Boot", () => {
    const scene = new Boot();
    expect(Reflect.get(scene, "key")).toBe("Boot");
  });

  it("emits current-scene-ready during create", () => {
    const scene = createScene();

    scene.create();

    expect(mockEventBus.emit).toHaveBeenCalledWith(
      "current-scene-ready",
      scene,
    );
  });

  it("starts Title during create", () => {
    const scene = createScene();

    scene.create();

    expect(scene.scene.start).toHaveBeenCalledWith("Title");
  });

  it("sets fontFamily from game config", () => {
    const scene = createScene();

    scene.create();

    expect(scene.registry.set).toHaveBeenCalledWith(
      "fontFamily",
      "Neon Arcade",
    );
  });

  it("preloads maze-runner sound effects", () => {
    const scene = createScene();
    const loadAudio = vi.fn();
    const loadText = vi.fn();
    Object.assign(scene, {
      load: {
        audio: loadAudio,
        text: loadText,
      },
    });
    (scene as any).generateCollectibleTextures = vi.fn();

    scene.preload();

    expect(loadAudio).toHaveBeenCalledWith(
      "maze_runner_move",
      "assets/audio/player-move.wav",
    );
    expect(loadAudio).toHaveBeenCalledWith(
      "maze_runner_pellet",
      "assets/audio/pellet.wav",
    );
    expect(loadAudio).toHaveBeenCalledWith(
      "maze_runner_power_pellet",
      "assets/audio/power-pellet.wav",
    );
    expect(loadAudio).toHaveBeenCalledWith(
      "maze_runner_death",
      "assets/audio/player-death.wav",
    );
    expect(loadAudio).toHaveBeenCalledWith(
      "maze_runner_ghost_vulnerable",
      "assets/audio/ghost-vulnerable.wav",
    );
    expect(loadAudio).toHaveBeenCalledWith(
      "maze_runner_ghost_eaten",
      "assets/audio/ghost-eaten.wav",
    );
    expect(loadAudio).toHaveBeenCalledWith(
      "maze_runner_countdown",
      "assets/audio/countdown.wav",
    );
    expect(loadAudio).toHaveBeenCalledWith(
      "maze_runner_victory",
      "assets/audio/victory.wav",
    );
    expect(loadAudio).toHaveBeenCalledWith(
      "maze_runner_title_theme",
      "assets/audio/title-theme.wav",
    );
    expect(loadAudio).toHaveBeenCalledWith(
      "maze_runner_game_start",
      "assets/audio/game-start.wav",
    );
    expect(loadAudio).toHaveBeenCalledWith(
      "maze_runner_pause",
      "assets/audio/pause-menu.wav",
    );
    expect(loadAudio).toHaveBeenCalledWith(
      "maze_runner_game_over",
      "assets/audio/game-over.wav",
    );
  });
});
