"use client";

import { forwardRef, useEffect, useLayoutEffect, useRef } from "react";
import { Orbitron } from "next/font/google";
import Phaser from "phaser";
import { EventBus } from "./EventBus";
import { Boot } from "./scenes/Boot";
import { Title } from "./scenes/Title";
import { GameOver } from "./scenes/GameOver";
import { Game as MainGame } from "./scenes/Game";
import { Pause } from "./scenes/Pause";
import { VectorShader } from "@/games/_shared/shaders/VectorShader";

const orbitron = Orbitron({ subsets: ["latin"], display: "swap" });

export interface IRefPhaserGame {
  game: Phaser.Game | undefined;
  scene: Phaser.Scene | undefined;
}

interface IProps {
  currentActiveScene?: (scene: Phaser.Scene) => void;
}

export const PhaserGame = forwardRef<IRefPhaserGame, IProps>(
  function PhaserGame({ currentActiveScene }, ref) {
    const game = useRef<Phaser.Game | undefined>(undefined);

    useLayoutEffect(() => {
      if (game.current === undefined) {
        const config: Phaser.Types.Core.GameConfig & {
          customFontFamily?: string;
        } = {
          type: Phaser.AUTO,
          width: 1600,
          height: 1200,
          parent: "phaser-game",
          backgroundColor: "#000000",
          customFontFamily: orbitron.style.fontFamily,
          scale: {
            mode: Phaser.Scale.FIT,
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
          scene: [Boot, Title, MainGame, GameOver, Pause],
          callbacks: {
            postBoot: (gameInstance) => {
              const renderer =
                gameInstance.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
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
            },
          },
        };

        game.current = new Phaser.Game(config);

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
    }, [ref]);

    useEffect(() => {
      const handleSceneReady = (scene_instance: Phaser.Scene) => {
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
        EventBus.removeListener("current-scene-ready", handleSceneReady);
      };
    }, [currentActiveScene, ref]);

    return <div id="phaser-game" />;
  },
);
