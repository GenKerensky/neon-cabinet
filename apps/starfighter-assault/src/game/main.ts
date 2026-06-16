import Phaser from "phaser";
import { VectorShader } from "@neon-cabinet/shaders";
import { GAME_HEIGHT, GAME_WIDTH } from "../utils/settings";
import { Boot } from "./scenes/Boot";
import { Title } from "./scenes/Title";
import { OpeningCrawl } from "./scenes/OpeningCrawl";
import { Game } from "./scenes/Game";
import { UpgradeShop } from "./scenes/UpgradeShop";
import { Pause } from "./scenes/Pause";
import { GameOver } from "./scenes/GameOver";

export interface StarfighterGameOptions {
  assetBaseUrl?: string;
}

export function initializeGame(
  options: StarfighterGameOptions = {},
): Phaser.Game {
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
      preBoot: (game) => {
        if (options.assetBaseUrl) {
          game.registry.set("assetBaseUrl", options.assetBaseUrl);
        }
      },
      postBoot: (game) => {
        const renderer = game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
        if (renderer.pipelines) {
          renderer.pipelines.addPostPipeline("VectorShader", VectorShader);
        }
      },
    },
    scene: [Boot, Title, OpeningCrawl, Game, UpgradeShop, Pause, GameOver],
  });
}
