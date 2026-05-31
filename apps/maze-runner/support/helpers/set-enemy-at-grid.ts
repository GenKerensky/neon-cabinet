import type { Game as PhaserGame } from "phaser";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function registerSetEnemyAtGridCommand(
  game: PhaserGame,
  commands: Record<string, (...args: any[]) => void>,
): void {
  commands.setEnemyAtGrid = (
    textureOrId: string,
    gridX: number,
    gridY: number,
  ) => {
    const scenes = game.scene.getScenes(true);
    const gameScene = scenes.find((s) => s.scene.key === "Game") as any;
    if (!gameScene?.enemies) return;

    const enemy = gameScene.enemies.find((candidate: any) => {
      const texture = candidate.texture?.key ?? candidate.textureName;
      return texture === textureOrId || candidate.textureName === textureOrId;
    });
    if (!enemy) return;

    const tileSize = gameScene.tileSize;
    const offsetX = gameScene.offsetX;
    const offsetY = gameScene.offsetY;
    enemy.x = offsetX + gridX * tileSize + tileSize / 2;
    enemy.y = offsetY + gridY * tileSize + tileSize / 2;
    enemy.gridX = gridX;
    enemy.gridY = gridY;
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
