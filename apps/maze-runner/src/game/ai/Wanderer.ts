import { Scene } from "phaser";
import type { MazeCell } from "../utils/MazeGenerator";
import { Direction } from "../utils/DirectionUtils";
import { Enemy, EnemyState } from "../objects/Enemy";

export class Wanderer extends Enemy {
  private chaserGridX = 0;
  private chaserGridY = 0;

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

  setChaserPosition(chaserX: number, chaserY: number): void {
    this.chaserGridX = chaserX;
    this.chaserGridY = chaserY;
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

    const playerGridX = Math.floor((playerX - this.offsetX) / this.tileSize);
    const playerGridY = Math.floor((playerY - this.offsetY) / this.tileSize);

    const targetX = playerGridX + 2 * (playerGridX - this.chaserGridX);
    const targetY = playerGridY + 2 * (playerGridY - this.chaserGridY);

    return {
      x: Math.max(1, Math.min(this.gridWidth - 2, targetX)),
      y: Math.max(1, Math.min(this.gridHeight - 2, targetY)),
    };
  }
}
