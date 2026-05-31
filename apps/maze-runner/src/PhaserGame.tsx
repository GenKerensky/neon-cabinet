import { forwardRef, useEffect, useLayoutEffect, useRef } from "react";
import { AUTO, Game, Scale } from "phaser";
import type { Renderer, Scene, Types } from "phaser";
import { EventBus } from "./game/EventBus";
import { Boot } from "./game/scenes/Boot";
import { Title } from "./game/scenes/Title";
import { Game as MainGame } from "./game/scenes/Game";
import { Pause } from "./game/scenes/Pause";
import { GameOver } from "./game/scenes/GameOver";
import { VectorShader } from "@neon-cabinet/shaders";
import { CollectibleType } from "./game/objects/Collectible";
import { getMazeRunnerStateSnapshot } from "./game/utils/harnessSnapshot";
import { registerStartCommand } from "../support/helpers/start";
import { registerPositionPlayerCommand } from "../support/helpers/position-player";
import { registerSpawnEnemyAtCommand } from "../support/helpers/spawn-enemy-at";
import { registerClearCollectiblesCommand } from "../support/helpers/clear-collectibles";
import { registerEatPowerPelletCommand } from "../support/helpers/eat-power-pellet";
import { registerSetEnemyStateCommand } from "../support/helpers/set-enemy-state";
import { registerSetEnemyAtGridCommand } from "../support/helpers/set-enemy-at-grid";
import { registerFreezeGhostsCommand } from "../support/helpers/freeze-ghosts";

/* eslint-disable @typescript-eslint/no-explicit-any */
const getGameScene = (gameInstance: any): any => {
  const scenes = gameInstance.scene.getScenes(true);
  return scenes.find((scene: any) => scene.scene.key === "Game");
};

const isTestMode = () => {
  return new URLSearchParams(window.location.search).get("test") === "1";
};

const formatDebugValue = (value: unknown): string => {
  if (value !== null && typeof value === "object") {
    return JSON.stringify(value);
  }
  return JSON.stringify(value);
};

const createPassiveDebugOverlay = (
  gameInstance: Game,
  getGame: () => Game | undefined,
) => {
  (window as unknown as Record<string, unknown>).__NEON_DEBUG_GAME__ =
    gameInstance;
  document.getElementById("neon-debug")?.remove();

  const container = document.createElement("div");
  container.id = "neon-debug";
  Object.assign(container.style, {
    position: "fixed",
    bottom: "8px",
    left: "8px",
    zIndex: "10000",
    background: "rgba(0, 0, 0, 0.75)",
    color: "#0f0",
    fontFamily: "monospace",
    fontSize: "12px",
    padding: "8px 12px",
    borderRadius: "4px",
    whiteSpace: "pre-wrap",
    pointerEvents: "none",
    display:
      localStorage.getItem("neon-debug-overlay-visible") === "false"
        ? "none"
        : "block",
    maxHeight: "40vh",
    overflow: "auto",
  });
  document.body.appendChild(container);

  const writeOverlay = () => {
    const state = getMazeRunnerStateSnapshot(gameInstance) as Record<
      string,
      unknown
    >;
    const lines = ["Scene: ", "Seed: 0"];

    for (const [key, value] of Object.entries(state)) {
      if (value !== null && typeof value === "object") {
        lines.push(`${key}:`);
        for (const [childKey, childValue] of Object.entries(
          value as Record<string, unknown>,
        )) {
          lines.push(`  ${childKey}: ${formatDebugValue(childValue)}`);
        }
      } else {
        lines.push(`${key}: ${formatDebugValue(value)}`);
      }
    }

    container.textContent = lines.join("\n");
  };

  const update = () => {
    if (getGame() !== gameInstance || !container.isConnected) return;
    writeOverlay();
    requestAnimationFrame(update);
  };

  requestAnimationFrame(update);
};

const registerHarnessCommands = (
  gameInstance: any,
  commands: Record<string, (...args: any[]) => void>,
) => {
  commands.move = (direction: number) => {
    const gameScene = getGameScene(gameInstance);
    gameScene?.player?.setDirection?.(direction);
  };

  commands.killPlayer = () => {
    const gameScene = getGameScene(gameInstance);
    gameScene?.loseLife?.();
  };

  commands.eatDot = () => {
    const gameScene = getGameScene(gameInstance);
    if (!gameScene?.collectibleManager) return;

    const collectibles = gameScene.collectibleManager.getCollectibles?.() ?? [];
    const dot = collectibles.find(
      (collectible: any) =>
        collectible.active && collectible.getType?.() === CollectibleType.DOT,
    );

    if (!dot) return;
    gameScene.onCollectibleHit(null, dot);
  };

  commands.triggerLevelTransition = () => {
    const gameScene = getGameScene(gameInstance);
    gameScene?.nextLevel?.();
  };

  registerStartCommand(gameInstance, commands);
  registerPositionPlayerCommand(gameInstance, commands);
  registerSpawnEnemyAtCommand(gameInstance, commands);
  registerClearCollectiblesCommand(gameInstance, commands);
  registerEatPowerPelletCommand(gameInstance, commands);
  registerSetEnemyStateCommand(gameInstance, commands);
  registerSetEnemyAtGridCommand(gameInstance, commands);
  registerFreezeGhostsCommand(gameInstance, commands);
};

const initDebugBridge = (
  gameInstance: Game,
  getGame: () => Game | undefined,
) => {
  if (!isTestMode()) {
    createPassiveDebugOverlay(gameInstance, getGame);
    return;
  }

  import("@neon-cabinet/phaser-test-harness").then(({ createTestHarness }) => {
    import("@neon-cabinet/phaser-debug-bridge").then(
      ({ createDebugBridge }) => {
        if (getGame() !== gameInstance) return;
        (window as unknown as Record<string, unknown>).__NEON_DEBUG_GAME__ =
          gameInstance;
        const commands: Record<string, (...args: unknown[]) => void> = {};
        registerHarnessCommands(
          gameInstance,
          commands as Record<string, (...args: any[]) => void>,
        );
        const harness = createTestHarness(gameInstance, {
          state: () => getMazeRunnerStateSnapshot(gameInstance),
          commands,
        });
        if (harness) {
          createDebugBridge(
            gameInstance,
            harness,
            () => getMazeRunnerStateSnapshot(gameInstance) as any,
          );
        }
      },
    );
  });
};

const cleanupDebugBridge = (gameInstance?: Game) => {
  const w = window as unknown as Record<string, unknown>;
  if (gameInstance && w.__NEON_DEBUG_GAME__ !== gameInstance) return;
  delete w.__PHASER_BRIDGE__;
  delete w.__TEST__;
  delete w.__NEON_DEBUG_GAME__;
  document.getElementById("neon-debug")?.remove();
};

const FONT_FAMILY = "Orbitron, sans-serif";

export interface IRefPhaserGame {
  game: Game | undefined;
  scene: Scene | undefined;
}

interface IProps {
  currentActiveScene?: (scene_instance: Scene) => void;
}

export const PhaserGame = forwardRef<IRefPhaserGame, IProps>(
  function PhaserGame({ currentActiveScene }, ref) {
    const game = useRef<Game | undefined>(undefined);
    const containerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
      if (game.current === undefined) {
        const config: Types.Core.GameConfig & {
          customFontFamily?: string;
        } = {
          type: AUTO,
          width: 1600,
          height: 1200,
          parent: "phaser-game",
          backgroundColor: "#000000",
          customFontFamily: FONT_FAMILY,
          scale: {
            mode: Scale.FIT,
            zoom: 1,
            autoRound: false,
            max: {
              width: 1600,
              height: 1200,
            },
          },
          render: {
            antialias: true,
            pixelArt: false,
            roundPixels: false,
          },
          physics: {
            default: "arcade",
            arcade: {
              debug: false,
            },
          },
          scene: [Boot, Title, MainGame, GameOver, Pause],
          callbacks: {
            postBoot: (gameInstance) => {
              const renderer =
                gameInstance.renderer as Renderer.WebGL.WebGLRenderer;
              if (renderer.pipelines) {
                renderer.pipelines.addPostPipeline(
                  "VectorShader",
                  VectorShader,
                );
              }

              const parent = gameInstance.scale.parent;
              if (parent) {
                const parentWidth = parent.clientWidth;
                const parentHeight = parent.clientHeight;
                const scaleX = Math.floor(parentWidth / 1600);
                const scaleY = Math.floor(parentHeight / 1200);
                const scale = Math.min(scaleX, scaleY);
                if (scale > 0) {
                  gameInstance.scale.setZoom(scale);
                }
              }

              if (import.meta.env.DEV) {
                initDebugBridge(gameInstance, () => game.current);
              }
            },
          },
        };

        game.current = new Game(config);

        if (typeof ref === "function") {
          ref({ game: game.current, scene: undefined });
        } else if (ref) {
          ref.current = { game: game.current, scene: undefined };
        }
      }

      return () => {
        if (game.current) {
          if (import.meta.env.DEV) {
            cleanupDebugBridge(game.current);
          }
          game.current.destroy(true);
          game.current = undefined;
        }
      };
    }, []);

    useEffect(() => {
      const handleSceneReady = (scene_instance: Scene) => {
        if (currentActiveScene && typeof currentActiveScene === "function") {
          currentActiveScene(scene_instance);
        }

        if (typeof ref === "function") {
          ref({ game: game.current, scene: scene_instance });
        } else if (ref) {
          ref.current = { game: game.current, scene: scene_instance };
        }
      };

      EventBus.on("current-scene-ready", handleSceneReady);
      return () => {
        EventBus.off("current-scene-ready", handleSceneReady);
      };
    }, [currentActiveScene]);

    return (
      <div
        id="phaser-game"
        ref={containerRef}
        tabIndex={0}
        style={{ outline: "none", fontFamily: FONT_FAMILY }}
        onMouseDown={(e) => {
          e.currentTarget.focus();
        }}
      />
    );
  },
);
