import type { Game as PhaserGame } from "phaser";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function registerStartCommand(
  game: PhaserGame,
  commands: Record<string, (...args: any[]) => void>,
): void {
  commands.start = () => {
    const titleScene = game.scene.getScene("Title");
    if (titleScene) {
      titleScene.scene.start("Game");
    }
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
