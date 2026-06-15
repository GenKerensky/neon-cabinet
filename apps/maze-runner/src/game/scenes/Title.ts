import { Scene } from "phaser";
import { SVGParser, VectorPuppet } from "@neon-cabinet/sprite-tools";
import { EventBus } from "../EventBus";
import { ghostDefinitions } from "../config/ghostDefinitions";
import { CellType, MazeGenerator } from "../utils/MazeGenerator";
import { readHighScore, formatScore } from "../utils/highScore";
import { fadeInScene, startSceneWithFade } from "../utils/sceneTransitions";
import {
  hackUpgradeDefinitions,
  purchaseHackUpgrade,
  readHackProgression,
} from "../utils/hackProgression";

const TITLE_MAZE_TEXTURE_KEY = "maze_runner_title_background_maze";
const TITLE_MAZE_TILE_SIZE = 32;
const TITLE_MAZE_SCROLL_X = 25;
const TITLE_MAZE_SCROLL_Y = 18;
const TITLE_CHASE_CHARACTER_SCALE = 1.15;
const TITLE_CHASE_CHARACTER_SPACING = 44;
const TITLE_CHASE_HORIZONTAL_DURATION = 8500;
const TITLE_CHASE_OFFSCREEN_TRANSFER_DURATION = 1700;

export class Title extends Scene {
  private mazeBackground?: Phaser.GameObjects.TileSprite;
  private attractPuppets: VectorPuppet[] = [];
  private shopText?: Phaser.GameObjects.Text;

  constructor() {
    super("Title");
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#000000");
    fadeInScene(this);
    this.sound?.play?.("maze_runner_title_theme", {
      loop: true,
      volume: 0.3,
    });

    this.cameras.main.setPostPipeline("VectorShader");
    const { width, height } = this.cameras.main;
    const fontFamily =
      (this.registry.get("fontFamily") as string) ?? "Orbitron";

    this.createScrollingMazeBackground(width, height);

    // Background: Blue maze rail frame
    const mazeGraphics = this.add.graphics();
    mazeGraphics.setDepth(10);
    mazeGraphics.lineStyle(4, 0x0000ff, 0.8);
    mazeGraphics.strokeRoundedRect(
      width * 0.1,
      height * 0.1,
      width * 0.8,
      height * 0.8,
      16,
    );
    mazeGraphics.lineStyle(2, 0x4444ff, 0.8);
    mazeGraphics.strokeRoundedRect(
      width * 0.1 + 8,
      height * 0.1 + 8,
      width * 0.8 - 16,
      height * 0.8 - 16,
      8,
    );

    // Background: Pellet trail
    const numPellets = 24;
    for (let i = 0; i < numPellets; i++) {
      const px = width * 0.15 + (width * 0.7 * i) / (numPellets - 1);
      const py = height * 0.85;
      const p = this.add.graphics({ x: px, y: py });
      p.fillStyle(0xffffcc, 1);
      p.fillCircle(0, 0, 3);
      p.setDepth(11);

      this.tweens.add({
        targets: p,
        alpha: 0.2,
        scale: 0.5,
        duration: 500,
        yoyo: true,
        repeat: -1,
        delay: i * 100,
      });
    }

    // Background: Attract loop (dynamic bounds within the blue frame)
    const frameLeft = width * 0.1;
    const frameTop = height * 0.1;
    const frameWidth = width * 0.8;
    const frameHeight = height * 0.8;
    const attractBounds = {
      x: frameLeft + 16,
      y: frameTop + 16,
      width: frameWidth - 32,
      height: frameHeight - 32,
    };

    // Container for attract group
    const attractContainer = this.add.container(0, 0);
    attractContainer.setDepth(12);

    // Mask
    const maskRect = this.add.graphics();
    maskRect.fillStyle(0xffffff);
    maskRect.fillRect(
      attractBounds.x,
      attractBounds.y,
      attractBounds.width,
      attractBounds.height,
    );
    const mask = maskRect.createGeometryMask();
    maskRect.setVisible(false);
    attractContainer.setMask(mask);

    this.createAttractChase(attractContainer, attractBounds, height);

    // Animated title
    const titleGlow = this.add
      .text(width / 2, height * 0.25, "MAZE RUNNER", {
        fontFamily,
        fontSize: "48px",
        color: "#ffff00",
      })
      .setOrigin(0.5)
      .setAlpha(0.25)
      .setDepth(99);

    this.add
      .text(width / 2, height * 0.25, "MAZE RUNNER", {
        fontFamily,
        fontSize: "48px",
        color: "#ffff00",
        stroke: "#664400",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(100);

    this.tweens.add({
      targets: titleGlow,
      scaleX: 1.05,
      scaleY: 1.05,
      alpha: 0.1,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Subtitle
    this.add
      .text(width / 2, height * 0.38, "NEON CABINET", {
        fontFamily,
        fontSize: "16px",
        color: "#888888",
      })
      .setOrigin(0.5)
      .setDepth(100);

    // High Score
    const highScore = readHighScore(this.registry);
    this.add
      .text(width / 2, height * 0.45, `HIGH SCORE: ${formatScore(highScore)}`, {
        fontFamily,
        fontSize: "20px",
        color: "#ffffcc",
      })
      .setOrigin(0.5)
      .setDepth(100);

    this.shopText = this.add
      .text(width / 2, height * 0.54, this.getShopText(), {
        fontFamily,
        fontSize: "13px",
        color: "#00ff66",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(100);

    // Start prompt
    const prompt = this.add
      .text(width / 2, height * 0.65, "PRESS SPACE TO START", {
        fontFamily,
        fontSize: "20px",
        color: "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(100);

    this.tweens.add({
      targets: prompt,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // Controls info
    this.add
      .text(width / 2, height * 0.75, "ARROW KEYS / WASD - MOVE", {
        fontFamily,
        fontSize: "14px",
        color: "#666666",
      })
      .setOrigin(0.5)
      .setDepth(100);

    this.add
      .text(width / 2, height * 0.79, "E - ACTIVATE HELD HACK", {
        fontFamily,
        fontSize: "14px",
        color: "#666666",
      })
      .setOrigin(0.5)
      .setDepth(100);

    // CRT restraint: scanlines and vignette
    const scanlines = this.add.graphics();
    scanlines.fillStyle(0x000000, 0.06);
    for (let y = 0; y < height; y += 4) {
      scanlines.fillRect(0, y, width, 2);
    }
    scanlines.setDepth(50);

    const vignette = this.add.graphics();
    vignette.fillStyle(0x000000, 0.12);
    vignette.fillRect(0, 0, width, height);
    vignette.setDepth(51);

    // Start handlers
    let starting = false;
    const startGame = () => {
      if (starting) return;
      starting = true;
      this.sound?.stopByKey?.("maze_runner_title_theme");
      this.sound?.play?.("maze_runner_game_start", { volume: 0.65 });
      startSceneWithFade(this, "Game");
      EventBus.emit("current-scene-ready", this);
    };

    this.input.keyboard?.on("keydown-SPACE", startGame);
    this.input.keyboard?.on("keydown-ENTER", startGame);
    this.bindShopKeys();
    this.input.on("pointerdown", startGame);

    // Auto-start for headless testing
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("test")) {
      this.time.delayedCall(500, startGame);
    }

    EventBus.emit("current-scene-ready", this);
  }

  private bindShopKeys(): void {
    hackUpgradeDefinitions.forEach((upgrade, index) => {
      this.input.keyboard?.on(`keydown-${index + 1}`, () => {
        purchaseHackUpgrade(upgrade.id);
        this.shopText?.setText(this.getShopText());
      });
    });
  }

  private getShopText(): string {
    const progression = readHackProgression();
    const upgrades = hackUpgradeDefinitions
      .map((upgrade, index) => {
        const owned = progression.unlocks.includes(upgrade.id)
          ? "OWNED"
          : `${upgrade.cost}B`;
        return `${index + 1}. ${upgrade.name} ${owned}`;
      })
      .join("   ");
    return `BYTES: ${progression.bytes}\n${upgrades}`;
  }

  update(_time: number, delta: number): void {
    if (this.mazeBackground) {
      this.mazeBackground.tilePositionX += (TITLE_MAZE_SCROLL_X * delta) / 1000;
      this.mazeBackground.tilePositionY += (TITLE_MAZE_SCROLL_Y * delta) / 1000;
    }

    for (const puppet of this.attractPuppets) {
      puppet.update(_time, delta);
    }
  }

  private createAttractChase(
    parent: Phaser.GameObjects.Container,
    bounds: { x: number; y: number; width: number; height: number },
    screenHeight: number,
  ): void {
    this.attractPuppets = [];

    const group = this.add.container(0, 0);
    parent.add(group);

    const parser = new SVGParser();
    const playerSvg = this.cache.text.get("player_svg") ?? "";
    const player = new VectorPuppet(this, 0, 0, parser.parse(playerSvg));
    player.setScale(TITLE_CHASE_CHARACTER_SCALE);
    group.add(player);
    this.attractPuppets.push(player);

    ghostDefinitions.slice(0, 3).forEach((definition) => {
      const ghostSvg = this.cache.text.get(definition.svgCacheKey) ?? "";
      const ghost = new VectorPuppet(this, 0, 0, {
        ...parser.parse(ghostSvg),
      });
      ghost.setScale(TITLE_CHASE_CHARACTER_SCALE);
      group.add(ghost);
      this.attractPuppets.push(ghost);
    });

    const trailWidth = TITLE_CHASE_CHARACTER_SPACING * 3 + 48;
    const leftOffscreenX = bounds.x - trailWidth;
    const rightOffscreenX = bounds.x + bounds.width + trailWidth;
    const lanes = [
      Math.max(bounds.y + 44, screenHeight * 0.18),
      Math.min(bounds.y + bounds.height - 90, screenHeight * 0.54),
    ];

    this.setAttractDirection("RIGHT");
    group.setPosition(leftOffscreenX, lanes[0]);

    this.tweens.chain({
      targets: group,
      tweens: [
        {
          x: rightOffscreenX,
          y: lanes[0],
          duration: TITLE_CHASE_HORIZONTAL_DURATION,
          onStart: () => {
            group.scaleX = 1;
            group.setPosition(leftOffscreenX, lanes[0]);
            this.setAttractDirection("RIGHT");
          },
        },
        {
          x: rightOffscreenX,
          y: lanes[1],
          duration: TITLE_CHASE_OFFSCREEN_TRANSFER_DURATION,
        },
        {
          x: leftOffscreenX,
          y: lanes[1],
          duration: TITLE_CHASE_HORIZONTAL_DURATION,
          onStart: () => {
            group.scaleX = 1;
            group.setPosition(rightOffscreenX, lanes[1]);
            this.setAttractDirection("LEFT");
          },
        },
        {
          x: leftOffscreenX,
          y: lanes[0],
          duration: TITLE_CHASE_OFFSCREEN_TRANSFER_DURATION,
        },
      ],
      loop: -1,
    });
  }

  private setAttractDirection(direction: "LEFT" | "RIGHT"): void {
    this.attractPuppets.forEach((puppet, index) => {
      puppet.x =
        index === 0
          ? 0
          : TITLE_CHASE_CHARACTER_SPACING *
            index *
            (direction === "RIGHT" ? -1 : 1);
      puppet.y = 0;
      puppet.setDirection(direction);
    });
  }

  private createScrollingMazeBackground(width: number, height: number): void {
    this.prerenderTitleMazeTexture();

    this.mazeBackground = this.add
      .tileSprite(width / 2, height / 2, width, height, TITLE_MAZE_TEXTURE_KEY)
      .setOrigin(0.5)
      .setDepth(1)
      .setAlpha(0.33);
  }

  private prerenderTitleMazeTexture(): void {
    if (this.textures?.exists?.(TITLE_MAZE_TEXTURE_KEY)) return;

    const generator = new MazeGenerator(3, 1, this.createTitleMazeRng());
    const grid = generator.create();
    const textureWidth = generator.getWidth() * TITLE_MAZE_TILE_SIZE;
    const textureHeight = generator.getHeight() * TITLE_MAZE_TILE_SIZE;
    const graphics = this.add.graphics();

    graphics.fillStyle(0x0000ff, 0.14);
    graphics.lineStyle(2, 0x00aaff, 0.24);

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        if (grid[y][x].type !== CellType.WALL) continue;

        const px = x * TITLE_MAZE_TILE_SIZE;
        const py = y * TITLE_MAZE_TILE_SIZE;
        graphics.fillRect(px, py, TITLE_MAZE_TILE_SIZE, TITLE_MAZE_TILE_SIZE);
        graphics.strokeRect(px, py, TITLE_MAZE_TILE_SIZE, TITLE_MAZE_TILE_SIZE);
      }
    }

    graphics.generateTexture(
      TITLE_MAZE_TEXTURE_KEY,
      textureWidth,
      textureHeight,
    );
    graphics.destroy();
  }

  private createTitleMazeRng(): () => number {
    let seed = 0x4d415a45;

    return () => {
      seed = (1664525 * seed + 1013904223) >>> 0;
      return seed / 0x100000000;
    };
  }
}
