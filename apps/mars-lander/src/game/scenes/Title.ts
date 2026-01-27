import { Display, Math as PhaserMath, Scene } from "phaser";
import type { GameObjects } from "phaser";
import { EventBus } from "../EventBus";
import { getFontFamily } from "../utils/font";

export class Title extends Scene {
  private titleText!: GameObjects.Text;
  private subtitleText!: GameObjects.Text;
  private startText!: GameObjects.Text;
  private landerPreview!: GameObjects.Image;

  constructor() {
    super("Title");
  }

  create(): void {
    const { width, height } = this.cameras.main;
    const font = getFontFamily(this);

    // Apply vector shader
    this.cameras.main.setPostPipeline("VectorShader");

    // Create atmosphere gradient background
    this.createAtmosphereBackground();

    // Create scrolling star field
    this.createStarField();

    // Title with martian orange theme
    this.titleText = this.add.text(width / 2, height * 0.16, "MARS LANDER", {
      fontFamily: font,
      fontSize: "72px",
      color: "#ff6600",
      stroke: "#cc3300",
      strokeThickness: 3,
    });
    this.titleText.setOrigin(0.5);
    this.titleText.setDepth(10);

    // Title glow effect
    const titleGlow = this.add.text(width / 2, height * 0.16, "MARS LANDER", {
      fontFamily: font,
      fontSize: "72px",
      color: "#ff6600",
    });
    titleGlow.setOrigin(0.5);
    titleGlow.setAlpha(0.3);
    titleGlow.setDepth(9);

    // Pulsing glow animation
    this.tweens.add({
      targets: titleGlow,
      alpha: 0.1,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Subtle title float
    this.tweens.add({
      targets: [this.titleText, titleGlow],
      y: height * 0.16 + 6,
      duration: 2500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.subtitleText = this.add.text(
      width / 2,
      height * 0.24,
      "TOUCH DOWN ON THE RED PLANET",
      {
        fontFamily: font,
        fontSize: "18px",
        color: "#cc6644",
      },
    );
    this.subtitleText.setOrigin(0.5);
    this.subtitleText.setDepth(10);

    // High score display
    const highScore = localStorage.getItem("marsLanderHighScore");
    if (highScore) {
      const highScoreText = this.add.text(
        width / 2,
        height * 0.3,
        `HIGH SCORE: ${highScore}`,
        {
          fontFamily: font,
          fontSize: "20px",
          color: "#00ddff",
        },
      );
      highScoreText.setOrigin(0.5);
      highScoreText.setDepth(10);
    }

    // Lander preview with floating animation
    this.landerPreview = this.add.image(width / 2, height * 0.55, "lander");
    this.landerPreview.setScale(1.5);
    this.landerPreview.setDepth(5);

    // Float the lander
    this.tweens.add({
      targets: this.landerPreview,
      y: height * 0.55 + 15,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Create thruster particle effect under lander
    const thrusterParticles = this.add.particles(0, 0, "flame", {
      x: width / 2,
      y: height * 0.55 + 70,
      speed: { min: 50, max: 100 },
      angle: { min: 80, max: 100 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 400,
      frequency: 50,
      quantity: 2,
      blendMode: "ADD",
    });
    thrusterParticles.setDepth(4);

    // Start prompt
    this.startText = this.add.text(
      width / 2,
      height * 0.85,
      "PRESS SPACE TO START",
      {
        fontFamily: font,
        fontSize: "24px",
        color: "#ffffff",
      },
    );
    this.startText.setOrigin(0.5);
    this.startText.setDepth(10);

    // Blinking start text
    this.tweens.add({
      targets: this.startText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Controls info
    const controlsText = this.add.text(
      width / 2,
      height * 0.92,
      "W/↑ - THRUST  |  A/D or ←/→ - ROTATE",
      {
        fontFamily: font,
        fontSize: "20px",
        fontStyle: "bold",
        color: "#aaaaaa",
      },
    );
    controlsText.setOrigin(0.5);
    controlsText.setDepth(10);

    // Input handling
    this.input.keyboard?.once("keydown-SPACE", () => {
      this.scene.start("Game");
    });

    this.input.once("pointerdown", () => {
      this.scene.start("Game");
    });

    EventBus.emit("current-scene-ready", this);
  }

  private createAtmosphereBackground(): void {
    const { width, height } = this.cameras.main;
    const graphics = this.add.graphics();

    // Create gradient from dark space to Mars atmosphere
    // Top: black space
    // Bottom: reddish-orange Mars atmosphere glow
    const steps = 20;
    for (let i = 0; i < steps; i++) {
      const y = (height / steps) * i;
      const h = height / steps + 1;

      // Interpolate from black to dark red/orange at bottom
      const progress = i / steps;
      const r = Math.floor(progress * progress * 60); // Exponential for atmosphere
      const g = Math.floor(progress * progress * 20);
      const b = Math.floor(progress * progress * 10);

      const color = Display.Color.GetColor(r, g, b);
      graphics.fillStyle(color, 1);
      graphics.fillRect(0, y, width, h);
    }

    graphics.setDepth(-2);
  }

  private createStarField(): void {
    const { width, height } = this.cameras.main;
    const stars = this.add.graphics();

    // Distant dim stars
    for (let i = 0; i < 100; i++) {
      const x = PhaserMath.Between(0, width);
      const y = PhaserMath.Between(0, height * 0.7); // More stars at top
      const brightness = PhaserMath.Between(40, 80);
      const color = Display.Color.GetColor(brightness, brightness, brightness);
      stars.fillStyle(color, 0.6);
      stars.fillCircle(x, y, 0.5);
    }

    // Medium stars
    for (let i = 0; i < 50; i++) {
      const x = PhaserMath.Between(0, width);
      const y = PhaserMath.Between(0, height * 0.6);
      const brightness = PhaserMath.Between(100, 160);
      const color = Display.Color.GetColor(brightness, brightness, brightness);
      stars.fillStyle(color, 0.8);
      stars.fillCircle(x, y, 1);
    }

    // Bright stars
    for (let i = 0; i < 20; i++) {
      const x = PhaserMath.Between(0, width);
      const y = PhaserMath.Between(0, height * 0.5);
      const brightness = PhaserMath.Between(180, 255);
      const color = Display.Color.GetColor(
        brightness,
        brightness,
        brightness + 20,
      );
      stars.fillStyle(color, 1);
      stars.fillCircle(x, y, PhaserMath.FloatBetween(1, 1.5));
    }

    stars.setDepth(-1);
  }

  update(): void {
    // Stars could animate here if needed
  }
}
