import type { Game as PhaserGame } from "phaser";
import { Game as MazeRunnerGameScene } from "../../src/game/scenes/Game";

export type HarnessCommand = (...args: unknown[]) => void;
export type HarnessCommands = Record<string, HarnessCommand>;

export function getMazeRunnerGameScene(
  game: PhaserGame,
): MazeRunnerGameScene | undefined {
  const scene = game.scene.getScene("Game");
  return scene instanceof MazeRunnerGameScene ? scene : undefined;
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isString(value: unknown): value is string {
  return typeof value === "string";
}
