import { GameObjects, Scene } from "phaser";
import type { MazeCell } from "../utils/MazeGenerator";
import { CellType } from "../utils/MazeGenerator";

export enum CollectibleType {
  DOT = "dot",
  POWER_PELLET = "power_pellet",
  BONUS_ITEM = "bonus_item",
}

export interface CollectibleData {
  type: CollectibleType;
  gridX: number;
  gridY: number;
  points: number;
}

export class Collectible extends GameObjects.Sprite {
  private _type: CollectibleType;
  private points: number;

  constructor(
    scene: Scene,
    x: number,
    y: number,
    texture: string,
    type: CollectibleType,
    points: number,
  ) {
    super(scene, x, y, texture);
    this._type = type;
    this.points = points;
    scene.add.existing(this);
    scene.physics.add.existing(this);
  }

  getType(): CollectibleType {
    return this._type;
  }

  getPoints(): number {
    return this.points;
  }
}

export class CollectibleManager {
  private scene: Scene;
  private grid: MazeCell[][];
  private gridWidth: number;
  private gridHeight: number;
  private tileSize: number;
  private collectibles: Collectible[];
  private level: number;
  private dotsCollected: number;
  private totalDots: number;
  private offsetX: number;
  private offsetY: number;

  constructor(
    scene: Scene,
    grid: MazeCell[][],
    gridWidth: number,
    gridHeight: number,
    tileSize: number,
    offsetX: number,
    offsetY: number,
    level: number,
  ) {
    this.scene = scene;
    this.grid = grid;
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.tileSize = tileSize;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.collectibles = [];
    this.level = level;
    this.dotsCollected = 0;
    this.totalDots = 0;
  }

  createAll(): Collectible[] {
    this.collectibles = [];
    const powerPelletPositions = this.getPowerPelletPositions();
    const spawnArea = this.getSpawnArea();

    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        if (this.grid[y][x].type !== CellType.PASSAGE) continue;
        if (this.isInArray(spawnArea, { x, y })) continue;
        if (this.isInArray(powerPelletPositions, { x, y })) {
          this.createCollectible(x, y, CollectibleType.POWER_PELLET, 50);
        } else {
          this.createCollectible(x, y, CollectibleType.DOT, 10);
        }
      }
    }

    this.totalDots = this.collectibles.length;
    return this.collectibles;
  }

  createBonusItem(): Collectible | null {
    if (this.level < 2 || this.level > 7) return null;

    const centerX = Math.floor(this.gridWidth / 2);
    const centerY = Math.floor(this.gridHeight / 2);

    if (this.grid[centerY]?.[centerX]?.type !== CellType.PASSAGE) return null;

    const bonus = this.createCollectible(
      centerX,
      centerY,
      CollectibleType.BONUS_ITEM,
      100,
    );

    this.scene.time.delayedCall(10000, () => {
      if (!bonus.active) return;
      bonus.destroy();
      this.collectibles = this.collectibles.filter((c) => c !== bonus);
    });

    return bonus;
  }

  getCollectibles(): Collectible[] {
    return this.collectibles;
  }

  removeCollectible(collectible: Collectible): void {
    collectible.destroy();
    this.collectibles = this.collectibles.filter((c) => c !== collectible);
    if (collectible.getType() !== CollectibleType.BONUS_ITEM) {
      this.dotsCollected++;
    }
  }

  getDotsCollected(): number {
    return this.dotsCollected;
  }

  getTotalDots(): number {
    return this.totalDots;
  }

  isLevelComplete(): boolean {
    const remainingDots = this.collectibles.filter(
      (c) =>
        c.getType() === CollectibleType.DOT ||
        c.getType() === CollectibleType.POWER_PELLET,
    ).length;
    return remainingDots === 0;
  }

  shouldSpawnBonus(): boolean {
    return (
      this.level >= 2 &&
      this.level <= 7 &&
      this.dotsCollected >= this.totalDots / 2
    );
  }

  private createCollectible(
    gridX: number,
    gridY: number,
    type: CollectibleType,
    points: number,
  ): Collectible {
    const x = this.offsetX + gridX * this.tileSize + this.tileSize / 2;
    const y = this.offsetY + gridY * this.tileSize + this.tileSize / 2;
    const textureName =
      type === CollectibleType.DOT
        ? "dot"
        : type === CollectibleType.POWER_PELLET
          ? "power_pellet"
          : "bonus_item";
    const collectible = new Collectible(
      this.scene,
      x,
      y,
      textureName,
      type,
      points,
    );
    this.collectibles.push(collectible);
    return collectible;
  }

  private getPowerPelletPositions(): { x: number; y: number }[] {
    return [
      { x: 1, y: 1 },
      { x: this.gridWidth - 2, y: 1 },
      { x: 1, y: this.gridHeight - 2 },
      { x: this.gridWidth - 2, y: this.gridHeight - 2 },
    ];
  }

  private getSpawnArea(): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = [];
    const centerX = Math.floor(this.gridWidth / 2);
    const centerY = Math.floor(this.gridHeight / 2);

    for (let y = centerY - 1; y <= centerY + 1; y++) {
      for (let x = centerX - 1; x <= centerX + 1; x++) {
        positions.push({ x, y });
      }
    }

    return positions;
  }

  private isInArray(
    arr: { x: number; y: number }[],
    item: { x: number; y: number },
  ): boolean {
    return arr.some((a) => a.x === item.x && a.y === item.y);
  }
}
