import type { Game as PhaserGame } from "phaser";
import type { HarnessCommands } from "./types";

export function registerStartCommand(
  game: PhaserGame,
  commands: HarnessCommands,
): void {
  commands.start = () => {
    const titleScene = game.scene.getScene("Title");
    if (titleScene) {
      titleScene.scene.start("Game");
    }
  };
}
