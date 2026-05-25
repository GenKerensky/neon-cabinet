import { Scene } from "phaser";
import type { MazeCell } from "../utils/MazeGenerator";
import { Direction } from "../utils/DirectionUtils";
import { Enemy, EnemyState } from "../objects/Enemy";

export class Chaser extends Enemy {
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
    _playerDir: Direction,
  ): { x: number; y: number } | null {
    if (this._state === EnemyState.SCATTER) {
      return this.scatterTarget;
    }
    if (this._state === EnemyState.FRIGHTENED) {
      return null;
    }

    return {
      x: Math.floor((playerX - this.offsetX) / this.tileSize),
      y: Math.floor((playerY - this.offsetY) / this.tileSize),
    };
  }
}
