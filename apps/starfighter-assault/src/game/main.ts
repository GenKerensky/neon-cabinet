import Phaser from "phaser";
import { VectorShader } from "@neon-cabinet/shaders";
import { GAME_HEIGHT, GAME_WIDTH } from "../utils/settings";
import { Boot } from "./scenes/Boot";
import { Title } from "./scenes/Title";
import { Game } from "./scenes/Game";
import { Pause } from "./scenes/Pause";
import { GameOver } from "./scenes/GameOver";

export function initializeGame(): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: "phaser-game",
    backgroundColor: "#020107",
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: false,
    },
    callbacks: {
      postBoot: (game) => {
        const renderer = game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
        if (renderer.pipelines) {
          renderer.pipelines.addPostPipeline("VectorShader", VectorShader);
        }
      },
    },
    scene: [Boot, Title, Game, Pause, GameOver],
  });
}
