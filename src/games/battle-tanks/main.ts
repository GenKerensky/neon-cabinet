import { Boot } from "./scenes/Boot";
import { Title } from "./scenes/Title";
import { GameOver } from "./scenes/GameOver";
import { Game as MainGame } from "./scenes/Game";
import { Pause } from "./scenes/Pause";
import Phaser, { AUTO } from "phaser";
import { VectorShader } from "@/games/_shared/shaders/VectorShader";

export const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  width: 1600,
  height: 1200,
  parent: "phaser-game",
  backgroundColor: "#000000",
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
