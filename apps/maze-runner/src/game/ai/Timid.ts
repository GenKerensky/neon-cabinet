import { Scene } from "phaser";
import type { MazeCell } from "../utils/MazeGenerator";
import { Direction } from "../utils/DirectionUtils";
import { Enemy, EnemyState } from "../objects/Enemy";

export class Timid extends Enemy {
  private distanceThreshold = 8;

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

    const playerGridX = Math.floor((playerX - this.offsetX) / this.tileSize);
    const playerGridY = Math.floor((playerY - this.offsetY) / this.tileSize);
    const distance =
      Math.abs(this.gridX - playerGridX) + Math.abs(this.gridY - playerGridY);

    if (distance > this.distanceThreshold) {
      return this.getRandomTarget();
    }

    return {
      x: playerGridX,
      y: playerGridY,
    };
  }

  private getRandomTarget(): { x: number; y: number } {
    const directions = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
    ];

    const validDirs = directions.filter((dir) => {
      const nx = this.gridX + dir.dx;
      const ny = this.gridY + dir.dy;
      return (
        nx > 0 &&
        nx < this.gridWidth - 1 &&
        ny > 0 &&
        ny < this.gridHeight - 1 &&
        this.grid[ny][nx].type === 1
      );
    });

    if (validDirs.length === 0) {
      return { x: this.gridX, y: this.gridY };
    }

    const chosen = validDirs[Math.floor(Math.random() * validDirs.length)];
    return {
      x: Math.max(1, Math.min(this.gridWidth - 2, this.gridX + chosen.dx)),
      y: Math.max(1, Math.min(this.gridHeight - 2, this.gridY + chosen.dy)),
    };
  }
}
