import { Boot } from "./scenes/Boot";
import { Title } from "./scenes/Title";
import { GameOver } from "./scenes/GameOver";
import { Game as MainGame } from "./scenes/Game";
import { Pause } from "./scenes/Pause";
import Phaser, { AUTO } from "phaser";
import { VectorShader } from "@neon-cabinet/games-shared";

export const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  width: 1024,
  height: 768,
  parent: "phaser-game",
  backgroundColor: "#000000",
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
  scene: [Boot, Title, MainGame, GameOver, Pause],
  callbacks: {
    postBoot: (game) => {
      const renderer = game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
      if (renderer.pipelines) {
        renderer.pipelines.addPostPipeline("VectorShader", VectorShader);
      }
    },
  },
};
