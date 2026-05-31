import type { Game as PhaserGame } from "phaser";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function registerPositionPlayerCommand(
  game: PhaserGame,
  commands: Record<string, (...args: any[]) => void>,
): void {
  commands.teleportPlayer = (gridX: number, gridY: number) => {
    const scenes = game.scene.getScenes(true);
    const gameScene = scenes.find((s) => s.scene.key === "Game") as any;
    if (!gameScene) return;

    const tileSize = gameScene.tileSize;
    const offsetX = gameScene.offsetX;
    const offsetY = gameScene.offsetY;
    gameScene.player.x = offsetX + gridX * tileSize + tileSize / 2;
    gameScene.player.y = offsetY + gridY * tileSize + tileSize / 2;
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
