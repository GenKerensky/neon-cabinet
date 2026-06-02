import { Scene } from "phaser";
import { VectorPuppet, SVGParser } from "@neon-cabinet/sprite-tools";
import type {
  AnimationMetadata,
  Direction as VectorDirection,
  SVGPuppetMetadata,
} from "@neon-cabinet/sprite-tools";
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
  getCellCenter,
  hasCrossedCellCenter,
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
  private baseSpeed: number;
  private hackSpeedMultiplier = 1;
  private turnAssistMultiplier = 1;
  private nextDirection: Direction = Direction.NONE;
  private gridX: number;
  private gridY: number;
  private offsetX: number;
  private offsetY: number;
  private animationState: PlayerAnimationState = PlayerAnimationState.IDLE;
  private isDying = false;
  private deathTimer = 0;
  private deathDuration = 900;
  private onDeathComplete?: () => void;
  private invulnerabilityElapsed = 0;
  private invulnerabilityDuration = 0;
  private invulnerabilityFlashPhase = 0;
  private onInvulnerabilityComplete?: () => void;
  private baseBodyAnimations: AnimationMetadata[] = [];
  private phaseBreachTimer = 0;
  private phaseBreachMaxTiles = 3;
  private shieldTimer = 0;

  set movementDirection(dir: Direction) {
    this.setCurrentVectorDirection(dir);
  }

  get movementDirection(): Direction {
    return this.getCurrentDirection();
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

      const svgText = scene.cache.text.get("player_svg") ?? "";
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
    this.baseSpeed = sp;
    this.speed = sp;
    this.gridX = Math.floor((x - ox) / ts);
    this.gridY = Math.floor((y - oy) / ts);
    this.scale = ts / 30;
    this.currentDirection = "NONE";
    const bodyMetadata = this.layersMetadata.get("body");
    this.baseBodyAnimations = [...(bodyMetadata?.animations ?? [])];
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
    if (mazeDir === Direction.NONE) return;

    const currentDir = this.getCurrentDirection();
    if (currentDir === Direction.NONE) {
      if (this.canMove(mazeDir)) {
        this.commitDirection(mazeDir);
      } else {
        this.nextDirection = mazeDir;
        super.setDirection(vDir);
      }
      return;
    }

    if (mazeDir === this.getOppositeDirection(currentDir)) {
      this.commitDirection(mazeDir);
      return;
    }

    if (this.isAtIntersection() && this.isCentered()) {
      if (this.canMove(mazeDir)) {
        this.commitDirection(mazeDir);
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
    this.nextDirection = Direction.NONE;
    this.currentDirection = "NONE";
    this.animationState = PlayerAnimationState.DEATH;
    this.deathDuration = 1100;
    this.deathTimer = this.deathDuration;
    this.onDeathComplete = onComplete;
    this.setAlpha(1);
    this.setDeathAnimation(0);
  }

  startInvulnerability(durationMs: number, onComplete?: () => void): void {
    this.invulnerabilityDuration = Math.max(0, durationMs);
    this.invulnerabilityElapsed = 0;
    this.invulnerabilityFlashPhase = 0;
    this.onInvulnerabilityComplete = onComplete;
    this.setAlpha(0.45);
  }

  override update(time: number, delta: number): void {
    super.update(time, delta);
    if (this.isDying) {
      this.deathTimer -= delta;
      const progress = 1 - Math.max(0, this.deathTimer) / this.deathDuration;
      this.setDeathAnimation(progress);
      if (this.deathTimer <= 0) {
        const complete = this.onDeathComplete;
        this.onDeathComplete = undefined;
        this.deathTimer = 0;
        complete?.();
      }
      return;
    }

    this.updateInvulnerability(delta);
    this.updateHackTimers(delta);

    const dt = delta / 1000;
    const moveAmount = this.speed * dt;
    const currentDir = this.getCurrentDirection();

    if (currentDir === Direction.NONE) {
      this.updateAnimationState();
      return;
    }

    this.applyQueuedDirectionAtCenter();
    this.moveAlongCurrentDirection(moveAmount);
    this.updateAnimationState();
  }

  private moveAlongCurrentDirection(moveAmount: number): void {
    const currentDir = this.getCurrentDirection();
    const dx = directionToDx(currentDir);
    const dy = directionToDy(currentDir);

    if (dx === 0 && dy === 0) {
      return;
    }

    this.easeOntoCenterline(moveAmount);

    if (!this.canMove(currentDir)) {
      if (this.tryPhaseBreach(currentDir)) {
        return;
      }
      this.snapToGrid();
      return;
    }

    const nextGridX = this.gridX + dx;
    const nextGridY = this.gridY + dy;
    const nextCenter = getCellCenter(
      nextGridX,
      nextGridY,
      this.tileSize,
      this.offsetX,
      this.offsetY,
    );
    const previousPosition = { x: this.x, y: this.y };
    const nextPosition = {
      x: this.x + dx * moveAmount,
      y: this.y + dy * moveAmount,
    };
    const axis = dx !== 0 ? "x" : "y";

    if (
      hasCrossedCellCenter(previousPosition, nextPosition, nextCenter, axis)
    ) {
      this.x = nextCenter.x;
      this.y = nextCenter.y;
      this.gridX = nextGridX;
      this.gridY = nextGridY;
      this.applyQueuedDirectionAtCenter();
      return;
    }

    this.x = nextPosition.x;
    this.y = nextPosition.y;
    this.easeOntoCenterline(moveAmount);
  }

  private updateAnimationState(): void {
    let newState: PlayerAnimationState;
    const currentDir = this.getCurrentDirection();

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

  private commitDirection(dir: Direction): void {
    this.setCurrentVectorDirection(dir);
    this.nextDirection = Direction.NONE;
    super.setDirection(DIR_TO_VDIR[dir]);
  }

  private applyQueuedDirectionAtCenter(): void {
    if (this.nextDirection === Direction.NONE) return;
    if (!this.isCentered()) {
      if (!this.isWithinTurnAssistWindow()) return;
      this.snapToGrid();
    }
    if (this.canMove(this.nextDirection)) {
      this.commitDirection(this.nextDirection);
    }
  }

  private isWithinTurnAssistWindow(): boolean {
    const center = getCellCenter(
      this.gridX,
      this.gridY,
      this.tileSize,
      this.offsetX,
      this.offsetY,
    );
    const currentDir = this.getCurrentDirection();
    const currentDx = directionToDx(currentDir);
    const currentDy = directionToDy(currentDir);
    const nextDx = directionToDx(this.nextDirection);
    const nextDy = directionToDy(this.nextDirection);

    if (currentDx === nextDx || currentDy === nextDy) return false;

    const turnAxisDelta =
      nextDy !== 0 ? Math.abs(this.x - center.x) : Math.abs(this.y - center.y);
    const travelAxisDelta =
      currentDx !== 0
        ? Math.abs(this.x - center.x)
        : Math.abs(this.y - center.y);
    const tolerance =
      Math.max(1.25, this.tileSize * 0.08) * this.turnAssistMultiplier;
    return turnAxisDelta <= tolerance && travelAxisDelta <= this.tileSize * 0.5;
  }

  setHackSpeedMultiplier(multiplier: number): void {
    this.hackSpeedMultiplier = Math.max(0.1, multiplier);
    this.speed = this.baseSpeed * this.hackSpeedMultiplier;
  }

  setTurnAssistMultiplier(multiplier: number): void {
    this.turnAssistMultiplier = Math.max(1, multiplier);
  }

  enablePhaseBreach(durationMs: number, maxTiles: number): void {
    this.phaseBreachTimer = Math.max(0, durationMs);
    this.phaseBreachMaxTiles = Math.max(1, Math.floor(maxTiles));
  }

  activateShield(durationMs: number): void {
    this.shieldTimer = Math.max(0, durationMs);
  }

  hasShield(): boolean {
    return this.shieldTimer > 0;
  }

  consumeShield(): boolean {
    if (!this.hasShield()) return false;
    this.shieldTimer = 0;
    return true;
  }

  clearHackEffects(): void {
    this.setHackSpeedMultiplier(1);
    this.setTurnAssistMultiplier(1);
    this.phaseBreachTimer = 0;
    this.shieldTimer = 0;
  }

  private updateHackTimers(delta: number): void {
    this.phaseBreachTimer = Math.max(0, this.phaseBreachTimer - delta);
    this.shieldTimer = Math.max(0, this.shieldTimer - delta);
  }

  private tryPhaseBreach(dir: Direction): boolean {
    if (this.phaseBreachTimer <= 0) return false;

    const dx = directionToDx(dir);
    const dy = directionToDy(dir);
    if (dx === 0 && dy === 0) return false;

    for (let distance = 2; distance <= this.phaseBreachMaxTiles; distance++) {
      const destinationX = this.gridX + dx * distance;
      const destinationY = this.gridY + dy * distance;
      if (
        destinationX < 0 ||
        destinationX >= this.gridWidth ||
        destinationY < 0 ||
        destinationY >= this.gridHeight
      ) {
        break;
      }
      if (this.grid[destinationY][destinationX].type !== CellType.PASSAGE) {
        continue;
      }
      if (
        isEnteringPenFromOutside(
          { gridX: this.gridX, gridY: this.gridY },
          { gridX: destinationX, gridY: destinationY },
          this.gridWidth,
          this.gridHeight,
        )
      ) {
        continue;
      }

      const center = getCellCenter(
        destinationX,
        destinationY,
        this.tileSize,
        this.offsetX,
        this.offsetY,
      );
      this.gridX = destinationX;
      this.gridY = destinationY;
      this.x = center.x;
      this.y = center.y;
      this.phaseBreachTimer = 0;
      this.applyQueuedDirectionAtCenter();
      return true;
    }

    return false;
  }

  private updateInvulnerability(delta: number): void {
    if (this.invulnerabilityDuration <= 0) return;

    this.invulnerabilityElapsed += delta;
    const progress = Math.min(
      1,
      this.invulnerabilityElapsed / this.invulnerabilityDuration,
    );
    const flashesPerSecond = 6 + progress * 20;
    this.invulnerabilityFlashPhase += (delta / 1000) * flashesPerSecond;
    const visiblePulse =
      Math.sin(this.invulnerabilityFlashPhase * Math.PI * 2) >= 0;
    this.setAlpha(visiblePulse ? 1 : 0.28);

    if (this.invulnerabilityElapsed >= this.invulnerabilityDuration) {
      const complete = this.onInvulnerabilityComplete;
      this.invulnerabilityDuration = 0;
      this.invulnerabilityElapsed = 0;
      this.onInvulnerabilityComplete = undefined;
      this.setAlpha(1);
      complete?.();
    }
  }

  private setDeathAnimation(progress: number): void {
    const bodyMetadata = this.layersMetadata.get("body");
    if (!bodyMetadata) return;

    const clamped = Math.max(0, Math.min(1, progress));
    const mouthAmplitude = 160 + clamped * 560;
    bodyMetadata.animations = [
      {
        type: "chomp",
        frequency: 0,
        amplitude: mouthAmplitude,
      },
    ];
    this.setScale((this.tileSize / 30) * (1 - clamped * 0.15));
    this.setAlpha(1 - Math.max(0, clamped - 0.82) / 0.18);
  }

  private restoreBaseAnimation(): void {
    const bodyMetadata = this.layersMetadata.get("body");
    if (bodyMetadata) {
      bodyMetadata.animations = [...this.baseBodyAnimations];
    }
    this.setScale(this.tileSize / 30);
  }

  getGridX(): number {
    return this.gridX;
  }

  getGridY(): number {
    return this.gridY;
  }

  getCurrentDirection(): Direction {
    if (this.currentDirection === "NONE") return Direction.NONE;
    return (
      VDIR_TO_DIR[this.currentDirection as VectorDirection] ?? Direction.NONE
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

  private easeOntoCenterline(maxCorrection: number): void {
    const center = getCellCenter(
      this.gridX,
      this.gridY,
      this.tileSize,
      this.offsetX,
      this.offsetY,
    );
    const currentDir = this.getCurrentDirection();
    const dx = directionToDx(currentDir);
    const dy = directionToDy(currentDir);
    const correction = Math.max(1, maxCorrection);

    if (dx !== 0) {
      const delta = center.y - this.y;
      this.y += Math.sign(delta) * Math.min(Math.abs(delta), correction);
    }
    if (dy !== 0) {
      const delta = center.x - this.x;
      this.x += Math.sign(delta) * Math.min(Math.abs(delta), correction);
    }
  }

  private getOppositeDirection(dir: Direction): Direction {
    switch (dir) {
      case Direction.UP:
        return Direction.DOWN;
      case Direction.DOWN:
        return Direction.UP;
      case Direction.LEFT:
        return Direction.RIGHT;
      case Direction.RIGHT:
        return Direction.LEFT;
      default:
        return Direction.NONE;
    }
  }

  respawn(): void {
    this.gridX = Math.floor((this.x - this.offsetX) / this.tileSize);
    this.gridY = Math.floor((this.y - this.offsetY) / this.tileSize);
    this.currentDirection = "NONE";
    this.nextDirection = Direction.NONE;
    this.isDying = false;
    this.deathTimer = 0;
    this.onDeathComplete = undefined;
    this.invulnerabilityDuration = 0;
    this.invulnerabilityElapsed = 0;
    this.onInvulnerabilityComplete = undefined;
    this.clearHackEffects();
    this.animationState = PlayerAnimationState.IDLE;
    this.restoreBaseAnimation();
    this.setAlpha(1);
    this.playAnimationForState();
  }

  private setCurrentVectorDirection(dir: Direction): void {
    this.currentDirection = dir === Direction.NONE ? "NONE" : DIR_TO_VDIR[dir];
  }
}
