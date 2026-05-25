import { GameObjects, Scene } from "phaser";
import type { MazeCell } from "../utils/MazeGenerator";
import { CellType } from "../utils/MazeGenerator";
import {
  Direction,
  directionToDx,
  directionToDy,
  oppositeDirection,
  getValidDirections,
} from "../utils/DirectionUtils";

export enum EnemyState {
  SCATTER = "scatter",
  CHASE = "chase",
  FRIGHTENED = "frightened",
  DEAD = "dead",
}

export abstract class Enemy extends GameObjects.Sprite {
  protected grid: MazeCell[][];
  protected gridWidth: number;
  protected gridHeight: number;
  protected tileSize: number;
  protected speed: number;
  protected baseSpeed: number;
  protected _state: EnemyState = EnemyState.SCATTER;
  protected gridX: number;
  protected gridY: number;
  protected currentDirection: Direction = Direction.NONE;
  protected scatterTarget: { x: number; y: number };
  protected mazeCenter: { x: number; y: number };
  protected offsetX: number;
  protected offsetY: number;
  protected frightenedTimer = 0;
  protected gateOpenTime = 0;
  protected gameStartTime = 0;
  protected gateCellX = -1;
  protected gateCellY = -1;
  protected vulnerabilityTween: Phaser.Tweens.Tween | null = null;
  protected animationState: string = "";
  protected textureName: string;

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
    super(scene, x, y, texture);
    this.grid = grid;
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.tileSize = tileSize;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.baseSpeed = speed ?? 80;
    this.speed = this.baseSpeed;
    this.gridX = Math.floor((x - offsetX) / tileSize);
    this.gridY = Math.floor((y - offsetY) / tileSize);
    this.scatterTarget = scatterTarget;
    this.textureName = texture;

    if (gateOpenTime !== undefined) {
      this.gateOpenTime = gateOpenTime;
    }
    if (gameStartTime !== undefined) {
      this.gameStartTime = gameStartTime;
    }

    const centerGridX = Math.floor(this.gridWidth / 2);
    const centerGridY = Math.floor(this.gridHeight / 2);
    this.gateCellX = centerGridX;
    this.gateCellY = centerGridY + 2;

    if (this.grid[centerGridY][centerGridX].type === CellType.PASSAGE) {
      this.mazeCenter = { x: centerGridX, y: centerGridY };
    } else {
      const nearest = this.findNearestPassage(centerGridX, centerGridY);
      this.mazeCenter = nearest ?? { x: centerGridX, y: centerGridY };
    }

    scene.add.existing(this);
    scene.physics.add.existing(this);
  }

  abstract getTargetPosition(
    playerX: number,
    playerY: number,
    playerDir: Direction,
  ): { x: number; y: number } | null;

  setEnemyState(newState: EnemyState): void {
    this._state = newState;

    switch (newState) {
      case EnemyState.FRIGHTENED:
        this.speed = this.baseSpeed * 0.5;
        this.frightenedTimer = 8000;
        this.startVulnerabilityAnimation();
        break;
      case EnemyState.CHASE:
      case EnemyState.SCATTER:
        this.speed = this.baseSpeed;
        this.stopVulnerabilityAnimation();
        this.playWalkAnimation();
        break;
      case EnemyState.DEAD:
        this.speed = this.baseSpeed * 4;
        this.stopVulnerabilityAnimation();
        this.playEyesAnimation();
        break;
    }
  }

  private startVulnerabilityAnimation(): void {
    this.setTexture(`${this.textureName}_vulnerable`);

    this.vulnerabilityTween = this.scene.tweens.add({
      targets: this,
      alpha: { from: 1, to: 0.3 },
      duration: this.getFlashDuration(),
      yoyo: true,
      repeat: -1,
    });
  }

  private stopVulnerabilityAnimation(): void {
    if (this.vulnerabilityTween) {
      this.vulnerabilityTween.stop();
      this.vulnerabilityTween = null;
    }
    this.setAlpha(1);
    this.clearTint();
  }

  private getFlashDuration(): number {
    if (this.frightenedTimer < 1000) {
      return 100;
    } else if (this.frightenedTimer < 3000) {
      return 200;
    }
    return 500;
  }

  private getDirectionKey(): string {
    switch (this.currentDirection) {
      case Direction.RIGHT:
        return "right";
      case Direction.LEFT:
        return "left";
      case Direction.UP:
        return "up";
      case Direction.DOWN:
        return "down";
      default:
        return "right";
    }
  }

  private playWalkAnimation(): void {
    if (this._state === EnemyState.DEAD) return;
    const dir = this.getDirectionKey();
    const animKey = `${this.textureName}_walk_${dir}`;
    if (!this.anims.isPlaying || this.animationState !== animKey) {
      this.play(animKey, true);
      this.animationState = animKey;
    }
  }

  private playEyesAnimation(): void {
    const dir = this.getDirectionKey();
    const animKey = `${this.textureName}_eyes_${dir}`;
    this.play(animKey, true);
    this.animationState = animKey;
  }

  update(
    delta: number,
    playerX: number,
    playerY: number,
    playerDir: Direction,
  ): void {
    const dt = delta / 1000;

    if (this._state === EnemyState.FRIGHTENED) {
      this.frightenedTimer -= delta;

      if (this.vulnerabilityTween) {
        this.vulnerabilityTween.stop();
        this.vulnerabilityTween = this.scene.tweens.add({
          targets: this,
          alpha: { from: 1, to: 0.3 },
          duration: this.getFlashDuration(),
          yoyo: true,
          repeat: -1,
        });
      }

      if (this.frightenedTimer <= 0) {
        this.setEnemyState(EnemyState.CHASE);
      }
    }

    if (this._state === EnemyState.DEAD) {
      if (
        this.gridX === this.mazeCenter.x &&
        this.gridY === this.mazeCenter.y
      ) {
        this.setEnemyState(EnemyState.CHASE);
        return;
      }
    }

    if (this.currentDirection === Direction.NONE) {
      this.currentDirection = this.chooseDirection(playerX, playerY, playerDir);
    }

    this.moveStep(dt, playerX, playerY, playerDir);

    if (
      this._state !== EnemyState.FRIGHTENED &&
      this._state !== EnemyState.DEAD
    ) {
      this.playWalkAnimation();
    }
  }

  protected moveStep(
    dt: number,
    playerX: number,
    playerY: number,
    playerDir: Direction,
  ): void {
    const moveAmount = this.speed * dt;
    const dx = directionToDx(this.currentDirection);
    const dy = directionToDy(this.currentDirection);

    const newX = this.x + dx * moveAmount;
    const newY = this.y + dy * moveAmount;

    const nextGridX = this.gridX + dx;
    const nextGridY = this.gridY + dy;
    const centerX =
      this.offsetX + nextGridX * this.tileSize + this.tileSize / 2;
    const centerY =
      this.offsetY + nextGridY * this.tileSize + this.tileSize / 2;

    const prevDistX = centerX - this.x;
    const prevDistY = centerY - this.y;
    const newDistX = centerX - newX;
    const newDistY = centerY - newY;
    const dist = Math.sqrt(newDistX * newDistX + newDistY * newDistY);

    const crossedCenter = prevDistX * newDistX < 0 || prevDistY * newDistY < 0;

    if (dist < 2 || crossedCenter) {
      this.x = centerX;
      this.y = centerY;
      this.gridX = nextGridX;
      this.gridY = nextGridY;
      this.currentDirection = this.chooseDirection(playerX, playerY, playerDir);
    } else if (
      nextGridX >= 0 &&
      nextGridX < this.gridWidth &&
      nextGridY >= 0 &&
      nextGridY < this.gridHeight
    ) {
      if (this.grid[nextGridY][nextGridX].type === CellType.PASSAGE) {
        this.x = newX;
        this.y = newY;
      } else {
        this.snapToCurrentCell();
        this.currentDirection = this.chooseDirection(
          playerX,
          playerY,
          playerDir,
        );
      }
    } else {
      this.snapToCurrentCell();
      this.currentDirection = this.chooseDirection(playerX, playerY, playerDir);
    }
  }

  protected chooseDirection(
    playerX: number,
    playerY: number,
    playerDir: Direction,
  ): Direction {
    if (this._state === EnemyState.FRIGHTENED) {
      return this.randomValidDirection(false);
    }

    if (
      this.isGateClosed() &&
      this.gridX === this.gateCellX &&
      this.gridY === this.gateCellY - 1
    ) {
      return this.randomValidDirection(false);
    }

    const target =
      this._state === EnemyState.DEAD
        ? this.mazeCenter
        : this.getTargetPosition(playerX, playerY, playerDir);

    if (!target) {
      return this.randomValidDirection(false);
    }

    const canReverse = this._state === EnemyState.DEAD;
    let bestDir = Direction.NONE;
    let bestDist = Infinity;

    for (const dir of [
      Direction.UP,
      Direction.DOWN,
      Direction.LEFT,
      Direction.RIGHT,
    ]) {
      const nx = this.gridX + directionToDx(dir);
      const ny = this.gridY + directionToDy(dir);
      if (nx < 0 || nx >= this.gridWidth || ny < 0 || ny >= this.gridHeight)
        continue;
      if (this.grid[ny][nx].type !== CellType.PASSAGE) continue;
      if (!canReverse && dir === oppositeDirection(this.currentDirection))
        continue;

      const dist = Math.abs(nx - target.x) + Math.abs(ny - target.y);
      if (
        dist < bestDist ||
        (dist === bestDist && dir === this.currentDirection)
      ) {
        bestDist = dist;
        bestDir = dir;
      }
    }

    if (bestDir === Direction.NONE) {
      const reverseDir = oppositeDirection(this.currentDirection);
      const rx = this.gridX + directionToDx(reverseDir);
      const ry = this.gridY + directionToDy(reverseDir);
      if (rx >= 0 && rx < this.gridWidth && ry >= 0 && ry < this.gridHeight) {
        if (this.grid[ry][rx].type === CellType.PASSAGE) {
          bestDir = reverseDir;
        }
      }
    }

    if (bestDir === Direction.NONE) {
      return this.currentDirection;
    }

    return bestDir;
  }

  protected isGateClosed(): boolean {
    if (this.gateOpenTime <= 0 || this.gameStartTime <= 0) return false;
    const elapsed = this.scene.time.now - this.gameStartTime;
    return elapsed < this.gateOpenTime;
  }

  protected randomValidDirection(allowReverse: boolean): Direction {
    const dirs = getValidDirections(
      this.gridX,
      this.gridY,
      this.grid,
      this.gridWidth,
      this.gridHeight,
    );

    if (dirs.length === 0) return this.currentDirection;

    const filtered = allowReverse
      ? dirs
      : dirs.filter((d) => d !== oppositeDirection(this.currentDirection));

    if (filtered.length === 0) {
      return oppositeDirection(this.currentDirection);
    }

    return filtered[Math.floor(Math.random() * filtered.length)];
  }

  protected findNearestPassage(
    startX: number,
    startY: number,
  ): { x: number; y: number } | null {
    const queue: { x: number; y: number }[] = [{ x: startX, y: startY }];
    const visited = new Set<string>();
    visited.add(`${startX},${startY}`);

    while (queue.length > 0) {
      const { x, y } = queue.shift()!;
      if (this.grid[y][x].type === CellType.PASSAGE) return { x, y };

      const dirs = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
      ];

      for (const { dx, dy } of dirs) {
        const nx = x + dx;
        const ny = y + dy;
        const key = `${nx},${ny}`;
        if (
          nx >= 0 &&
          nx < this.gridWidth &&
          ny >= 0 &&
          ny < this.gridHeight &&
          !visited.has(key)
        ) {
          visited.add(key);
          queue.push({ x: nx, y: ny });
        }
      }
    }
    return null;
  }

  protected snapToCurrentCell(): void {
    this.x = this.offsetX + this.gridX * this.tileSize + this.tileSize / 2;
    this.y = this.offsetY + this.gridY * this.tileSize + this.tileSize / 2;
  }

  getGridX(): number {
    return this.gridX;
  }

  getGridY(): number {
    return this.gridY;
  }

  getState(): EnemyState {
    return this._state;
  }

  isFrightened(): boolean {
    return this._state === EnemyState.FRIGHTENED;
  }

  getCurrentDirection(): Direction {
    return this.currentDirection;
  }
}
