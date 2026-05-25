import { GameObjects, Scene } from "phaser";
import type { MazeCell } from "../utils/MazeGenerator";
import { CellType } from "../utils/MazeGenerator";
import {
  Direction,
  directionToDx,
  directionToDy,
} from "../utils/DirectionUtils";

export enum PlayerAnimationState {
  IDLE = "idle",
  WALK_RIGHT = "walk-right",
  WALK_LEFT = "walk-left",
  WALK_UP = "walk-up",
  WALK_DOWN = "walk-down",
  DEATH = "death",
}

export class Player extends GameObjects.Sprite {
  private grid: MazeCell[][];
  private gridWidth: number;
  private gridHeight: number;
  private tileSize: number;
  private speed: number;
  private currentDirection: Direction = Direction.NONE;
  private nextDirection: Direction = Direction.NONE;
  private gridX: number;
  private gridY: number;
  private offsetX: number;
  private offsetY: number;
  private animationState: PlayerAnimationState = PlayerAnimationState.IDLE;
  private isDying = false;
  private onDeathComplete?: () => void;

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
    speed?: number,
  ) {
    super(scene, x, y, texture);
    this.grid = grid;
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.tileSize = tileSize;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.speed = speed ?? 200;
    this.gridX = Math.floor((x - offsetX) / tileSize);
    this.gridY = Math.floor((y - offsetY) / tileSize);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    if (typeof this.on === "function") {
      this.on("animationcomplete", this.onAnimationComplete, this);
    }
  }

  setDirection(dir: Direction): void {
    if (this.isDying) return;

    if (this.currentDirection === Direction.NONE) {
      this.currentDirection = dir;
      return;
    }

    if (this.isAtIntersection()) {
      if (this.canMove(dir)) {
        this.currentDirection = dir;
        this.nextDirection = Direction.NONE;
      } else {
        this.nextDirection = dir;
      }
    } else {
      this.nextDirection = dir;
    }
  }

  triggerDeath(onComplete?: () => void): void {
    if (this.isDying) return;
    this.isDying = true;
    this.onDeathComplete = onComplete;
    this.animationState = PlayerAnimationState.DEATH;
    this.play("player_death", true);
  }

  private onAnimationComplete(
    _animation: Phaser.Animations.Animation,
    _frame: Phaser.Animations.AnimationFrame,
  ): void {
    if (_animation.key === "player_death") {
      this.isDying = false;
      this.onDeathComplete?.();
      this.onDeathComplete = undefined;
    }
  }

  update(delta: number): void {
    if (this.isDying) return;

    const dt = delta / 1000;
    const moveAmount = this.speed * dt;

    if (this.currentDirection === Direction.NONE) {
      this.updateAnimationState();
      return;
    }

    const dx = directionToDx(this.currentDirection);
    const dy = directionToDy(this.currentDirection);

    const newX = this.x + dx * moveAmount;
    const newY = this.y + dy * moveAmount;

    if (this.canMove(this.currentDirection)) {
      this.gridX = Math.floor((newX - this.offsetX) / this.tileSize);
      this.gridY = Math.floor((newY - this.offsetY) / this.tileSize);
      this.x = newX;
      this.y = newY;
    } else {
      this.snapToGrid();
    }

    if (
      this.nextDirection !== Direction.NONE &&
      (this.isAtIntersection() || !this.canMove(this.currentDirection))
    ) {
      if (this.canMove(this.nextDirection)) {
        this.currentDirection = this.nextDirection;
        this.nextDirection = Direction.NONE;
      }
    }

    this.updateAnimationState();
  }

  private updateAnimationState(): void {
    let newState: PlayerAnimationState;

    if (this.isDying) {
      newState = PlayerAnimationState.DEATH;
    } else if (this.currentDirection === Direction.NONE) {
      newState = PlayerAnimationState.IDLE;
    } else {
      switch (this.currentDirection) {
        case Direction.RIGHT:
          newState = PlayerAnimationState.WALK_RIGHT;
          break;
        case Direction.LEFT:
          newState = PlayerAnimationState.WALK_LEFT;
          break;
        case Direction.UP:
          newState = PlayerAnimationState.WALK_UP;
          break;
        case Direction.DOWN:
          newState = PlayerAnimationState.WALK_DOWN;
          break;
        default:
          newState = PlayerAnimationState.IDLE;
      }
    }

    if (newState !== this.animationState) {
      this.animationState = newState;
      this.playAnimationForState();
    }

    if (this.animationState === PlayerAnimationState.IDLE) {
      this.anims.pause();
    } else if (!this.anims.isPlaying) {
      this.anims.resume();
    }
  }

  private playAnimationForState(): void {
    switch (this.animationState) {
      case PlayerAnimationState.IDLE:
        this.play("player_chomp_right");
        this.anims.pause();
        break;
      case PlayerAnimationState.WALK_RIGHT:
        this.play("player_chomp_right", true);
        break;
      case PlayerAnimationState.WALK_LEFT:
        this.play("player_chomp_left", true);
        break;
      case PlayerAnimationState.WALK_UP:
        this.play("player_chomp_up", true);
        break;
      case PlayerAnimationState.WALK_DOWN:
        this.play("player_chomp_down", true);
        break;
      case PlayerAnimationState.DEATH:
        break;
    }
  }

  getGridX(): number {
    return this.gridX;
  }

  getGridY(): number {
    return this.gridY;
  }

  getCurrentDirection(): Direction {
    return this.currentDirection;
  }

  isDyingState(): boolean {
    return this.isDying;
  }

  private canMove(dir: Direction): boolean {
    const dx = directionToDx(dir);
    const dy = directionToDy(dir);
    const checkX = this.gridX + dx;
    const checkY = this.gridY + dy;

    if (
      checkX < 0 ||
      checkX >= this.gridWidth ||
      checkY < 0 ||
      checkY >= this.gridHeight
    ) {
      return false;
    }

    return this.grid[checkY][checkX].type === CellType.PASSAGE;
  }

  private isAtIntersection(): boolean {
    let passageCount = 0;
    const dirs = [
      Direction.UP,
      Direction.DOWN,
      Direction.LEFT,
      Direction.RIGHT,
    ];

    for (const dir of dirs) {
      if (this.canMove(dir)) passageCount++;
    }

    return passageCount >= 3;
  }

  private snapToGrid(): void {
    this.x = this.offsetX + this.gridX * this.tileSize + this.tileSize / 2;
    this.y = this.offsetY + this.gridY * this.tileSize + this.tileSize / 2;
  }

  respawn(): void {
    this.currentDirection = Direction.NONE;
    this.nextDirection = Direction.NONE;
    this.isDying = false;
    this.animationState = PlayerAnimationState.IDLE;
    this.playAnimationForState();
  }
}
