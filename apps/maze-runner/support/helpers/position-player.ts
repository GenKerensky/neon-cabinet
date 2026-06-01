import type { Game as PhaserGame } from "phaser";
import {
  getMazeRunnerGameScene,
  isNumber,
  type HarnessCommands,
} from "./types";

export function registerPositionPlayerCommand(
  game: PhaserGame,
  commands: HarnessCommands,
): void {
  commands.teleportPlayer = (gridX: unknown, gridY: unknown) => {
    if (!isNumber(gridX) || !isNumber(gridY)) return;
    getMazeRunnerGameScene(game)?.teleportPlayerToGrid(gridX, gridY);
  };
}
