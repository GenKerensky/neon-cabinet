import { Scene } from "phaser";
import type { MazeCell } from "../utils/MazeGenerator";
import { Direction } from "../utils/DirectionUtils";
import { Enemy, EnemyState } from "../objects/Enemy";

export class Ambusher extends Enemy {
  private predictionCells = 4;

  constructor(
    scene: Scene,
    x: number,
    y: number,
    texture: string,
    grid: MazeCell[][],
    gridWidth: number,
    gridHeight: number,
    tileSize: number,
    offsetX: number,
    offsetY: number,
    scatterTarget: { x: number; y: number },
    speed?: number,
    gateOpenTime?: number,
    gameStartTime?: number,
  ) {
    super(
      scene,
      x,
      y,
      texture,
      grid,
      gridWidth,
      gridHeight,
      tileSize,
      offsetX,
      offsetY,
      scatterTarget,
      speed,
      gateOpenTime,
      gameStartTime,
    );
  }

  getTargetPosition(
    playerX: number,
    playerY: number,
    playerDir: Direction,
  ): { x: number; y: number } | null {
    if (this._state === EnemyState.SCATTER) {
      return this.scatterTarget;
    }
    if (this._state === EnemyState.FRIGHTENED) {
      return null;
    }

    let targetX = Math.floor((playerX - this.offsetX) / this.tileSize);
    let targetY = Math.floor((playerY - this.offsetY) / this.tileSize);

    switch (playerDir) {
      case Direction.UP:
        targetY -= this.predictionCells;
        break;
      case Direction.DOWN:
        targetY += this.predictionCells;
        break;
      case Direction.LEFT:
        targetX -= this.predictionCells;
        break;
      case Direction.RIGHT:
        targetX += this.predictionCells;
        break;
    }

    targetX = Math.max(1, Math.min(this.gridWidth - 2, targetX));
    targetY = Math.max(1, Math.min(this.gridHeight - 2, targetY));

    return { x: targetX, y: targetY };
  }
}
