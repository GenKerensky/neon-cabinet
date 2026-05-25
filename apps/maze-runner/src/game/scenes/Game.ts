import { Scene, Input } from "phaser";
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
  Collectible,
  CollectibleManager,
  CollectibleType,
} from "../objects/Collectible";

export class Game extends Scene {
  private generator!: MazeGenerator;
  private player!: Player;
  private enemies!: Enemy[];
  private chaser!: Chaser;
  private wanderer!: Wanderer;
  private collectibleManager!: CollectibleManager;
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
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

  constructor() {
    super("Game");
  }

  create(): void {
    this.gameStartTime = this.time.now;
    const difficulty = (this.registry.get("difficulty") as number) ?? 1;
    const fontFamily =
      (this.registry.get("fontFamily") as string) ?? "Orbitron";

    this.generator = new MazeGenerator(difficulty);
    this.grid = this.generator.create();
    this.gridHeight = this.grid.length;
    this.gridWidth = this.grid[0].length;

    const mapWidth = this.gridWidth * this.tileSize;
    const mapHeight = this.gridHeight * this.tileSize;

    const { width: camW, height: camH } = this.cameras.main;
    this.offsetX = (camW - mapWidth) / 2;
    this.offsetY = (camH - mapHeight) / 2;

    this.cameras.main.setPostPipeline("VectorShader");
    this.wallGraphics = this.add.graphics();
    this.renderMaze();

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
    const spawnX =
      this.offsetX + spawnGridX * this.tileSize + this.tileSize / 2;
    const spawnY =
      this.offsetY + spawnGridY * this.tileSize + this.tileSize / 2;

    this.player = new Player(
      this,
      spawnX,
      spawnY,
      "player_right_0",
      this.grid,
      this.gridWidth,
      this.gridHeight,
      this.tileSize,
      this.offsetX,
      this.offsetY,
      200,
    );
    this.player.play("player_chomp_right");
    this.player.anims.pause();

    const centerX = Math.floor(this.gridWidth / 2);
    const centerY = Math.floor(this.gridHeight / 2);
    const enemyConfigs = [
      {
        gridX: centerX - 1,
        gridY: centerY,
        texture: "chaser",
        scatterX: this.gridWidth - 2,
        scatterY: 1,
      },
      {
        gridX: centerX,
        gridY: centerY,
        texture: "ambusher",
        scatterX: 1,
        scatterY: 1,
      },
      {
        gridX: centerX + 1,
        gridY: centerY,
        texture: "wanderer",
        scatterX: this.gridWidth - 2,
        scatterY: this.gridHeight - 2,
      },
      {
        gridX: centerX,
        gridY: centerY + 1,
        texture: "timid",
        scatterX: 1,
        scatterY: this.gridHeight - 2,
      },
    ];

    this.enemies = enemyConfigs.map((cfg) => {
      const ex = this.offsetX + cfg.gridX * this.tileSize + this.tileSize / 2;
      const ey = this.offsetY + cfg.gridY * this.tileSize + this.tileSize / 2;
      const scatterTarget = { x: cfg.scatterX, y: cfg.scatterY };

      let enemy: Enemy;
      const textureName = cfg.texture;
      switch (cfg.texture) {
        case "chaser":
          this.chaser = new Chaser(
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
            undefined,
            this.gateOpenTime,
            this.gameStartTime,
          );
          enemy = this.chaser;
          break;
        case "ambusher":
          enemy = new Ambusher(
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
            undefined,
            this.gateOpenTime,
            this.gameStartTime,
          );
          break;
        case "wanderer":
          this.wanderer = new Wanderer(
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
            undefined,
            this.gateOpenTime,
            this.gameStartTime,
          );
          enemy = this.wanderer;
          break;
        default:
          enemy = new Timid(
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
            undefined,
            this.gateOpenTime,
            this.gameStartTime,
          );
          break;
      }
      const dir = enemy.getCurrentDirection();
      const dirKey =
        dir === Direction.LEFT
          ? "left"
          : dir === Direction.RIGHT
            ? "right"
            : dir === Direction.UP
              ? "up"
              : "down";
      enemy.play(`${textureName}_walk_${dirKey}`, true);
      return enemy;
    });

    this.input.keyboard
      ?.addKey(Input.Keyboard.KeyCodes.UP)
      .on("down", () => this.player.setDirection(Direction.UP));
    this.input.keyboard
      ?.addKey(Input.Keyboard.KeyCodes.W)
      .on("down", () => this.player.setDirection(Direction.UP));
    this.input.keyboard
      ?.addKey(Input.Keyboard.KeyCodes.DOWN)
      .on("down", () => this.player.setDirection(Direction.DOWN));
    this.input.keyboard
      ?.addKey(Input.Keyboard.KeyCodes.S)
      .on("down", () => this.player.setDirection(Direction.DOWN));
    this.input.keyboard
      ?.addKey(Input.Keyboard.KeyCodes.LEFT)
      .on("down", () => this.player.setDirection(Direction.LEFT));
    this.input.keyboard
      ?.addKey(Input.Keyboard.KeyCodes.A)
      .on("down", () => this.player.setDirection(Direction.LEFT));
    this.input.keyboard
      ?.addKey(Input.Keyboard.KeyCodes.RIGHT)
      .on("down", () => this.player.setDirection(Direction.RIGHT));
    this.input.keyboard
      ?.addKey(Input.Keyboard.KeyCodes.D)
      .on("down", () => this.player.setDirection(Direction.RIGHT));

    this.input.keyboard?.addKey(Input.Keyboard.KeyCodes.ESC).on("down", () => {
      this.scene.pause();
      this.scene.launch("Pause");
    });

    this.physics.add.overlap(
      this.player,
      this.collectibleManager.getCollectibles(),
      this.onCollectibleHit,
      undefined,
      this,
    );

    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.onEnemyHit,
      undefined,
      this,
    );

    this.scoreText = this.add.text(16, 16, `SCORE: ${this.scoreValue}`, {
      fontFamily,
      fontSize: "16px",
      color: "#ffffff",
    });

    this.livesText = this.add.text(16, 40, `LIVES: ${this.livesValue}`, {
      fontFamily,
      fontSize: "16px",
      color: "#ffffff",
    });

    this.levelText = this.add
      .text(camW - 16, 16, `LEVEL: ${this.levelValue}`, {
        fontFamily,
        fontSize: "16px",
        color: "#ffffff",
      })
      .setOrigin(1, 0);

    EventBus.emit("current-scene-ready", this);
  }

  update(_time: number, delta: number): void {
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
        enemy.setEnemyState(EnemyState.CHASE);
      }
    } else if (!this.isScatterMode && this.modeTimer >= this.chaseDuration) {
      this.isScatterMode = true;
      this.modeTimer = 0;
      for (const enemy of this.enemies) {
        enemy.setEnemyState(EnemyState.SCATTER);
      }
    }
    this.player.update(delta);

    for (const enemy of this.enemies) {
      if (!this.ghostsFrozen) {
        enemy.update(
          delta,
          this.player.x,
          this.player.y,
          this.player.getCurrentDirection(),
        );
      }
    }

    this.wanderer?.setChaserPosition(
      this.chaser.getGridX(),
      this.chaser.getGridY(),
    );

    if (this.collectibleManager.isLevelComplete()) {
      this.time.delayedCall(1000, () => this.nextLevel());
    }
  }

  onCollectibleHit(_player: unknown, collectibleObj: unknown): void {
    const collectible = collectibleObj as Collectible;
    const pts = collectible.getPoints();
    this.scoreValue += pts;
    this.scoreText.setText(`SCORE: ${this.scoreValue}`);
    this.collectibleManager.removeCollectible(collectible);

    if (collectible.getType() === CollectibleType.POWER_PELLET) {
      this.triggerScreenFlash();
      this.ghostsFrozen = true;
      this.ghostFreezeTimer = 300;
      this.enemies.forEach((e) => e.setEnemyState(EnemyState.FRIGHTENED));
    }

    if (this.collectibleManager.shouldSpawnBonus()) {
      this.collectibleManager.createBonusItem();
    }
  }

  onEnemyHit(_player: unknown, enemyObj: unknown): void {
    const enemy = enemyObj as Enemy;
    if (enemy.getState() === EnemyState.FRIGHTENED) {
      this.scoreValue += 200;
      this.scoreText.setText(`SCORE: ${this.scoreValue}`);
      this.showFloatingScore(enemy.x, enemy.y, 200);
      enemy.setEnemyState(EnemyState.DEAD);
    } else if (enemy.getState() !== EnemyState.DEAD) {
      this.loseLife();
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

  private renderMaze(): void {
    const vectorMode = (this.registry.get("vectorMode") as string) ?? "color";

    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        if (this.grid[y][x].type !== CellType.WALL) continue;

        const px = this.offsetX + x * this.tileSize;
        const py = this.offsetY + y * this.tileSize;

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

  private loseLife(): void {
    this.livesValue--;
    this.livesText.setText(`LIVES: ${this.livesValue}`);

    if (this.livesValue <= 0) {
      this.scene.pause();
      this.scene.launch("GameOver", { score: this.scoreValue });
    } else {
      this.player.triggerDeath(() => {
        this.time.delayedCall(500, () => this.resetPositions());
      });
    }
  }

  private resetPositions(): void {
    const spawnGridX = Math.floor(this.gridWidth / 2);
    const spawnGridY = Math.floor(this.gridHeight / 2) + 2;
    const spawnX =
      this.offsetX + spawnGridX * this.tileSize + this.tileSize / 2;
    const spawnY =
      this.offsetY + spawnGridY * this.tileSize + this.tileSize / 2;

    this.player.x = spawnX;
    this.player.y = spawnY;
    this.player.respawn();

    const enemySpawnY = Math.floor(this.gridHeight / 2) - 1;
    const enemyGridPositions = [
      { x: spawnGridX, y: enemySpawnY },
      { x: spawnGridX - 1, y: enemySpawnY },
      { x: spawnGridX + 1, y: enemySpawnY },
      { x: spawnGridX, y: enemySpawnY - 1 },
    ];

    for (let i = 0; i < this.enemies.length; i++) {
      const ex =
        this.offsetX +
        enemyGridPositions[i].x * this.tileSize +
        this.tileSize / 2;
      const ey =
        this.offsetY +
        enemyGridPositions[i].y * this.tileSize +
        this.tileSize / 2;
      this.enemies[i].x = ex;
      this.enemies[i].y = ey;
      this.enemies[i].setEnemyState(EnemyState.SCATTER);
    }
  }

  private nextLevel(): void {
    this.levelValue++;
    this.levelText.setText(`LEVEL: ${this.levelValue}`);

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

    this.resetPositions();
  }
}
