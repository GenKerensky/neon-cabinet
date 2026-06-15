import type { Game as PhaserGame } from "phaser";
import {
  getMazeRunnerGameScene,
  isNumber,
  isString,
  type HarnessCommands,
} from "./types";

export function registerSetEnemyAtGridCommand(
  game: PhaserGame,
  commands: HarnessCommands,
): void {
  commands.setEnemyAtGrid = (
    textureOrId: unknown,
    gridX: unknown,
    gridY: unknown,
  ) => {
    if (!isString(textureOrId) || !isNumber(gridX) || !isNumber(gridY)) {
      return;
    }
    getMazeRunnerGameScene(game)?.setEnemyAtGrid(textureOrId, gridX, gridY);
  };
}
