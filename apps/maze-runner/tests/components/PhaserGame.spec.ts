import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PhaserGame } from "../../src/PhaserGame";

vi.mock("phaser", async (importOriginal) => {
  const actual = await importOriginal<typeof import("phaser")>();

  return {
    ...actual,
    AUTO: "AUTO",
    Scale: {
      ...actual.Scale,
      FIT: "FIT",
    },
    GameObjects: {
      Sprite: class Sprite {},
    },
    Game: vi.fn().mockImplementation(() => ({
      destroy: vi.fn(),
      scene: {
        getScenes: vi.fn(() => []),
      },
      scale: {
        parent: null,
        setZoom: vi.fn(),
      },
      renderer: {
        pipelines: {
          addPostPipeline: vi.fn(),
        },
      },
    })),
  };
});

vi.mock("@neon-cabinet/shaders", () => ({
  VectorShader: {},
}));

vi.mock("@neon-cabinet/sprite-tools", () => ({
  SVGParser: {
    parse: vi.fn(),
  },
  VectorPuppet: class VectorPuppet {},
}));

vi.mock("../../src/game/EventBus", () => ({
  EventBus: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  },
}));

vi.mock("../../src/game/scenes/Boot", () => ({
  Boot: class Boot {},
}));

vi.mock("../../src/game/scenes/Title", () => ({
  Title: class Title {},
}));

vi.mock("../../src/game/scenes/Game", () => ({
  Game: class Game {},
}));

vi.mock("../../src/game/scenes/Pause", () => ({
  Pause: class Pause {},
}));

vi.mock("../../src/game/scenes/GameOver", () => ({
  GameOver: class GameOver {},
}));

vi.mock("../../src/support/helpers/start", () => ({
  registerStartCommand: vi.fn(),
}));

vi.mock("../../src/support/helpers/position-player", () => ({
  registerPositionPlayerCommand: vi.fn(),
}));

vi.mock("../../src/support/helpers/spawn-enemy-at", () => ({
  registerSpawnEnemyAtCommand: vi.fn(),
}));

vi.mock("../../src/support/helpers/clear-collectibles", () => ({
  registerClearCollectiblesCommand: vi.fn(),
}));

vi.mock("../../src/support/helpers/eat-power-pellet", () => ({
  registerEatPowerPelletCommand: vi.fn(),
}));

vi.mock("../../src/support/helpers/set-enemy-state", () => ({
  registerSetEnemyStateCommand: vi.fn(),
}));

vi.mock("../../src/support/helpers/set-enemy-at-grid", () => ({
  registerSetEnemyAtGridCommand: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("PhaserGame", () => {
  it("renders the game container", () => {
    render(createElement(PhaserGame));

    const gameContainer = screen
      .getAllByRole("generic")
      .find((element) => element.id === "phaser-game");

    expect(gameContainer?.id).toBe("phaser-game");
  });
});
