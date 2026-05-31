import type { Game as PhaserGame } from "phaser";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function registerFreezeGhostsCommand(
  game: PhaserGame,
  commands: Record<string, (...args: any[]) => void>,
): void {
  commands.freezeGhosts = () => {
    const scenes = game.scene.getScenes(true);
    const gameScene = scenes.find((s) => s.scene.key === "Game") as any;
    if (!gameScene) return;

    gameScene.ghostsFrozen = true;
    gameScene.ghostFreezeTimer = Number.MAX_SAFE_INTEGER;
  };

  commands.unfreezeGhosts = () => {
    const scenes = game.scene.getScenes(true);
    const gameScene = scenes.find((s) => s.scene.key === "Game") as any;
    if (!gameScene) return;

    gameScene.ghostsFrozen = false;
    gameScene.ghostFreezeTimer = 0;
  };

  commands.toggleFreezeGhosts = () => {
    const scenes = game.scene.getScenes(true);
    const gameScene = scenes.find((s) => s.scene.key === "Game") as any;
    if (!gameScene) return;

    gameScene.ghostsFrozen = !gameScene.ghostsFrozen;
    gameScene.ghostFreezeTimer = gameScene.ghostsFrozen
      ? Number.MAX_SAFE_INTEGER
      : 0;
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
