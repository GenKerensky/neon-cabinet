import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { readHighScore, formatScore } from "../utils/highScore";
import { fadeInScene, startSceneWithFade } from "../utils/sceneTransitions";

export class Title extends Scene {
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
      x: frameLeft + 20,
      y: frameTop + 20,
      width: frameWidth - 40,
      height: Math.min(120, frameHeight * 0.2),
    };

    // Container for attract group
    const attractContainer = this.add.container(0, 0);
    attractContainer.setDepth(9);

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

    const chaseGroup = this.add.container(0, 0);
    attractContainer.add(chaseGroup);

    // Player visual
    const playerVisual = this.add.container(0, 0);
    const playerBody = this.add.graphics();
    playerBody.fillStyle(0xffff00, 1);
    playerBody.fillCircle(0, 0, 14);

    const playerMouth = this.add.graphics();
    playerMouth.fillStyle(0x000000, 1);
    playerMouth.beginPath();
    playerMouth.moveTo(0, 0);
    playerMouth.arc(0, 0, 15, -Math.PI / 4, Math.PI / 4, false);
    playerMouth.closePath();
    playerMouth.fillPath();

    playerVisual.add([playerBody, playerMouth]);
    chaseGroup.add(playerVisual);

    this.tweens.add({
      targets: playerMouth,
      scaleY: 0.1,
      duration: 150,
      yoyo: true,
      repeat: -1,
    });

    const ghostColors = [0xff0000, 0xffb8ff, 0x00ffff];
    ghostColors.forEach((color, i) => {
      const ghost = this.add.graphics();
      ghost.fillStyle(color, 1);
      ghost.beginPath();
      ghost.arc(0, 0, 14, Math.PI, 0, false);
      ghost.lineTo(14, 14);
      ghost.lineTo(-14, 14);
      ghost.closePath();
      ghost.fillPath();

      ghost.fillStyle(0xffffff, 1);
      ghost.fillCircle(-5, -3, 4);
      ghost.fillCircle(5, -3, 4);
      ghost.fillStyle(0x0000ff, 1);
      ghost.fillCircle(-5, -3, 2);
      ghost.fillCircle(5, -3, 2);

      ghost.x = -34 * (i + 1);
      chaseGroup.add(ghost);

      this.tweens.add({
        targets: ghost,
        y: -4,
        duration: 250,
        yoyo: true,
        repeat: -1,
        delay: i * 100,
      });
    });

    const startA = attractBounds.x - 90;
    const endA = attractBounds.x + attractBounds.width + 90;
    const yA = attractBounds.y + 35;

    const startB = attractBounds.x + attractBounds.width + 90;
    const endB = attractBounds.x - 90;
    const yB = attractBounds.y + 85;

    chaseGroup.setPosition(startA, yA);

    this.tweens.chain({
      targets: chaseGroup,
      tweens: [
        {
          x: endA,
          y: yA,
          duration: 6000,
          onStart: () => {
            chaseGroup.scaleX = 1;
            chaseGroup.setPosition(startA, yA);
          },
        },
        {
          x: endB,
          y: yB,
          duration: 6000,
          onStart: () => {
            chaseGroup.scaleX = -1;
            chaseGroup.setPosition(startB, yB);
          },
        },
      ],
      loop: -1,
    });

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
    this.input.on("pointerdown", startGame);

    // Auto-start for headless testing
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("test")) {
      this.time.delayedCall(500, startGame);
    }

    EventBus.emit("current-scene-ready", this);
  }
}
