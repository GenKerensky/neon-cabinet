import type { Game as PhaserGame } from "phaser";
import { Chaser } from "../../src/game/ai/Chaser";
import { Ambusher } from "../../src/game/ai/Ambusher";
import { Wanderer } from "../../src/game/ai/Wanderer";
import { Timid } from "../../src/game/ai/Timid";
import { Direction } from "../../src/game/utils/DirectionUtils";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function registerSpawnEnemyAtCommand(
  game: PhaserGame,
  commands: Record<string, (...args: any[]) => void>,
): void {
  commands.spawnEnemyAt = (gridX: number, gridY: number, aiType: string) => {
    const scenes = game.scene.getScenes(true);
    const gameScene = scenes.find((s) => s.scene.key === "Game") as any;
    if (!gameScene) return;

    const tileSize = gameScene.tileSize;
    const offsetX = gameScene.offsetX;
    const offsetY = gameScene.offsetY;
    const ex = offsetX + gridX * tileSize + tileSize / 2;
    const ey = offsetY + gridY * tileSize + tileSize / 2;
    const scatterTarget = { x: 1, y: 1 };

    let enemy: any;
    switch (aiType) {
      case "chaser":
        enemy = new Chaser(
          gameScene,
          ex,
          ey,
          "chaser",
          gameScene.grid,
          gameScene.gridWidth,
          gameScene.gridHeight,
          tileSize,
          offsetX,
          offsetY,
          scatterTarget,
          undefined,
          gameScene.gateOpenTime,
          gameScene.gameStartTime,
        );
        break;
      case "ambusher":
        enemy = new Ambusher(
          gameScene,
          ex,
          ey,
          "ambusher",
          gameScene.grid,
          gameScene.gridWidth,
          gameScene.gridHeight,
          tileSize,
          offsetX,
          offsetY,
          scatterTarget,
          undefined,
          gameScene.gateOpenTime,
          gameScene.gameStartTime,
        );
        break;
      case "wanderer":
        enemy = new Wanderer(
          gameScene,
          ex,
          ey,
          "wanderer",
          gameScene.grid,
          gameScene.gridWidth,
          gameScene.gridHeight,
          tileSize,
          offsetX,
          offsetY,
          scatterTarget,
          undefined,
          gameScene.gateOpenTime,
          gameScene.gameStartTime,
        );
        break;
      default:
        enemy = new Timid(
          gameScene,
          ex,
          ey,
          "timid",
          gameScene.grid,
          gameScene.gridWidth,
          gameScene.gridHeight,
          tileSize,
          offsetX,
          offsetY,
          scatterTarget,
          undefined,
          gameScene.gateOpenTime,
          gameScene.gameStartTime,
        );
        break;
    }

    const dir = enemy.getCurrentDirection();
    const dirKey =
      dir === Direction.LEFT
        ? "left"
        : dir === Direction.RIGHT
          ? "right"
          : dir === Direction.UP
            ? "up"
            : "down";
    enemy.play(`${aiType}_walk_${dirKey}`, true);

    if (!gameScene.enemies) gameScene.enemies = [];
    gameScene.enemies.push(enemy);
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
