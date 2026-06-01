import type { Game as PhaserGame } from "phaser";
import {
  getMazeRunnerGameScene,
  isNumber,
  isString,
  type HarnessCommands,
} from "./types";

export function registerSpawnEnemyAtCommand(
  game: PhaserGame,
  commands: HarnessCommands,
): void {
  commands.spawnEnemyAt = (gridX: unknown, gridY: unknown, aiType: unknown) => {
    if (!isNumber(gridX) || !isNumber(gridY) || !isString(aiType)) {
      return;
    }
    getMazeRunnerGameScene(game)?.spawnEnemyAtForDebug(gridX, gridY, aiType);
  };
}
