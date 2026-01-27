import { AUTO, Game, Scale } from "phaser";
import type { Renderer, Types } from "phaser";
import { VectorShader } from "../../../../packages/shaders/src";
import { Boot } from "./scenes/Boot";
import { Title } from "./scenes/Title";
import { Game as MainGame } from "./scenes/Game";
import { GameOver } from "./scenes/GameOver";
import { Pause } from "./scenes/Pause";

const FONT_FAMILY = "Orbitron, sans-serif";

export const initializeGame = (): Game => {
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
    scene: [Boot, Title, MainGame, GameOver, Pause],
    callbacks: {
      postBoot: (gameInstance) => {
        const renderer = gameInstance.renderer as Renderer.WebGL.WebGLRenderer;
        if (renderer.pipelines) {
          renderer.pipelines.addPostPipeline("VectorShader", VectorShader);
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

  return new Game(config);
};
