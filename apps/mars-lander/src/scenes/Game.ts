import Phaser, { Scene } from "phaser";
import { Lander } from "../objects/Lander";
import { Terrain } from "../objects/Terrain";
import { EventBus } from "../EventBus";
import { getFontFamily } from "../utils/font";

export class Game extends Scene {
  private lander!: Lander;
  private terrain!: Terrain;
  private particles!: Phaser.GameObjects.Particles.ParticleEmitter;

  private score: number = 0;
  private level: number = 1;
  private gravity: number = 80; // Mars gravity (about 38% of Earth)

  // HUD elements
  private altitudeText!: Phaser.GameObjects.Text;
  private hSpeedText!: Phaser.GameObjects.Text;
  private vSpeedText!: Phaser.GameObjects.Text;
  private fuelBar!: Phaser.GameObjects.Graphics;
  private fuelText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;

  // Background elements
  private stars!: Phaser.GameObjects.Graphics;
  private twinklingStars: { x: number; y: number; baseAlpha: number }[] = [];

  constructor() {
    super("Game");
  }

  create(): void {
    // Reset state
    this.score = 0;
    this.level = 1;

    // Set background
    this.cameras.main.setBackgroundColor(0x000000);

    // Apply vector shader
    this.cameras.main.setPostPipeline("VectorShader");

    // Create atmosphere gradient background
    this.createAtmosphereBackground();

    // Create starry background
    this.createStarField();

    // Create terrain
    this.terrain = new Terrain(this);
    this.terrain.generate(this.level, this.level > 1);

    // Create lander at top center
    this.lander = new Lander(this, this.cameras.main.width / 2, 100);

    // Apply gravity
    this.physics.world.gravity.y = this.gravity;

    // Create explosion particles
    this.particles = this.add.particles(0, 0, "particle", {
      speed: { min: 50, max: 200 },
      lifespan: 800,
      scale: { start: 1.5, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [0xff6600, 0xff3300, 0xffaa00, 0xffff00],
      blendMode: "ADD",
      emitting: false,
    });

    // Create HUD
    this.createHUD();

    // Input for pause
    this.input.keyboard
      ?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
      .on("down", () => {
        if (!this.scene.isPaused("Game")) {
          this.scene.pause("Game");
          this.scene.launch("Pause");
        }
      });

    EventBus.emit("current-scene-ready", this);
  }

  private createAtmosphereBackground(): void {
    const { width, height } = this.cameras.main;
    const graphics = this.add.graphics();

    // Create gradient from dark space to Mars atmosphere at bottom
    const steps = 30;
    for (let i = 0; i < steps; i++) {
      const y = (height / steps) * i;
      const h = height / steps + 1;

      // Interpolate from black to reddish-orange at bottom
      const progress = i / steps;
      // Use exponential for more dramatic atmosphere effect near ground
      const atmosphereIntensity = Math.pow(progress, 3);

      const r = Math.floor(atmosphereIntensity * 80);
      const g = Math.floor(atmosphereIntensity * 25);
      const b = Math.floor(atmosphereIntensity * 15);

      const color = Phaser.Display.Color.GetColor(r, g, b);
      graphics.fillStyle(color, 1);
      graphics.fillRect(0, y, width, h);
    }

    graphics.setDepth(-3);
  }

  private createStarField(): void {
    // Destroy existing starfield if present
    if (this.stars) {
      this.stars.destroy();
    }

    const { width, height } = this.cameras.main;
    this.stars = this.add.graphics();
    this.twinklingStars = [];

    // Layer 1: Distant dim stars (many, small)
    for (let i = 0; i < 200; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height * 0.7); // More at top
      const brightness = Phaser.Math.Between(30, 70);
      const color = Phaser.Display.Color.GetColor(
        brightness,
        brightness,
        brightness,
      );
      this.stars.fillStyle(color, 0.5);
      this.stars.fillCircle(x, y, 0.5);
    }

    // Layer 2: Medium stars
    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height * 0.6);
      const brightness = Phaser.Math.Between(80, 140);
      // Slight color variation
      const tint = Phaser.Math.Between(0, 2);
      const r = tint === 1 ? brightness + 20 : brightness;
      const g = brightness;
      const b = tint === 0 ? brightness + 30 : brightness;
      const color = Phaser.Display.Color.GetColor(
        Math.min(255, r),
        Math.min(255, g),
        Math.min(255, b),
      );
      this.stars.fillStyle(color, 0.7);
      this.stars.fillCircle(x, y, 1);
    }

    // Layer 3: Bright stars (larger, fewer)
    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height * 0.5);
      const brightness = Phaser.Math.Between(160, 230);
      const color = Phaser.Display.Color.GetColor(
        brightness,
        brightness,
        brightness + 25,
      );
      this.stars.fillStyle(color, 1);
      this.stars.fillCircle(x, y, Phaser.Math.FloatBetween(1, 2));

      // Store some for twinkling
      if (Math.random() < 0.5) {
        this.twinklingStars.push({
          x,
          y,
          baseAlpha: 0.8 + Math.random() * 0.2,
        });
      }
    }

    // Layer 4: Extra bright stars with glow
    for (let i = 0; i < 10; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height * 0.4);

      // Glow layers
      this.stars.fillStyle(0xffffff, 0.05);
      this.stars.fillCircle(x, y, 6);
      this.stars.fillStyle(0xffffff, 0.1);
      this.stars.fillCircle(x, y, 4);
      this.stars.fillStyle(0xffffff, 0.3);
      this.stars.fillCircle(x, y, 2);
      // Core
      this.stars.fillStyle(0xffffff, 1);
      this.stars.fillCircle(x, y, 1);

      this.twinklingStars.push({ x, y, baseAlpha: 1 });
    }

    this.stars.setDepth(-2);
  }

  private createHUD(): void {
    const font = getFontFamily(this);
    const margin = 30;
    const { width } = this.cameras.main;

    // Left side - Flight data
    const dataStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: font,
      fontSize: "18px",
      fontStyle: "bold",
      color: "#00ddff",
    };

    const labelStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: font,
      fontSize: "12px",
      fontStyle: "bold",
      color: "#888888",
    };

    // Altitude
    this.add.text(margin, margin, "ALTITUDE", labelStyle).setScrollFactor(0);
    this.altitudeText = this.add.text(margin, margin + 15, "0", dataStyle);
    this.altitudeText.setScrollFactor(0);

    // Horizontal speed
    this.add
      .text(margin, margin + 50, "H-SPEED", labelStyle)
      .setScrollFactor(0);
    this.hSpeedText = this.add.text(margin, margin + 65, "0", dataStyle);
    this.hSpeedText.setScrollFactor(0);

    // Vertical speed
    this.add
      .text(margin, margin + 100, "V-SPEED", labelStyle)
      .setScrollFactor(0);
    this.vSpeedText = this.add.text(margin, margin + 115, "0", dataStyle);
    this.vSpeedText.setScrollFactor(0);

    // Right side - Score and level
    this.scoreText = this.add.text(
      width - margin,
      margin,
      `SCORE: ${this.score}`,
      {
        fontFamily: font,
        fontSize: "20px",
        fontStyle: "bold",
        color: "#ffffff",
      },
    );
    this.scoreText.setOrigin(1, 0);
    this.scoreText.setScrollFactor(0);

    this.levelText = this.add.text(
      width - margin,
      margin + 30,
      `LEVEL: ${this.level}`,
      {
        fontFamily: font,
        fontSize: "16px",
        fontStyle: "bold",
        color: "#ff6600",
      },
    );
    this.levelText.setOrigin(1, 0);
    this.levelText.setScrollFactor(0);

    // Top center - Fuel gauge
    this.add
      .text(width / 2, margin - 10, "FUEL", {
        fontFamily: font,
        fontSize: "14px",
        fontStyle: "bold",
        color: "#888888",
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    this.fuelBar = this.add.graphics();
    this.fuelBar.setScrollFactor(0);
    this.fuelBar.setDepth(100);

    this.fuelText = this.add.text(width / 2, margin + 30, "100%", {
      fontFamily: font,
      fontSize: "14px",
      fontStyle: "bold",
      color: "#00ff00",
    });
    this.fuelText.setOrigin(0.5);
    this.fuelText.setScrollFactor(0);

    // Status text (center)
    this.statusText = this.add.text(
      width / 2,
      this.cameras.main.height / 2,
      "",
      {
        fontFamily: font,
        fontSize: "32px",
        fontStyle: "bold",
        color: "#ffffff",
        align: "center",
      },
    );
    this.statusText.setOrigin(0.5);
    this.statusText.setScrollFactor(0);
    this.statusText.setDepth(200);
    this.statusText.setVisible(false);

    // Controls hint
    this.add
      .text(
        width / 2,
        this.cameras.main.height - margin,
        "W/↑ - THRUST  |  A/D ←/→ - ROTATE  |  ESC - PAUSE",
        {
          fontFamily: font,
          fontSize: "18px",
          fontStyle: "bold",
          color: "#ffffff",
        },
      )
      .setOrigin(0.5, 1)
      .setScrollFactor(0)
      .setDepth(300);
  }

  private updateHUD(): void {
    const { width } = this.cameras.main;
    const margin = 30;

    // Calculate altitude (distance from terrain)
    const terrainHeight = this.terrain.getTerrainHeightAt(this.lander.x);
    const altitude = Math.max(
      0,
      Math.floor(terrainHeight - (this.lander.y + 60)),
    );

    // Update text
    this.altitudeText.setText(`${altitude}m`);

    const hSpeed = Math.floor(this.lander.getHorizontalSpeed());
    const vSpeed = Math.floor(this.lander.getVerticalSpeed());

    this.hSpeedText.setText(`${hSpeed} m/s`);
    this.hSpeedText.setColor(hSpeed > 30 ? "#ff6600" : "#00ddff");

    this.vSpeedText.setText(`${vSpeed} m/s`);
    this.vSpeedText.setColor(
      vSpeed > 200 ? "#ff0000" : vSpeed > 150 ? "#ff6600" : "#00ddff",
    );

    // Update fuel bar (top center)
    const fuelPercent = this.lander.getFuelPercent();
    const barWidth = 200;
    const barHeight = 12;
    const barX = width / 2 - barWidth / 2;
    const barY = margin + 5;

    this.fuelBar.clear();

    // Background
    this.fuelBar.fillStyle(0x333333, 0.8);
    this.fuelBar.fillRect(barX, barY, barWidth, barHeight);

    // Fuel level
    const fuelColor =
      fuelPercent > 50 ? 0x00ff00 : fuelPercent > 25 ? 0xffaa00 : 0xff0000;
    this.fuelBar.fillStyle(fuelColor, 1);
    this.fuelBar.fillRect(
      barX,
      barY,
      barWidth * (fuelPercent / 100),
      barHeight,
    );

    // Border
    this.fuelBar.lineStyle(2, 0x888888, 1);
    this.fuelBar.strokeRect(barX, barY, barWidth, barHeight);

    this.fuelText.setText(`${Math.floor(fuelPercent)}%`);
    this.fuelText.setColor(
      fuelPercent > 50 ? "#00ff00" : fuelPercent > 25 ? "#ffaa00" : "#ff0000",
    );

    this.scoreText.setText(`SCORE: ${this.score}`);
    this.levelText.setText(`LEVEL: ${this.level}`);
  }

  private checkLanding(): void {
    // Check collision with terrain
    const result = this.terrain.checkCollision(
      this.lander.x,
      this.lander.y,
      40,
      120,
    );

    if (result.collision) {
      // Capture speed and angle BEFORE stopping physics
      const vSpeed = this.lander.getVerticalSpeed();
      const hSpeed = this.lander.getHorizontalSpeed();
      const angle = Math.abs(this.lander.getRotationAngle());

      // Immediately deactivate lander to prevent multiple collision detections
      this.lander.setActive(false);
      this.lander.stopThrust();
      const body = this.lander.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(0, 0);
      body.setAcceleration(0, 0);
      body.setAllowGravity(false); // Stop gravity from affecting the landed lander
      body.stop(); // Fully stop the physics body

      if (result.onLandingPad) {
        // Check crash conditions on landing pad
        if (vSpeed > 200) {
          this.handleCrash("SPEED TOO HIGH");
        } else if (angle > 15) {
          this.handleCrash("INCORRECT LANDING ANGLE");
        } else if (vSpeed <= 200 && hSpeed <= 30) {
          // Successful landing!
          this.handleSuccessfulLanding(result.multiplier);
        } else {
          // Speed in 100-200 range or horizontal too high
          this.handleCrash("SPEED TOO HIGH");
        }
      } else {
        // Crash on terrain (not on landing pad)
        this.handleCrash("TERRAIN COLLISION");
      }
    }
  }

  private handleSuccessfulLanding(multiplier: number): void {
    const baseScore = 100;
    const fuelBonus = Math.floor(this.lander.getFuelPercent());
    const landingScore = (baseScore + fuelBonus) * multiplier;

    this.score += landingScore;

    this.statusText.setText(
      `PERFECT LANDING!\n+${landingScore} POINTS\n(x${multiplier} MULTIPLIER)`,
    );
    this.statusText.setColor("#00ff00");
    this.statusText.setVisible(true);

    // Proceed to next level after delay
    this.time.delayedCall(2500, () => {
      this.nextLevel();
    });
  }

  private handleCrash(reason: string): void {
    // Explosion effect
    this.particles.explode(40, this.lander.x, this.lander.y);

    // Hide lander
    this.lander.setVisible(false);
    this.lander.setActive(false);

    this.statusText.setText(`CRASH!\n${reason}`);
    this.statusText.setColor("#ff0000");
    this.statusText.setVisible(true);

    // Save high score
    const highScore = localStorage.getItem("marsLanderHighScore");
    if (!highScore || this.score > parseInt(highScore)) {
      localStorage.setItem("marsLanderHighScore", this.score.toString());
    }

    // Go to game over
    this.time.delayedCall(2000, () => {
      this.scene.start("GameOver", {
        score: this.score,
        level: this.level,
        crashReason: reason,
      });
    });
  }

  private nextLevel(): void {
    this.level++;
    this.statusText.setVisible(false);

    // Disable lander during transition
    this.lander.setActive(false);
    this.lander.setVisible(false);

    // Fade out
    this.cameras.main.fadeOut(500, 0, 0, 0);

    this.cameras.main.once("camerafadeoutcomplete", () => {
      // Regenerate starfield and terrain while screen is black
      this.createStarField();
      this.terrain.destroy();
      this.terrain = new Terrain(this);
      this.terrain.generate(this.level, true); // Avoid center landing zone after level 1

      // Reset lander position, physics, and fuel
      this.lander.setPosition(this.cameras.main.width / 2, 100);
      const body = this.lander.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(0, 0);
      body.setAllowGravity(true); // Re-enable gravity for next level
      this.lander.setAngle(0);
      this.lander.setAngularVelocity(0);
      this.lander.resetFuel(); // Refill fuel for next level
      this.lander.setActive(true);
      this.lander.setVisible(true);

      // Fade back in
      this.cameras.main.fadeIn(500, 0, 0, 0);

      // Show level announcement after fade in
      this.cameras.main.once("camerafadeincomplete", () => {
        const font = getFontFamily(this);
        const levelAnnounce = this.add.text(
          this.cameras.main.width / 2,
          this.cameras.main.height / 3,
          `LEVEL ${this.level}`,
          {
            fontFamily: font,
            fontSize: "48px",
            color: "#ff6600",
          },
        );
        levelAnnounce.setOrigin(0.5);
        levelAnnounce.setDepth(200);

        this.tweens.add({
          targets: levelAnnounce,
          alpha: 0,
          y: levelAnnounce.y - 50,
          duration: 2000,
          onComplete: () => levelAnnounce.destroy(),
        });
      });
    });
  }

  update(_time: number, delta: number): void {
    if (this.lander.active) {
      this.lander.update(delta);
      this.checkLanding();
    }

    this.updateHUD();
  }
}
