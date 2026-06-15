import type { Game as PhaserGame } from "phaser";
import { getMazeRunnerGameScene, type HarnessCommands } from "./types";

export function registerFreezeGhostsCommand(
  game: PhaserGame,
  commands: HarnessCommands,
): void {
  commands.freezeGhosts = () => {
    getMazeRunnerGameScene(game)?.freezeGhosts(true);
  };

  commands.unfreezeGhosts = () => {
    getMazeRunnerGameScene(game)?.unfreezeGhosts();
  };

  commands.toggleFreezeGhosts = () => {
    getMazeRunnerGameScene(game)?.toggleFreezeGhosts();
  };
}
