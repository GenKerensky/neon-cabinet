import { Scene } from "phaser";
import {
  VectorPuppet,
  SVGParser,
  Direction as VectorDirection,
} from "@neon-cabinet/sprite-tools";
import type { SVGPuppetMetadata } from "@neon-cabinet/sprite-tools";
import type { MazeCell } from "../utils/MazeGenerator";
import { CellType } from "../utils/MazeGenerator";
import {
  Direction,
  directionToDx,
  directionToDy,
} from "../utils/DirectionUtils";
import {
  isEnteringPenFromOutside,
  isAtCellCenter,
  getCenterTolerance,
} from "../utils/gridGeometry";

const DIR_TO_VDIR: Record<number, VectorDirection> = {
  [Direction.UP]: "UP",
  [Direction.DOWN]: "DOWN",
  [Direction.LEFT]: "LEFT",
  [Direction.RIGHT]: "RIGHT",
  [Direction.NONE]: "RIGHT",
};

const VDIR_TO_DIR: Record<VectorDirection, Direction> = {
  UP: Direction.UP,
  DOWN: Direction.DOWN,
  LEFT: Direction.LEFT,
  RIGHT: Direction.RIGHT,
};

function toVDir(d: Direction | VectorDirection): VectorDirection {
  if (typeof d === "string") return d;
  return DIR_TO_VDIR[d] ?? "RIGHT";
}

function toDir(d: Direction | VectorDirection): Direction {
  if (typeof d === "number") return d;
  return VDIR_TO_DIR[d] ?? Direction.NONE;
}

export enum PlayerAnimationState {
  IDLE = "idle",
  WALK_RIGHT = "walk-right",
  WALK_LEFT = "walk-left",
  WALK_UP = "walk-up",
  WALK_DOWN = "walk-down",
  DEATH = "death",
}

export class Player extends VectorPuppet {
  private grid: MazeCell[][];
  private gridWidth: number;
  private gridHeight: number;
  private tileSize: number;
  private speed: number;
  private nextDirection: Direction = Direction.NONE;
  private gridX: number;
  private gridY: number;
  private offsetX: number;
  private offsetY: number;
  private animationState: PlayerAnimationState = PlayerAnimationState.IDLE;
  private isDying = false;
  private _onDeathComplete?: () => void;

  set movementDirection(dir: Direction) {
    (this as any).currentDirection = DIR_TO_VDIR[dir];
  }

  get movementDirection(): Direction {
    return (
      VDIR_TO_DIR[(this as any).currentDirection as VectorDirection] ??
      Direction.NONE
    );
  }

  constructor(
    scene: Scene,
    x: number,
    y: number,
    gridOrTexture: MazeCell[][] | string,
    gridWidthOrGrid?: number | MazeCell[][],
    gridHeightOrWidth?: number,
    tileSizeOrHeight?: number,
    offsetXOrSize?: number,
    offsetYOrX?: number,
    speedOrY?: number,
  ) {
    const isGrid = Array.isArray(gridOrTexture);

    let metadata: SVGPuppetMetadata;
    let gw: number, gh: number, ts: number, ox: number, oy: number, sp: number;

    if (isGrid) {
      gw = gridWidthOrGrid as number;
      gh = gridHeightOrWidth!;
      ts = tileSizeOrHeight ?? 16;
      ox = offsetXOrSize ?? 0;
      oy = offsetYOrX ?? 0;
      sp = speedOrY ?? 200;

      const svgText = (scene.cache.text as any)?.get?.("player_svg") ?? "";
      let parsed: SVGPuppetMetadata | null = null;
      if (svgText) {
        try {
          const parser = new SVGParser();
          parsed = parser.parse(svgText);
        } catch {
          /* fallback */
        }
      }
      metadata = parsed ?? {
        viewBox: { x: 0, y: 0, width: 32, height: 32 },
        layers: [],
        sockets: [],
      };
    } else {
      gw = gridHeightOrWidth!;
      gh = tileSizeOrHeight!;
      ts = offsetXOrSize ?? 16;
      ox = offsetYOrX ?? 0;
      oy = speedOrY ?? 0;
      sp = 200;

      const parser = new SVGParser();
      metadata = parser.parse(gridOrTexture);
    }

    super(scene, x, y, metadata);

    this.grid = isGrid ? gridOrTexture : (gridWidthOrGrid as MazeCell[][]);
    this.gridWidth = gw;
    this.gridHeight = gh;
    this.tileSize = ts;
    this.offsetX = ox;
    this.offsetY = oy;
    this.speed = sp;
    this.gridX = Math.floor((x - ox) / ts);
    this.gridY = Math.floor((y - oy) / ts);
    this.scale = ts / 30;
    scene.physics.add.existing(this);
  }

  private isCentered(): boolean {
    const tolerance = getCenterTolerance(this.tileSize);
    return isAtCellCenter(
      this.x,
      this.y,
      this.gridX,
      this.gridY,
      this.tileSize,
      this.offsetX,
      this.offsetY,
      tolerance,
    );
  }

  override setDirection(dir: Direction | VectorDirection): void {
    const mazeDir = toDir(dir);
    const vDir = toVDir(dir);
    if (this.isDying) return;

    const currentDir =
      VDIR_TO_DIR[(this as any).currentDirection as VectorDirection] ??
      Direction.NONE;
    if (currentDir === Direction.NONE) {
      (this as any).currentDirection = vDir;
      super.setDirection(vDir);
      return;
    }

    if (this.isAtIntersection() && this.isCentered()) {
      if (this.canMove(mazeDir)) {
        (this as any).currentDirection = vDir;
        this.nextDirection = Direction.NONE;
        super.setDirection(vDir);
      } else {
        this.nextDirection = mazeDir;
      }
    } else {
      this.nextDirection = mazeDir;
    }
  }

  triggerDeath(onComplete?: () => void): void {
    if (this.isDying) return;
    this.isDying = true;
    this._onDeathComplete = onComplete;
    this.animationState = PlayerAnimationState.DEATH;
  }

  override update(time: number, delta: number): void {
    super.update(time, delta);
    if (this.isDying) return;

    const dt = delta / 1000;
    const moveAmount = this.speed * dt;
    const currentVDir = (this as any).currentDirection as VectorDirection;
    const currentDir = VDIR_TO_DIR[currentVDir] ?? Direction.NONE;

    if (currentDir === Direction.NONE) {
      this.updateAnimationState();
      return;
    }

    const dx = directionToDx(currentDir);
    const dy = directionToDy(currentDir);

    const newX = this.x + dx * moveAmount;
    const newY = this.y + dy * moveAmount;

    if (this.canMove(currentDir)) {
      this.gridX = Math.floor((newX - this.offsetX) / this.tileSize);
      this.gridY = Math.floor((newY - this.offsetY) / this.tileSize);
      this.x = newX;
      this.y = newY;
      this.enforceCenterline();
    } else {
      this.snapToGrid();
    }

    if (
      this.nextDirection !== Direction.NONE &&
      (this.isAtIntersection() || !this.canMove(currentDir))
    ) {
      if (this.canMove(this.nextDirection)) {
        const committedDirection = this.nextDirection;
        (this as any).currentDirection = DIR_TO_VDIR[committedDirection];
        this.nextDirection = Direction.NONE;
        super.setDirection(DIR_TO_VDIR[committedDirection]);
      }
    }

    this.updateAnimationState();
  }

  private updateAnimationState(): void {
    let newState: PlayerAnimationState;
    const currentVDir = (this as any).currentDirection as VectorDirection;
    const currentDir = VDIR_TO_DIR[currentVDir] ?? Direction.NONE;

    if (this.isDying) {
      newState = PlayerAnimationState.DEATH;
    } else if (currentDir === Direction.NONE) {
      newState = PlayerAnimationState.IDLE;
    } else {
      switch (currentDir) {
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

  }

  private playAnimationForState(): void {
    switch (this.animationState) {
      case PlayerAnimationState.IDLE:
        break;
      case PlayerAnimationState.WALK_RIGHT:
        super.setDirection("RIGHT");
        break;
      case PlayerAnimationState.WALK_LEFT:
        super.setDirection("LEFT");
        break;
      case PlayerAnimationState.WALK_UP:
        super.setDirection("UP");
        break;
      case PlayerAnimationState.WALK_DOWN:
        super.setDirection("DOWN");
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
    return (
      VDIR_TO_DIR[(this as any).currentDirection as VectorDirection] ??
      Direction.NONE
    );
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

    if (this.grid[checkY][checkX].type !== CellType.PASSAGE) {
      return false;
    }

    if (
      isEnteringPenFromOutside(
        { gridX: this.gridX, gridY: this.gridY },
        { gridX: checkX, gridY: checkY },
        this.gridWidth,
        this.gridHeight,
      )
    ) {
      return false;
    }

    return true;
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

  private enforceCenterline(): void {
    const currentVDir = (this as any).currentDirection as VectorDirection;
    const currentDir = VDIR_TO_DIR[currentVDir] ?? Direction.NONE;
    const dx = directionToDx(currentDir);
    const dy = directionToDy(currentDir);
    if (dx !== 0) {
      this.y = this.offsetY + this.gridY * this.tileSize + this.tileSize / 2;
    }
    if (dy !== 0) {
      this.x = this.offsetX + this.gridX * this.tileSize + this.tileSize / 2;
    }
  }

  respawn(): void {
    (this as any).currentDirection = "NONE";
    this.nextDirection = Direction.NONE;
    this.isDying = false;
    this.animationState = PlayerAnimationState.IDLE;
    this.playAnimationForState();
  }
}
