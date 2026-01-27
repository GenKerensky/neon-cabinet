import { Math as PhaserMath, Scene } from "phaser";
import type { GameObjects } from "phaser";
import { EventBus } from "../EventBus";
import { getFontFamily } from "../utils/font";

export class Title extends Scene {
  private stars: { sprite: GameObjects.Arc; speed: number }[] = [];
  private titleText!: GameObjects.Text;
  private subtitleText!: GameObjects.Text;
  private startText!: GameObjects.Text;
  private floatingAsteroids: GameObjects.Image[] = [];
  private shipPreview!: GameObjects.Image;
  private particles!: GameObjects.Particles.ParticleEmitter;

  constructor() {
    super("Title");
  }

  create(): void {
    const { width, height } = this.cameras.main;
    const font = getFontFamily(this);

    // Apply CRT shader
    // Color mode will be set automatically in onPreRender from registry
    this.cameras.main.setPostPipeline("VectorShader");

    // Create scrolling star field
    this.createStarField();

    // Create floating asteroids in background
    this.createFloatingAsteroids();

    // Create ambient particle dust
    this.createAmbientParticles();

    this.titleText = this.add.text(width / 2, height * 0.16, "SPACE DEFENDER", {
      fontFamily: font,
      fontSize: "72px",
      color: "#00ddff",
      stroke: "#006688",
      strokeThickness: 3,
    });
    this.titleText.setOrigin(0.5);
    this.titleText.setDepth(10);

    const titleGlow = this.add.text(
      width / 2,
      height * 0.16,
      "SPACE DEFENDER",
      {
        fontFamily: font,
        fontSize: "72px",
        color: "#00ddff",
      },
    );
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
      "DEFEND THE GALAXY FROM ASTEROID THREATS",
      {
        fontFamily: font,
        fontSize: "18px",
        color: "#888888",
      },
    );
    this.subtitleText.setOrigin(0.5);
    this.subtitleText.setDepth(10);

    // High score display below tagline (if exists)
    const highScore = localStorage.getItem("spaceDefenderHighScore");
    if (highScore) {
      const highScoreText = this.add.text(
        width / 2,
        height * 0.3,
        `HIGH SCORE: ${highScore}`,
        {
          fontFamily: font,
          fontSize: "24px",
          color: "#00ff66",
        },
      );
      highScoreText.setOrigin(0.5);
      highScoreText.setDepth(10);

      // Green glow layer
      const highScoreGlow = this.add.text(
        width / 2,
        height * 0.3,
        `HIGH SCORE: ${highScore}`,
        {
          fontFamily: font,
          fontSize: "24px",
          color: "#00ff66",
        },
      );
      highScoreGlow.setOrigin(0.5);
      highScoreGlow.setAlpha(0.4);
      highScoreGlow.setDepth(9);

      // Pulsing glow effect
      this.tweens.add({
        targets: [highScoreText, highScoreGlow],
        alpha: { from: 1, to: 0.5 },
        scaleX: { from: 1, to: 1.03 },
        scaleY: { from: 1, to: 1.03 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    this.shipPreview = this.add.image(width / 2, height * 0.46, "ship");
    this.shipPreview.setScale(2);
    this.shipPreview.setDepth(10);
    this.shipPreview.setRotation(0);

    // Animate ship moving up and down the screen (smaller range, higher position)
    this.tweens.add({
      targets: this.shipPreview,
      y: { from: height * 0.42, to: height * 0.52 },
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Ship engine particles - offset to engine location (ship is 80px tall, engine at ~y=76)
    // With scale 2, engine is 72px below center (36 * 2)
    const engineParticles = this.add.particles(0, 0, "flame", {
      color: [0xffffff, 0xaaddff, 0x33aaff, 0x0066ff, 0x003388],
      colorEase: "quad.out",
      speed: { min: 80, max: 140 },
      scale: { start: 1.2, end: 0, ease: "sine.out" },
      lifespan: 400,
      blendMode: "ADD",
      frequency: 12,
      quantity: 2,
      angle: { min: 82, max: 98 },
      follow: this.shipPreview,
      followOffset: { x: 0, y: 72 },
    });
    engineParticles.setDepth(8);

    const controlsY = height * 0.72;
    const controlsText = [
      "WASD - MOVE",
      "MOUSE - AIM",
      "CLICK - FIRE",
      "Q - SWITCH WEAPON",
    ];

    controlsText.forEach((text, i) => {
      const control = this.add.text(width / 2, controlsY + i * 26, text, {
        fontFamily: font,
        fontSize: "16px",
        color: "#666666",
      });
      control.setOrigin(0.5);
      control.setDepth(10);
    });

    this.startText = this.add.text(
      width / 2,
      height * 0.88,
      "[ CLICK ANYWHERE TO START ]",
      {
        fontFamily: font,
        fontSize: "22px",
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
      ease: "Sine.easeInOut",
    });

    // Version/credits
    const versionText = this.add.text(6, height - 12, "v1.0", {
      fontFamily: font,
      fontSize: "10px",
      color: "#333333",
    });
    versionText.setDepth(10);

    // Click to start
    this.input.once("pointerdown", () => {
      this.cameras.main.fade(500, 0, 0, 0);
      this.time.delayedCall(500, () => {
        this.scene.start("Game");
      });
    });

    // Fade in
    this.cameras.main.fadeIn(1000);

    // Emit event for React bridge
    EventBus.emit("current-scene-ready", this);
  }

  private createStarField(): void {
    const { width, height } = this.cameras.main;

    // Create multiple layers of stars with different speeds (all grayscale)
    const layers = [
      {
        count: 80,
        sizeMin: 0.5,
        sizeMax: 1,
        speedMin: 20,
        speedMax: 40,
        color: 0x444444,
      },
      {
        count: 50,
        sizeMin: 1,
        sizeMax: 2,
        speedMin: 40,
        speedMax: 80,
        color: 0x666666,
      },
      {
        count: 30,
        sizeMin: 1.5,
        sizeMax: 2.5,
        speedMin: 80,
        speedMax: 120,
        color: 0x888888,
      },
      {
        count: 15,
        sizeMin: 2,
        sizeMax: 3,
        speedMin: 120,
        speedMax: 180,
        color: 0xaaaaaa,
      },
    ];

    layers.forEach((layer) => {
      for (let i = 0; i < layer.count; i++) {
        const x = PhaserMath.Between(0, width);
        const y = PhaserMath.Between(0, height);
        const size = PhaserMath.FloatBetween(layer.sizeMin, layer.sizeMax);
        const speed = PhaserMath.Between(layer.speedMin, layer.speedMax);

        const star = this.add.circle(x, y, size, layer.color);
        star.setDepth(0);

        this.stars.push({ sprite: star, speed });
      }
    });
  }

  private createFloatingAsteroids(): void {
    const { width, height } = this.cameras.main;

    // Create several floating asteroids
    for (let i = 0; i < 8; i++) {
      const textureIndex = PhaserMath.Between(0, 4);
      const asteroid = this.add.image(
        PhaserMath.Between(0, width),
        PhaserMath.Between(0, height),
        `asteroid_${textureIndex}`,
      );

      const scale = PhaserMath.FloatBetween(0.3, 0.8);
      asteroid.setScale(scale);
      asteroid.setAlpha(0.4);
      asteroid.setDepth(1);

      // Store velocity data
      asteroid.setData("vx", PhaserMath.FloatBetween(-30, 30));
      asteroid.setData("vy", PhaserMath.FloatBetween(20, 60));
      asteroid.setData("rotation", PhaserMath.FloatBetween(-0.5, 0.5));

      this.floatingAsteroids.push(asteroid);
    }
  }

  private createAmbientParticles(): void {
    const { width } = this.cameras.main;

    // Subtle space dust
    this.particles = this.add.particles(width / 2, 0, "particle", {
      x: { min: -width / 2, max: width / 2 },
      y: 0,
      speedY: { min: 20, max: 50 },
      speedX: { min: -10, max: 10 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.3, end: 0 },
      lifespan: { min: 4000, max: 8000 },
      frequency: 200,
      blendMode: "ADD",
    });
    this.particles.setDepth(2);
  }

  update(_time: number, delta: number): void {
    const { width, height } = this.cameras.main;
    const dt = delta / 1000;

    // Scroll stars downward
    this.stars.forEach(({ sprite, speed }) => {
      sprite.y += speed * dt;

      // Wrap around
      if (sprite.y > height + 10) {
        sprite.y = -10;
        sprite.x = PhaserMath.Between(0, width);
      }
    });

    // Move floating asteroids
    this.floatingAsteroids.forEach((asteroid) => {
      const vx = asteroid.getData("vx") as number;
      const vy = asteroid.getData("vy") as number;
      const rot = asteroid.getData("rotation") as number;

      asteroid.x += vx * dt;
      asteroid.y += vy * dt;
      asteroid.rotation += rot * dt;

      // Wrap around
      if (asteroid.y > height + 40) {
        asteroid.y = -40;
        asteroid.x = PhaserMath.Between(0, width);
      }
      if (asteroid.x < -40) asteroid.x = width + 40;
      if (asteroid.x > width + 40) asteroid.x = -40;
    });
  }
}
