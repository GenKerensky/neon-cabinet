import { Scene } from "phaser";
import { VectorPuppet, SVGParser } from "@neon-cabinet/sprite-tools";
import type { Direction as VectorDirection } from "@neon-cabinet/sprite-tools";
import type { MazeCell } from "../utils/MazeGenerator";
import { CellType } from "../utils/MazeGenerator";
import {
  Direction,
  directionToDx,
  directionToDy,
  oppositeDirection,
  getValidDirections,
} from "../utils/DirectionUtils";
import {
  getCellCenter,
  getCenterTolerance,
  isAtCellCenter,
  hasCrossedCellCenter,
  snapToCellCenter,
  getPenGeometry,
  worldToGrid,
  isEnteringPenFromOutside,
  isPenInteriorCell,
  isPenGateCell,
  isPenExitCell,
} from "../utils/gridGeometry";

type BodyLayerMetadata = {
  fill?: string;
  stroke?: string;
  animations?: unknown[];
};

type HasLayersMetadata = {
  layersMetadata?: Map<string, BodyLayerMetadata>;
};

export type EnemyCrowdBehavior = "trail" | "reroute" | "yield";

export enum EnemyState {
  SCATTER = "scatter",
  CHASE = "chase",
  FRIGHTENED = "frightened",
  DEAD = "dead",
}

export abstract class Enemy extends VectorPuppet {
  static readonly FRIGHTENED_DURATION_MS = 8000;

  protected grid: MazeCell[][];
  protected gridWidth: number;
  protected gridHeight: number;
  protected tileSize: number;
  protected speed: number;
  protected baseSpeed: number;
  protected _state: EnemyState = EnemyState.SCATTER;
  protected gridX: number;
  protected gridY: number;
  protected movementDirection: Direction = Direction.NONE;
  protected scatterTarget: { x: number; y: number };
  protected mazeCenter: { x: number; y: number };
  protected offsetX: number;
  protected offsetY: number;
  protected frightenedTimer = 0;
  protected gateOpenTime = 0;
  protected gameStartTime = 0;
  protected gateCellX = -1;
  protected gateCellY = -1;
  protected textureName: string;
  protected svgCacheKey: string;
  protected baseBodyFill: string | undefined;
  protected baseBodyStroke: string | undefined;
  protected deadReturnTargetX: number;
  protected deadReturnTargetY: number;
  private exitingPen = true;
  private blockedCells = new Set<string>();
  private crowdBehavior: EnemyCrowdBehavior = "reroute";

  declare public scene: Scene;
  declare public x: number;
  declare public y: number;
  declare public alpha: number;
  declare public scale: number;
  declare public depth: number;
  declare public body: Phaser.Physics.Arcade.Body;

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
    svgCacheKey = "ghost_svg",
  ) {
    const svgData = scene.cache.text.get(svgCacheKey);
    const metadata = new SVGParser().parse(svgData);
    super(scene, x, y, metadata);
    this.setScale(tileSize / 30);
    this.scene.physics.add.existing(this);

    this.grid = grid;
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.tileSize = tileSize;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.baseSpeed = speed ?? 80;
    this.speed = this.baseSpeed;
    const startGrid = worldToGrid(x, y, tileSize, offsetX, offsetY);
    this.gridX = startGrid.gridX;
    this.gridY = startGrid.gridY;
    this.scatterTarget = scatterTarget;
    this.textureName = texture;
    this.svgCacheKey = svgCacheKey;

    const bodyMetadata = (
      this as unknown as HasLayersMetadata
    ).layersMetadata?.get("body");
    this.baseBodyFill = bodyMetadata?.fill;
    this.baseBodyStroke = bodyMetadata?.stroke;
    const arcadeBody = this.body as
      | {
          setCircle?: (radius: number) => void;
          setSize?: (width: number, height: number) => void;
          setOffset?: (x: number, y: number) => void;
          setImmovable?: (value: boolean) => void;
          allowGravity?: boolean;
          immovable?: boolean;
        }
      | undefined;
    const colliderDiameter = Math.max(12, this.tileSize * 0.75);
    const colliderRadius = colliderDiameter / 2;
    arcadeBody?.setCircle?.(colliderRadius);
    arcadeBody?.setSize?.(colliderDiameter, colliderDiameter);
    arcadeBody?.setOffset?.(-colliderRadius, -colliderRadius);
    arcadeBody?.setImmovable?.(true);
    if (arcadeBody) {
      arcadeBody.allowGravity = false;
      arcadeBody.immovable = true;
    }

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

    const deadReturnTarget = getCellCenter(
      this.mazeCenter.x,
      this.mazeCenter.y,
      this.tileSize,
      this.offsetX,
      this.offsetY,
    );
    this.deadReturnTargetX = deadReturnTarget.x;
    this.deadReturnTargetY = deadReturnTarget.y;

    const startsInPenArea =
      isPenInteriorCell(
        this.gridX,
        this.gridY,
        this.gridWidth,
        this.gridHeight,
      ) ||
      isPenGateCell(this.gridX, this.gridY, this.gridWidth, this.gridHeight) ||
      isPenExitCell(this.gridX, this.gridY, this.gridWidth, this.gridHeight);
    if (!startsInPenArea) {
      this.exitingPen = false;
    }
  }

  abstract getTargetPosition(
    playerX: number,
    playerY: number,
    playerDir: Direction,
  ): { x: number; y: number } | null;

  setCrowdContext(
    blockedCells: Set<string>,
    behavior: EnemyCrowdBehavior,
  ): void {
    this.blockedCells = blockedCells;
    this.crowdBehavior = behavior;
  }

  setEnemyState(newState: EnemyState): void {
    this._state = newState;
    const bodyMetadata = (
      this as unknown as HasLayersMetadata
    ).layersMetadata?.get("body");

    switch (newState) {
      case EnemyState.FRIGHTENED:
        this.setDeadEyesVisible(false);
        this.speed = this.baseSpeed * 0.5;
        this.frightenedTimer = Enemy.FRIGHTENED_DURATION_MS;
        if (bodyMetadata) {
          bodyMetadata.animations = [
            {
              type: "flash",
              frequency: 10,
              color1: "#0000ff",
              color2: "#ffffff",
            },
          ];
        }
        break;
      case EnemyState.CHASE:
      case EnemyState.SCATTER:
        this.setDeadEyesVisible(false);
        this.speed = this.baseSpeed;
        if (bodyMetadata) {
          bodyMetadata.animations = [
            {
              type: "wave",
              frequency: 10,
              amplitude: 2,
              points: 10,
            },
          ];
          bodyMetadata.fill = this.baseBodyFill;
          bodyMetadata.stroke = this.baseBodyStroke;
        }
        this.setAlpha(1);
        break;
      case EnemyState.DEAD:
        this.setDeadEyesVisible(true);
        this.speed = this.baseSpeed * 4;
        if (bodyMetadata) {
          bodyMetadata.animations = [];
          bodyMetadata.fill = "transparent";
          bodyMetadata.stroke = "transparent";
        }
        this.setAlpha(0.5);
        break;
    }
  }

  private setDeadEyesVisible(isDead: boolean): void {
    this.setLayerVisibility("eyes", !isDead);
    this.setLayerVisibility("dead_eyes", isDead);
  }

  activateFrightened(durationMs = Enemy.FRIGHTENED_DURATION_MS): void {
    if (this._state === EnemyState.DEAD) {
      return;
    }

    if (this._state === EnemyState.FRIGHTENED) {
      this.frightenedTimer += durationMs;
      return;
    }

    this.setEnemyState(EnemyState.FRIGHTENED);
    this.frightenedTimer = durationMs;
  }

  setDeadReturnTarget(gridX: number, gridY: number): void {
    const center = getCellCenter(
      gridX,
      gridY,
      this.tileSize,
      this.offsetX,
      this.offsetY,
    );
    this.deadReturnTargetX = center.x;
    this.deadReturnTargetY = center.y;
  }

  update(
    time: number,
    delta: number,
    playerX?: number,
    playerY?: number,
    playerDir?: Direction,
    freezeMovement = false,
  ): void {
    const targetX = playerX ?? this.x;
    const targetY = playerY ?? this.y;
    const targetDir = playerDir ?? Direction.NONE;

    if (this._state === EnemyState.FRIGHTENED) {
      if (this.frightenedTimer > 0) {
        this.frightenedTimer -= delta;
        if (this.frightenedTimer <= 0) {
          this.setEnemyState(EnemyState.CHASE);
        }
      }
    }

    if (this._state === EnemyState.DEAD) {
      if (!freezeMovement) {
        this.moveDeadReturnStep(delta / 1000);
      }
      super.update(time, delta);
      return;
    }

    if (this.movementDirection === Direction.NONE) {
      this.movementDirection = this.chooseDirection(
        targetX,
        targetY,
        targetDir,
      );
      this.updatePuppetDirection();
    }

    if (!freezeMovement) {
      this.moveStep(delta / 1000, targetX, targetY, targetDir);
    }
    super.update(time, delta);
  }

  protected moveDeadReturnStep(dt: number): void {
    const threshold = Math.max(2, this.tileSize * 0.1);
    const toTargetX = this.deadReturnTargetX - this.x;
    const toTargetY = this.deadReturnTargetY - this.y;
    const distance = Math.hypot(toTargetX, toTargetY);

    if (distance <= threshold) {
      this.x = this.deadReturnTargetX;
      this.y = this.deadReturnTargetY;
      const currentGrid = worldToGrid(
        this.x,
        this.y,
        this.tileSize,
        this.offsetX,
        this.offsetY,
      );
      this.gridX = currentGrid.gridX;
      this.gridY = currentGrid.gridY;
      this.setEnemyState(EnemyState.CHASE);
      this.forcePenExit();
      return;
    }

    const moveAmount = this.speed * dt;
    const step = Math.min(moveAmount, distance);
    const nx = toTargetX / distance;
    const ny = toTargetY / distance;

    this.x += nx * step;
    this.y += ny * step;
    const currentGrid = worldToGrid(
      this.x,
      this.y,
      this.tileSize,
      this.offsetX,
      this.offsetY,
    );
    this.gridX = currentGrid.gridX;
    this.gridY = currentGrid.gridY;
    this.movementDirection =
      Math.abs(nx) > Math.abs(ny)
        ? nx >= 0
          ? Direction.RIGHT
          : Direction.LEFT
        : ny >= 0
          ? Direction.DOWN
          : Direction.UP;
    this.updatePuppetDirection();

    const remainingX = this.deadReturnTargetX - this.x;
    const remainingY = this.deadReturnTargetY - this.y;
    if (Math.hypot(remainingX, remainingY) <= threshold) {
      this.x = this.deadReturnTargetX;
      this.y = this.deadReturnTargetY;
      const currentGrid = worldToGrid(
        this.x,
        this.y,
        this.tileSize,
        this.offsetX,
        this.offsetY,
      );
      this.gridX = currentGrid.gridX;
      this.gridY = currentGrid.gridY;
      this.setEnemyState(EnemyState.CHASE);
      this.forcePenExit();
    }
  }

  private updatePuppetDirection(): void {
    const dirMap: Record<Direction, VectorDirection> = {
      [Direction.RIGHT]: "RIGHT",
      [Direction.LEFT]: "LEFT",
      [Direction.UP]: "UP",
      [Direction.DOWN]: "DOWN",
      [Direction.NONE]: "RIGHT",
    };
    super.setDirection(dirMap[this.movementDirection]);
  }

  protected moveStep(
    dt: number,
    playerX: number,
    playerY: number,
    playerDir: Direction,
  ): void {
    this.alignToMovementCenterline();
    const moveAmount = this.speed * dt;
    const dx = directionToDx(this.movementDirection);
    const dy = directionToDy(this.movementDirection);

    if (dx === 0 && dy === 0) {
      return;
    }

    const newX = this.x + dx * moveAmount;
    const newY = this.y + dy * moveAmount;

    const nextGridX = this.gridX + dx;
    const nextGridY = this.gridY + dy;
    const center = getCellCenter(
      nextGridX,
      nextGridY,
      this.tileSize,
      this.offsetX,
      this.offsetY,
    );
    const axis = dx !== 0 ? "x" : "y";
    const crossedCenter = hasCrossedCellCenter(
      { x: this.x, y: this.y },
      { x: newX, y: newY },
      center,
      axis,
    );

    if (crossedCenter) {
      this.x = center.x;
      this.y = center.y;
      this.gridX = nextGridX;
      this.gridY = nextGridY;
      this.maybeCompletePenExit(
        { x: this.x, y: this.y },
        { x: this.x, y: this.y },
        axis,
      );
      this.movementDirection = this.chooseDirection(
        playerX,
        playerY,
        playerDir,
      );
      this.updatePuppetDirection();
    } else if (
      nextGridX >= 0 &&
      nextGridX < this.gridWidth &&
      nextGridY >= 0 &&
      nextGridY < this.gridHeight
    ) {
      if (this.canMoveTo(nextGridX, nextGridY, true)) {
        this.x = newX;
        this.y = newY;
        this.maybeCompletePenExit(
          { x: this.x - dx * moveAmount, y: this.y - dy * moveAmount },
          { x: this.x, y: this.y },
          axis,
        );
      } else {
        this.snapToCurrentCell();
        this.movementDirection = this.chooseDirection(
          playerX,
          playerY,
          playerDir,
        );
        this.updatePuppetDirection();
      }
    } else {
      this.snapToCurrentCell();
      this.movementDirection = this.chooseDirection(
        playerX,
        playerY,
        playerDir,
      );
      this.updatePuppetDirection();
    }
  }

  protected chooseDirection(
    playerX: number,
    playerY: number,
    playerDir: Direction,
  ): Direction {
    const penTarget = this.getPenExitTarget();
    if (!penTarget && this._state === EnemyState.FRIGHTENED) {
      return this.randomValidDirection(false);
    }

    const target =
      penTarget ??
      (this._state === EnemyState.DEAD
        ? this.mazeCenter
        : this.getTargetPosition(playerX, playerY, playerDir));

    if (!target) {
      return this.randomValidDirection(false);
    }

    const canReverse = this._state === EnemyState.DEAD;
    let bestDir = Direction.NONE;
    let bestDist = Infinity;
    const candidateDirs = [
      Direction.UP,
      Direction.DOWN,
      Direction.LEFT,
      Direction.RIGHT,
    ];
    const dirs =
      this.crowdBehavior === "yield"
        ? Phaser.Utils.Array.Shuffle([...candidateDirs])
        : candidateDirs;

    for (const dir of dirs) {
      const nx = this.gridX + directionToDx(dir);
      const ny = this.gridY + directionToDy(dir);
      if (nx < 0 || nx >= this.gridWidth || ny < 0 || ny >= this.gridHeight)
        continue;
      if (!this.canMoveTo(nx, ny, true)) continue;
      if (!canReverse && dir === oppositeDirection(this.movementDirection))
        continue;

      const dist = Math.abs(nx - target.x) + Math.abs(ny - target.y);
      if (
        dist < bestDist ||
        (dist === bestDist && dir === this.movementDirection)
      ) {
        bestDist = dist;
        bestDir = dir;
      }
    }

    if (bestDir === Direction.NONE) {
      const reverseDir = oppositeDirection(this.movementDirection);
      const rx = this.gridX + directionToDx(reverseDir);
      const ry = this.gridY + directionToDy(reverseDir);
      if (rx >= 0 && rx < this.gridWidth && ry >= 0 && ry < this.gridHeight) {
        if (this.grid[ry][rx].type === CellType.PASSAGE) {
          if (this.canMoveTo(rx, ry, this.crowdBehavior !== "trail")) {
            bestDir = reverseDir;
          }
        }
      }
    }

    if (bestDir === Direction.NONE) {
      return this.crowdBehavior === "trail"
        ? this.movementDirection
        : Direction.NONE;
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

    if (dirs.length === 0) return this.movementDirection;

    const legal = dirs.filter((d) => {
      const nx = this.gridX + directionToDx(d);
      const ny = this.gridY + directionToDy(d);
      return this.canMoveTo(nx, ny, true);
    });

    const filtered = allowReverse
      ? legal
      : legal.filter((d) => d !== oppositeDirection(this.movementDirection));

    if (filtered.length === 0) {
      return oppositeDirection(this.movementDirection);
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
      const item = queue.shift();
      if (!item) break;
      const { x, y } = item;
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
    const snapped = snapToCellCenter(
      this.gridX,
      this.gridY,
      this.tileSize,
      this.offsetX,
      this.offsetY,
    );
    this.x = snapped.x;
    this.y = snapped.y;
  }

  private getPenExitTarget(): { x: number; y: number } | null {
    if (this._state === EnemyState.DEAD) {
      return null;
    }

    const pen = getPenGeometry(this.gridWidth, this.gridHeight);
    const inInterior = isPenInteriorCell(
      this.gridX,
      this.gridY,
      this.gridWidth,
      this.gridHeight,
    );
    const inGate = isPenGateCell(
      this.gridX,
      this.gridY,
      this.gridWidth,
      this.gridHeight,
    );
    const inExit = isPenExitCell(
      this.gridX,
      this.gridY,
      this.gridWidth,
      this.gridHeight,
    );

    if (!inInterior && !inGate && !inExit) {
      return null;
    }

    if (inInterior) {
      return { x: pen.gateCell.gridX, y: pen.gateCell.gridY };
    }
    if (inGate) {
      return { x: pen.exitCell.gridX, y: pen.exitCell.gridY };
    }
    return { x: pen.exitCell.gridX, y: pen.exitCell.gridY };
  }

  private canMoveTo(nx: number, ny: number, avoidCrowd = false): boolean {
    if (this._state === EnemyState.DEAD) {
      return true;
    }

    if (this.grid[ny][nx].type !== CellType.PASSAGE) {
      return false;
    }

    if (
      isEnteringPenFromOutside(
        { gridX: this.gridX, gridY: this.gridY },
        { gridX: nx, gridY: ny },
        this.gridWidth,
        this.gridHeight,
      )
    ) {
      return false;
    }

    if (
      this.isGateClosed() &&
      this.gridX === this.gateCellX &&
      this.gridY === this.gateCellY - 1 &&
      !this.exitingPen
    ) {
      return false;
    }

    if (avoidCrowd && this.isCrowdedCell(nx, ny)) {
      return false;
    }

    return true;
  }

  private isCrowdedCell(nx: number, ny: number): boolean {
    return this.blockedCells.has(`${nx},${ny}`);
  }

  private alignToMovementCenterline(): void {
    const tolerance = getCenterTolerance(this.tileSize);
    const center = getCellCenter(
      this.gridX,
      this.gridY,
      this.tileSize,
      this.offsetX,
      this.offsetY,
    );
    const dx = directionToDx(this.movementDirection);
    const dy = directionToDy(this.movementDirection);
    if (dx !== 0 && Math.abs(this.y - center.y) > tolerance) {
      this.y = center.y;
    }
    if (dy !== 0 && Math.abs(this.x - center.x) > tolerance) {
      this.x = center.x;
    }
  }

  private maybeCompletePenExit(
    previousPosition: { x: number; y: number },
    nextPosition: { x: number; y: number },
    axis: "x" | "y",
  ): void {
    if (!this.exitingPen || this._state === EnemyState.DEAD) {
      return;
    }

    const pen = getPenGeometry(this.gridWidth, this.gridHeight);
    const exitX = pen.exitCell.gridX;
    const exitY = pen.exitCell.gridY;
    const exitCenter = getCellCenter(
      exitX,
      exitY,
      this.tileSize,
      this.offsetX,
      this.offsetY,
    );

    const atExitCenter = isAtCellCenter(
      this.x,
      this.y,
      exitX,
      exitY,
      this.tileSize,
      this.offsetX,
      this.offsetY,
      getCenterTolerance(this.tileSize),
    );
    const crossedExitCenter = hasCrossedCellCenter(
      previousPosition,
      nextPosition,
      exitCenter,
      axis,
    );

    if (atExitCenter || crossedExitCenter) {
      this.exitingPen = false;
    }
  }

  forcePenExit(): void {
    this.exitingPen = true;
  }

  isExitingPen(): boolean {
    return this.exitingPen;
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
    return this.movementDirection;
  }
}
