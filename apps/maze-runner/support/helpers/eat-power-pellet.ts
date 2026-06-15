import type { Game as PhaserGame } from "phaser";
import { getMazeRunnerGameScene, type HarnessCommands } from "./types";

export function registerEatPowerPelletCommand(
  game: PhaserGame,
  commands: HarnessCommands,
): void {
  commands.eatPowerPellet = () => {
    getMazeRunnerGameScene(game)?.eatFirstPowerPelletForDebug();
  };
}
