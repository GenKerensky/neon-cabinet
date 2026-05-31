import type { Game as PhaserGame } from "phaser";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function registerClearCollectiblesCommand(
  game: PhaserGame,
  commands: Record<string, (...args: any[]) => void>,
): void {
  commands.clearCollectibles = (type?: string) => {
    const scenes = game.scene.getScenes(true);
    const gameScene = scenes.find((s) => s.scene.key === "Game") as any;
    if (!gameScene?.collectibleManager) return;

    const collectibles = gameScene.collectibleManager.getCollectibles?.();
    if (!collectibles) return;

    const toRemove = collectibles.filter((child: any) => {
      if (!child.active) return false;
      if (type && child.getType() !== type) return false;
      return true;
    });
    toRemove.forEach((child: any) => {
      gameScene.collectibleManager.removeCollectible(child);
    });
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
