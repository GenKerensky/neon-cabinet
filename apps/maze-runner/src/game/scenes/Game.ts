import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { MazeGenerator, CellType, MazeCell } from "../utils/MazeGenerator";
import { Player } from "../objects/Player";
import { Direction } from "../utils/DirectionUtils";
import { Enemy, EnemyState } from "../objects/Enemy";
import { Chaser } from "../ai/Chaser";
import { Ambusher } from "../ai/Ambusher";
import { Wanderer } from "../ai/Wanderer";
import { Timid } from "../ai/Timid";
import {
  buildGhostAiProfile,
  getActiveGhostDefinitionsForLevel,
} from "../config/ghostDefinitions";
import type { GhostDefinition } from "../config/ghostDefinitions";
import {
  Collectible,
  CollectibleManager,
  CollectibleType,
} from "../objects/Collectible";
import { fadeInScene, launchSceneWithFade } from "../utils/sceneTransitions";
import { formatScore, readHighScore } from "../utils/highScore";
import { getCellCenter, getPenGeometry } from "../utils/gridGeometry";

export class Game extends Scene {
  private generator!: MazeGenerator;
  private player!: Player;
  private enemies!: Enemy[];
  private activeGhostDefinitions: GhostDefinition[] = [];
  private chaser?: Chaser;
  private wanderers: Wanderer[] = [];
  private enemyOverlapCollider?: Phaser.Physics.Arcade.Collider;
  private collectibleOverlapCollider?: Phaser.Physics.Arcade.Collider;
  private collectibleManager!: CollectibleManager;
  private scoreText!: Phaser.GameObjects.Text;
  private highScoreText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private lifeIcons: Phaser.GameObjects.Graphics[] = [];
  private scoreValue = 0;
  private livesValue = 3;
  private levelValue = 1;
  private tileSize = 30;
  private grid!: MazeCell[][];
  private gridWidth = 0;
  private gridHeight = 0;
  private wallGraphics!: Phaser.GameObjects.Graphics;
  private offsetX = 0;
  private offsetY = 0;
  private modeTimer = 0;
  private isScatterMode = true;
  private readonly scatterDuration = 7000;
  private readonly chaseDuration = 20000;
  private readonly gateOpenTime = 2000;
  private gameStartTime = 0;
  private ghostsFrozen = false;
  private ghostFreezeTimer = 0;
  private screenFlashRect!: Phaser.GameObjects.Rectangle;
  private playerInvincible = false;
  private countdownActive = false;
  private deathSequenceActive = false;
  private levelTransitionActive = false;
  private respawnDelayMs = 0;

  constructor() {
    super("Game");
  }

  init(): void {
    this.scoreValue = 0;
    this.livesValue = 3;
    this.levelValue = 1;
    this.modeTimer = 0;
    this.isScatterMode = true;
    this.ghostsFrozen = false;
    this.ghostFreezeTimer = 0;
    this.playerInvincible = false;
    this.countdownActive = false;
    this.deathSequenceActive = false;
    this.levelTransitionActive = false;
    this.respawnDelayMs = 0;
  }

  create(): void {
    this.gameStartTime = this.time.now;
    const difficulty = (this.registry.get("difficulty") as number) ?? 1;
    const fontFamily =
      (this.registry.get("fontFamily") as string) ?? "Orbitron";

    this.generator = new MazeGenerator(difficulty, this.levelValue);
    this.grid = this.generator.create();
    this.gridHeight = this.grid.length;
    this.gridWidth = this.grid[0].length;

    const { width: camW, height: camH } = this.cameras.main;
    const paddingX = 60;
    const paddingY = 100;
    const availW = camW - paddingX * 2;
    const availH = camH - paddingY * 2;
    this.tileSize = Math.floor(
      Math.min(availW / this.gridWidth, availH / this.gridHeight),
    );

    const mapWidth = this.gridWidth * this.tileSize;
    const mapHeight = this.gridHeight * this.tileSize;

    this.offsetX = (camW - mapWidth) / 2;
    this.offsetY = (camH - mapHeight) / 2;

    this.cameras.main.setPostPipeline("VectorShader");
    this.wallGraphics = this.add.graphics();
    this.renderMaze();
    fadeInScene(this);

    this.screenFlashRect = this.add.rectangle(
      camW / 2,
      camH / 2,
      camW,
      camH,
      0xffffff,
      0,
    );
    this.screenFlashRect.setDepth(1000);

    this.collectibleManager = new CollectibleManager(
      this,
      this.grid,
      this.gridWidth,
      this.gridHeight,
      this.tileSize,
      this.offsetX,
      this.offsetY,
      this.levelValue,
    );
    this.collectibleManager.createAll();

    const spawnGridX = Math.floor(this.gridWidth / 2);
    const spawnGridY = this.gridHeight - 3;
    const spawnCenter = getCellCenter(
      spawnGridX,
      spawnGridY,
      this.tileSize,
      this.offsetX,
      this.offsetY,
    );

    this.player = new Player(
      this,
      spawnCenter.x,
      spawnCenter.y,
      this.grid,
      this.gridWidth,
      this.gridHeight,
      this.tileSize,
      this.offsetX,
      this.offsetY,
      200,
    );
    this.physics.add.existing(this.player);

    this.rebuildActiveGhosts();

    const setDir = (dir: Direction) => this.player.setDirection(dir);
    this.input.keyboard?.on("keydown-UP", () => setDir(Direction.UP));
    this.input.keyboard?.on("keydown-W", () => setDir(Direction.UP));
    this.input.keyboard?.on("keydown-DOWN", () => setDir(Direction.DOWN));
    this.input.keyboard?.on("keydown-S", () => setDir(Direction.DOWN));
    this.input.keyboard?.on("keydown-LEFT", () => setDir(Direction.LEFT));
    this.input.keyboard?.on("keydown-A", () => setDir(Direction.LEFT));
    this.input.keyboard?.on("keydown-RIGHT", () => setDir(Direction.RIGHT));
    this.input.keyboard?.on("keydown-D", () => setDir(Direction.RIGHT));
    this.input.keyboard?.on("keydown-ESC", () => {
      launchSceneWithFade(this, "Pause");
    });

    this.collectibleOverlapCollider = this.physics.add.overlap(
      this.player,
      this.collectibleManager.getCollectibles(),
      this.onCollectibleHit,
      undefined,
      this,
    );

    this.registerEnemyOverlap();

    this.scoreText = this.add
      .text(camW / 2, 20, `SCORE: ${this.scoreValue}`, {
        fontFamily,
        fontSize: "16px",
        color: "#ffffff",
      })
      .setOrigin(0.5, 0);

    this.levelText = this.add
      .text(camW - 20, 20, `LEVEL: ${this.levelValue}`, {
        fontFamily,
        fontSize: "16px",
        color: "#ffffff",
      })
      .setOrigin(1, 0);

    this.highScoreText = this.add
      .text(camW / 2, camH - 24, "HIGH: 000000", {
        fontFamily,
        fontSize: "16px",
        color: "#ffffff",
      })
      .setOrigin(0.5, 1);

    this.renderLivesHud();
    this.refreshScoreHud();

    EventBus.emit("current-scene-ready", this);
    this.runCountdown();
  }

  private refreshScoreHud(): void {
    this.scoreText.setText(`SCORE: ${this.scoreValue}`);
    const highScoreValue = Math.max(
      readHighScore(this.registry),
      this.scoreValue,
    );
    this.highScoreText.setText(`HIGH: ${formatScore(highScoreValue)}`);
  }

  private renderLivesHud(): void {
    this.lifeIcons.forEach((icon) => icon.destroy());
    this.lifeIcons = [];

    for (let i = 0; i < this.livesValue; i++) {
      const icon = this.add.graphics();
      const x = 24 + i * 28;
      const y = 30;
      const radius = 8;

      icon.x = x;
      icon.y = y;

      icon.fillStyle(0xffff00, 1);
      icon.fillCircle(x, y, radius);
      icon.fillStyle(0x000000, 1);
      icon.beginPath();
      icon.moveTo(x, y);
      icon.lineTo(x + radius, y - radius / 2);
      icon.lineTo(x + radius, y + radius / 2);
      icon.closePath();
      icon.fillPath();

      this.lifeIcons.push(icon);
    }
  }

  private resolveScatterTarget(definition: GhostDefinition): {
    x: number;
    y: number;
  } {
    if (definition.scatterTarget.kind === "corner") {
      switch (definition.scatterTarget.corner) {
        case "topLeft":
          return { x: 1, y: 1 };
        case "topRight":
          return { x: this.gridWidth - 2, y: 1 };
        case "bottomLeft":
          return { x: 1, y: this.gridHeight - 2 };
        case "bottomRight":
          return { x: this.gridWidth - 2, y: this.gridHeight - 2 };
      }
    }

    switch (definition.scatterTarget.edge) {
      case "top":
        return { x: Math.floor(this.gridWidth / 2), y: 1 };
      case "bottom":
        return { x: Math.floor(this.gridWidth / 2), y: this.gridHeight - 2 };
      case "left":
        return { x: 1, y: Math.floor(this.gridHeight / 2) };
      case "right":
        return { x: this.gridWidth - 2, y: Math.floor(this.gridHeight / 2) };
    }
  }

  private runCountdown(): void {
    this.countdownActive = true;
    const { width: camW, height: camH } = this.cameras.main;
    const fontFamily =
      (this.registry.get("fontFamily") as string) ?? "Orbitron";
    const cx = camW / 2;
    const cy = camH / 2;

    const steps: Array<{ label: string; color: string; size: string }> = [
      { label: "3", color: "#00ffff", size: "96px" },
      { label: "2", color: "#ffff00", size: "104px" },
      { label: "1", color: "#ff3366", size: "112px" },
      { label: "GO!", color: "#00ff88", size: "80px" },
    ];

    const showStep = (index: number) => {
      if (index >= steps.length) {
        this.countdownActive = false;
        return;
      }

      const { label, color, size } = steps[index];
      const text = this.add.text(cx, cy, label, {
        fontFamily,
        fontSize: size,
        color,
        stroke: "#000000",
        strokeThickness: 6,
      });
      text.setOrigin(0.5);
      text.setDepth(900);
      text.setScale(0);
      text.setAlpha(0);

      this.tweens.add({
        targets: text,
        scale: 1.3,
        alpha: 1,
        duration: 180,
        ease: "Back.easeOut",
        onComplete: () => {
          this.tweens.add({
            targets: text,
            scale: 1,
            duration: 100,
            ease: "Power1",
          });
        },
      });

      this.tweens.add({
        targets: text,
        alpha: 0,
        scale: 0.6,
        duration: 250,
        delay: 550,
        ease: "Power2",
        onComplete: () => {
          text.destroy();
          this.time.delayedCall(60, () => showStep(index + 1));
        },
      });
    };

    showStep(0);
  }

  update(time: number, delta: number): void {
    if (this.countdownActive) return;
    if (this.deathSequenceActive) {
      this.player.update(time, delta);
      if (this.respawnDelayMs > 0) {
        this.respawnDelayMs -= delta;
        if (this.respawnDelayMs <= 0) {
          this.respawnPlayer();
        }
      }
      return;
    }

    if (this.ghostsFrozen) {
      this.ghostFreezeTimer -= delta;
      if (this.ghostFreezeTimer <= 0) {
        this.ghostsFrozen = false;
      }
    }

    this.modeTimer += delta;
    if (this.isScatterMode && this.modeTimer >= this.scatterDuration) {
      this.isScatterMode = false;
      this.modeTimer = 0;
      for (const enemy of this.enemies) {
        if (
          enemy.getState() === EnemyState.FRIGHTENED ||
          enemy.getState() === EnemyState.DEAD
        ) {
          continue;
        }
        enemy.setEnemyState(EnemyState.CHASE);
      }
    } else if (!this.isScatterMode && this.modeTimer >= this.chaseDuration) {
      this.isScatterMode = true;
      this.modeTimer = 0;
      for (const enemy of this.enemies) {
        if (
          enemy.getState() === EnemyState.FRIGHTENED ||
          enemy.getState() === EnemyState.DEAD
        ) {
          continue;
        }
        enemy.setEnemyState(EnemyState.SCATTER);
      }
    }
    this.player.update(time, delta);

    for (const enemy of this.enemies) {
      enemy.update(
        time,
        delta,
        this.player.x,
        this.player.y,
        this.player.getCurrentDirection(),
        this.ghostsFrozen,
      );
    }

    if (this.wanderers.length > 0) {
      const anchorX = this.chaser?.getGridX() ?? this.player.getGridX();
      const anchorY = this.chaser?.getGridY() ?? this.player.getGridY();
      for (const wanderer of this.wanderers) {
        wanderer.setChaserPosition(anchorX, anchorY);
      }
    }

    if (
      !this.levelTransitionActive &&
      this.collectibleManager.isLevelComplete()
    ) {
      this.levelTransitionActive = true;
      this.time.delayedCall(1000, () => this.nextLevel());
    }
  }

  onCollectibleHit(_player: unknown, collectibleObj: unknown): void {
    if (this.deathSequenceActive) return;

    const collectible = collectibleObj as Collectible;
    const pts = collectible.getPoints();
    this.scoreValue += pts;
    this.refreshScoreHud();
    this.collectibleManager.removeCollectible(collectible);

    if (collectible.getType() === CollectibleType.POWER_PELLET) {
      this.triggerScreenFlash();
      this.ghostsFrozen = true;
      this.ghostFreezeTimer = Math.max(this.ghostFreezeTimer, 300);
      this.enemies.forEach((e) => e.activateFrightened());
    }

    if (this.collectibleManager.shouldSpawnBonus()) {
      this.collectibleManager.createBonusItem();
    }
  }

  onEnemyHit(_player: unknown, enemyObj: unknown): void {
    if (this.deathSequenceActive) return;

    const enemy = enemyObj as Enemy;
    if (enemy.getState() === EnemyState.FRIGHTENED) {
      this.scoreValue += 200;
      this.refreshScoreHud();
      this.showFloatingScore(enemy.x, enemy.y, 200);
      enemy.setEnemyState(EnemyState.DEAD);
    } else if (
      enemy.getState() !== EnemyState.DEAD &&
      !this.player.isDyingState() &&
      !this.playerInvincible
    ) {
      const killerIndex = this.enemies.indexOf(enemy);
      const killerDefinition =
        killerIndex >= 0 ? this.activeGhostDefinitions[killerIndex] : undefined;
      this.loseLife(killerDefinition);
    }
  }

  private triggerScreenFlash(): void {
    this.screenFlashRect.setAlpha(0.8);
    this.tweens.add({
      targets: this.screenFlashRect,
      alpha: 0,
      duration: 150,
      ease: "Power2",
    });
  }

  private showFloatingScore(x: number, y: number, points: number): void {
    this.refreshScoreHud();
    const fontFamily =
      (this.registry.get("fontFamily") as string) ?? "Orbitron";
    const text = this.add.text(x, y, `+${points}`, {
      fontFamily,
      fontSize: "16px",
      color: "#ffffff",
    });
    text.setOrigin(0.5);
    text.setDepth(999);

    this.tweens.add({
      targets: text,
      y: y - 30,
      alpha: 0,
      scale: 1.2,
      duration: 800,
      ease: "Power2",
      onComplete: () => text.destroy(),
    });

    this.tweens.add({
      targets: text,
      scale: 1.2,
      duration: 100,
      ease: "Power1",
    });
  }

  private isWall(x: number, y: number): boolean {
    if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
      return false;
    }
    return this.grid[y][x].type === CellType.WALL;
  }

  private getCornersToRound(
    hasUp: boolean,
    hasDown: boolean,
    hasLeft: boolean,
    hasRight: boolean,
  ): { tl: boolean; tr: boolean; br: boolean; bl: boolean } {
    const neighbors = [hasUp, hasDown, hasLeft, hasRight].filter(
      Boolean,
    ).length;

    if (neighbors === 0) {
      return { tl: true, tr: true, br: true, bl: true };
    }

    if (neighbors === 1) {
      if (hasRight) return { tl: true, tr: false, br: false, bl: true };
      if (hasLeft) return { tl: false, tr: true, br: true, bl: false };
      if (hasDown) return { tl: true, tr: true, br: false, bl: false };
      if (hasUp) return { tl: false, tr: false, br: true, bl: true };
    }

    if (neighbors === 2) {
      if (hasUp && hasRight)
        return { tl: false, tr: false, br: false, bl: true };
      if (hasUp && hasLeft)
        return { tl: false, tr: false, br: true, bl: false };
      if (hasDown && hasRight)
        return { tl: true, tr: false, br: false, bl: false };
      if (hasDown && hasLeft)
        return { tl: false, tr: true, br: false, bl: false };
      return { tl: false, tr: false, br: false, bl: false };
    }

    return { tl: false, tr: false, br: false, bl: false };
  }

  private renderMaze(): void {
    const vectorMode = (this.registry.get("vectorMode") as string) ?? "color";
    const cornerRadius = 6;

    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        if (this.grid[y][x].type !== CellType.WALL) continue;

        const px = this.offsetX + x * this.tileSize;
        const py = this.offsetY + y * this.tileSize;

        const hasUp = this.isWall(x, y - 1);
        const hasDown = this.isWall(x, y + 1);
        const hasLeft = this.isWall(x - 1, y);
        const hasRight = this.isWall(x + 1, y);

        const { tl, tr, br, bl } = this.getCornersToRound(
          hasUp,
          hasDown,
          hasLeft,
          hasRight,
        );

        const hasRounding = tl || tr || br || bl;

        if (hasRounding) {
          if (vectorMode === "vector") {
            this.wallGraphics.lineStyle(2, 0x00ffff, 1);
            this.drawRoundedRect(
              px,
              py,
              this.tileSize,
              this.tileSize,
              cornerRadius,
              tl,
              tr,
              br,
              bl,
            );
          } else {
            this.wallGraphics.fillStyle(0x0000ff, 0.3);
            this.fillRoundedRect(
              px,
              py,
              this.tileSize,
              this.tileSize,
              cornerRadius,
              tl,
              tr,
              br,
              bl,
            );
            this.wallGraphics.lineStyle(2, 0x0000ff, 1);
            this.drawRoundedRect(
              px,
              py,
              this.tileSize,
              this.tileSize,
              cornerRadius,
              tl,
              tr,
              br,
              bl,
            );
          }
        } else {
          if (vectorMode === "vector") {
            this.wallGraphics.lineStyle(2, 0x00ffff, 1);
            this.wallGraphics.strokeRect(px, py, this.tileSize, this.tileSize);
          } else {
            this.wallGraphics.fillStyle(0x0000ff, 0.3);
            this.wallGraphics.fillRect(px, py, this.tileSize, this.tileSize);
            this.wallGraphics.lineStyle(2, 0x0000ff, 1);
            this.wallGraphics.strokeRect(px, py, this.tileSize, this.tileSize);
          }
        }
      }
    }
  }

  private drawRoundedRect(
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    tl: boolean,
    tr: boolean,
    br: boolean,
    bl: boolean,
  ): void {
    const g = this.wallGraphics;
    g.beginPath();
    g.moveTo(x + (tl ? r : 0), y);
    g.lineTo(x + w - (tr ? r : 0), y);
    if (tr) g.arc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
    else g.lineTo(x + w, y);
    g.lineTo(x + w, y + h - (br ? r : 0));
    if (br) g.arc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
    else g.lineTo(x + w, y + h);
    g.lineTo(x + (bl ? r : 0), y + h);
    if (bl) g.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
    else g.lineTo(x, y + h);
    g.lineTo(x, y + (tl ? r : 0));
    if (tl) g.arc(x + r, y + r, r, Math.PI, (3 * Math.PI) / 2, false);
    else g.lineTo(x, y);
    g.closePath();
    g.strokePath();
  }

  private fillRoundedRect(
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    tl: boolean,
    tr: boolean,
    br: boolean,
    bl: boolean,
  ): void {
    const g = this.wallGraphics;
    g.beginPath();
    g.moveTo(x + (tl ? r : 0), y);
    g.lineTo(x + w - (tr ? r : 0), y);
    if (tr) g.arc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
    else g.lineTo(x + w, y);
    g.lineTo(x + w, y + h - (br ? r : 0));
    if (br) g.arc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
    else g.lineTo(x + w, y + h);
    g.lineTo(x + (bl ? r : 0), y + h);
    if (bl) g.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
    else g.lineTo(x, y + h);
    g.lineTo(x, y + (tl ? r : 0));
    if (tl) g.arc(x + r, y + r, r, Math.PI, (3 * Math.PI) / 2, false);
    else g.lineTo(x, y);
    g.closePath();
    g.fillPath();
  }

  freezeGhosts(enabled: boolean): void {
    this.ghostsFrozen = enabled;
    if (enabled) {
      this.ghostFreezeTimer = Infinity;
    }
  }

  unfreezeGhosts(): void {
    this.ghostsFrozen = false;
    this.ghostFreezeTimer = 0;
  }

  toggleFreezeGhosts(): void {
    this.ghostsFrozen = !this.ghostsFrozen;
    if (this.ghostsFrozen) {
      this.ghostFreezeTimer = Infinity;
    } else {
      this.ghostFreezeTimer = 0;
    }
  }

  private loseLife(killer?: GhostDefinition): void {
    if (this.deathSequenceActive) return;

    this.deathSequenceActive = true;
    this.livesValue--;
    this.renderLivesHud();

    this.player.triggerDeath(() => {
      if (this.livesValue <= 0) {
        launchSceneWithFade(this, "GameOver", {
          score: this.scoreValue,
          killerGhostId: killer?.id,
        });
      } else {
        this.respawnDelayMs = 500;
      }
    });
  }

  private respawnPlayer(): void {
    const spawnGridX = Math.floor(this.gridWidth / 2);
    const spawnGridY = this.gridHeight - 3;
    const spawnCenter = getCellCenter(
      spawnGridX,
      spawnGridY,
      this.tileSize,
      this.offsetX,
      this.offsetY,
    );

    this.player.x = spawnCenter.x;
    this.player.y = spawnCenter.y;
    this.player.respawn();
    this.deathSequenceActive = false;
    this.respawnDelayMs = 0;
    this.playerInvincible = true;
    this.player.startInvulnerability(2000, () => {
      this.playerInvincible = false;
    });
  }

  private getGhostPenSpawnPosition(index: number): { x: number; y: number } {
    const normalizedIndex = ((index % 6) + 6) % 6;
    const cell = getPenGeometry(this.gridWidth, this.gridHeight).interiorCells[
      normalizedIndex
    ];

    return {
      x: cell.gridX,
      y: cell.gridY,
    };
  }

  private resetPositions(): void {
    this.respawnPlayer();

    for (let i = 0; i < this.enemies.length; i++) {
      const spawn = this.getGhostPenSpawnPosition(i);
      const center = getCellCenter(
        spawn.x,
        spawn.y,
        this.tileSize,
        this.offsetX,
        this.offsetY,
      );
      const ex = center.x;
      const ey = center.y;
      this.enemies[i].x = ex;
      this.enemies[i].y = ey;
      this.enemies[i].setDeadReturnTarget(spawn.x, spawn.y);
      this.enemies[i].setEnemyState(EnemyState.SCATTER);
      this.enemies[i].forcePenExit();
    }
  }

  private nextLevel(): void {
    this.levelValue++;
    this.levelTransitionActive = false;
    this.levelText.setText(`LEVEL: ${this.levelValue}`);

    // Destroy old collectibles before creating new ones
    this.collectibleManager.getCollectibles().forEach((c) => c.destroy());

    this.collectibleManager = new CollectibleManager(
      this,
      this.grid,
      this.gridWidth,
      this.gridHeight,
      this.tileSize,
      this.offsetX,
      this.offsetY,
      this.levelValue,
    );
    this.collectibleManager.createAll();

    // Re-register collectible overlap collider for new collectibles
    this.collectibleOverlapCollider?.destroy();
    this.collectibleOverlapCollider = this.physics.add.overlap(
      this.player,
      this.collectibleManager.getCollectibles(),
      this.onCollectibleHit,
      undefined,
      this,
    );

    this.rebuildActiveGhosts();
    this.registerEnemyOverlap();
    this.resetPositions();
    this.runCountdown();
  }

  private registerEnemyOverlap(): void {
    this.enemyOverlapCollider?.destroy();
    this.enemyOverlapCollider = this.physics.add.overlap(
      this.player,
      this.enemies,
      this.onEnemyHit,
      undefined,
      this,
    );
  }

  private rebuildActiveGhosts(): void {
    this.activeGhostDefinitions = getActiveGhostDefinitionsForLevel(
      this.levelValue,
    );
    this.chaser = undefined;
    this.wanderers = [];

    this.enemies?.forEach((enemy) => enemy.destroy());
    this.enemies = this.activeGhostDefinitions.map((definition, index) => {
      const spawn = this.getGhostPenSpawnPosition(index);
      const center = getCellCenter(
        spawn.x,
        spawn.y,
        this.tileSize,
        this.offsetX,
        this.offsetY,
      );
      const ex = center.x;
      const ey = center.y;
      const enemy = this.createEnemyFromDefinition(definition, ex, ey);
      enemy.setDeadReturnTarget(spawn.x, spawn.y);
      enemy.forcePenExit();
      return enemy;
    });
  }

  private createEnemyFromDefinition(
    definition: GhostDefinition,
    ex: number,
    ey: number,
  ): Enemy {
    const scatterTarget = this.resolveScatterTarget(definition);
    const textureName = definition.id;
    const profile = buildGhostAiProfile(definition);

    switch (definition.archetype) {
      case "chaser": {
        const enemy = new Chaser(
          this,
          ex,
          ey,
          textureName,
          this.grid,
          this.gridWidth,
          this.gridHeight,
          this.tileSize,
          this.offsetX,
          this.offsetY,
          scatterTarget,
          profile.speed,
          this.gateOpenTime,
          this.gameStartTime,
          definition.svgCacheKey,
        );
        this.chaser = enemy;
        return enemy;
      }
      case "ambusher":
        return new Ambusher(
          this,
          ex,
          ey,
          textureName,
          this.grid,
          this.gridWidth,
          this.gridHeight,
          this.tileSize,
          this.offsetX,
          this.offsetY,
          scatterTarget,
          profile.speed,
          this.gateOpenTime,
          this.gameStartTime,
          definition.svgCacheKey,
          profile.ambusherPredictionCells,
        );
      case "wanderer": {
        const enemy = new Wanderer(
          this,
          ex,
          ey,
          textureName,
          this.grid,
          this.gridWidth,
          this.gridHeight,
          this.tileSize,
          this.offsetX,
          this.offsetY,
          scatterTarget,
          profile.speed,
          this.gateOpenTime,
          this.gameStartTime,
          definition.svgCacheKey,
          profile.wandererVectorScale,
        );
        this.wanderers.push(enemy);
        return enemy;
      }
      case "sentinel":
        return new Ambusher(
          this,
          ex,
          ey,
          textureName,
          this.grid,
          this.gridWidth,
          this.gridHeight,
          this.tileSize,
          this.offsetX,
          this.offsetY,
          scatterTarget,
          profile.speed,
          this.gateOpenTime,
          this.gameStartTime,
          definition.svgCacheKey,
          profile.ambusherPredictionCells,
        );
      case "trickster": {
        const enemy = new Wanderer(
          this,
          ex,
          ey,
          textureName,
          this.grid,
          this.gridWidth,
          this.gridHeight,
          this.tileSize,
          this.offsetX,
          this.offsetY,
          scatterTarget,
          profile.speed,
          this.gateOpenTime,
          this.gameStartTime,
          definition.svgCacheKey,
          profile.wandererVectorScale,
        );
        this.wanderers.push(enemy);
        return enemy;
      }
      default:
        return new Timid(
          this,
          ex,
          ey,
          textureName,
          this.grid,
          this.gridWidth,
          this.gridHeight,
          this.tileSize,
          this.offsetX,
          this.offsetY,
          scatterTarget,
          profile.speed,
          this.gateOpenTime,
          this.gameStartTime,
          definition.svgCacheKey,
          profile.timidDistanceThreshold,
        );
    }
  }
}
