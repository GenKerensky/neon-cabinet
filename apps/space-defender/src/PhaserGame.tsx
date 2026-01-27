import { forwardRef, useEffect, useLayoutEffect, useRef } from "react";
import { AUTO, Game, Scale } from "phaser";
import type { Renderer, Scene, Types } from "phaser";
import { EventBus } from "./game/EventBus";
import { Boot } from "./game/scenes/Boot";
import { Title } from "./game/scenes/Title";
import { GameOver } from "./game/scenes/GameOver";
import { Game as MainGame } from "./game/scenes/Game";
import { Pause } from "./game/scenes/Pause";
import { VectorShader } from "../../../packages/shaders/src";

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

              // Calculate integer scale to fill available space
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
          game.current.destroy(true);
          game.current = undefined;
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentActiveScene]);

    return (
      <div
        id="phaser-game"
        tabIndex={0}
        style={{ outline: "none", fontFamily: FONT_FAMILY }}
        onMouseDown={(e) => {
          // Ensure canvas receives focus when clicked
          e.currentTarget.focus();
        }}
      />
    );
  },
);
