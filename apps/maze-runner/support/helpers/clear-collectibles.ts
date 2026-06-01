import type { Game as PhaserGame } from "phaser";
import {
  getMazeRunnerGameScene,
  isString,
  type HarnessCommands,
} from "./types";

export function registerClearCollectiblesCommand(
  game: PhaserGame,
  commands: HarnessCommands,
): void {
  commands.clearCollectibles = (type?: unknown) => {
    if (type !== undefined && !isString(type)) return;
    getMazeRunnerGameScene(game)?.clearCollectiblesForDebug(type);
  };
}
