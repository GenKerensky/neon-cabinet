import Phaser from "phaser";
import { EventBus } from "../EventBus";
import { getFontFamily } from "../utils/font";

export class Title extends Phaser.Scene {
  constructor() {
    super("Title");
  }

  create(): void {
    const { width, height } = this.cameras.main;
    const font = getFontFamily(this);

    this.cameras.main.setPostPipeline("VectorShader");

    this.createAtmosphereBackground();
    this.createStarField();

    const titleText = this.add.text(width / 2, height * 0.2, "BATTLE TANKS", {
      fontFamily: font,
      fontSize: "72px",
      color: "#00ff00",
      stroke: "#003300",
      strokeThickness: 3,
    });
    titleText.setOrigin(0.5);
    titleText.setDepth(10);

    const titleGlow = this.add.text(width / 2, height * 0.2, "BATTLE TANKS", {
      fontFamily: font,
      fontSize: "72px",
      color: "#00ff00",
    });
    titleGlow.setOrigin(0.5);
    titleGlow.setAlpha(0.3);
    titleGlow.setDepth(9);

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

    this.add
      .text(width / 2, height * 0.3, "WIREFRAME COMBAT", {
        fontFamily: font,
        fontSize: "24px",
        color: "#00aa00",
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.drawTankPreview(width / 2, height * 0.55);

    const startText = this.add.text(
      width / 2,
      height * 0.8,
      "PRESS SPACE TO START",
      {
        fontFamily: font,
        fontSize: "24px",
        color: "#ffffff",
      },
    );
    startText.setOrigin(0.5);
    startText.setDepth(10);

    this.tweens.add({
      targets: startText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    this.add
      .text(
        width / 2,
        height * 0.88,
        "W/↑ - FORWARD  |  S/↓ - REVERSE  |  A/D or ←/→ - TURN",
        {
          fontFamily: font,
          fontSize: "18px",
          color: "#888888",
        },
      )
      .setOrigin(0.5)
      .setDepth(10);

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

    const steps = 20;
    for (let i = 0; i < steps; i++) {
      const y = (height / steps) * i;
      const h = height / steps + 1;

      const progress = i / steps;
      const r = Math.floor(progress * progress * 0);
      const g = Math.floor(progress * progress * 30);
      const b = Math.floor(progress * progress * 10);

      const color = Phaser.Display.Color.GetColor(r, g, b);
      graphics.fillStyle(color, 1);
      graphics.fillRect(0, y, width, h);
    }

    graphics.setDepth(-2);
  }

  private createStarField(): void {
    const { width, height } = this.cameras.main;
    const stars = this.add.graphics();

    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height * 0.7);
      const brightness = Phaser.Math.Between(40, 80);
      const color = Phaser.Display.Color.GetColor(
        brightness,
        brightness,
        brightness,
      );
      stars.fillStyle(color, 0.6);
      stars.fillCircle(x, y, 0.5);
    }

    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height * 0.6);
      const brightness = Phaser.Math.Between(100, 160);
      const color = Phaser.Display.Color.GetColor(
        brightness,
        brightness,
        brightness,
      );
      stars.fillStyle(color, 0.8);
      stars.fillCircle(x, y, 1);
    }

    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height * 0.5);
      const brightness = Phaser.Math.Between(180, 255);
      const color = Phaser.Display.Color.GetColor(
        brightness,
        brightness,
        brightness + 20,
      );
      stars.fillStyle(color, 1);
      stars.fillCircle(x, y, Phaser.Math.FloatBetween(1, 1.5));
    }

    stars.setDepth(-1);
  }

  private drawTankPreview(cx: number, cy: number): void {
    const g = this.add.graphics();
    g.setDepth(5);

    const scale = 2;
    const color = 0x00ff00;

    g.lineStyle(2, color, 1);
    g.strokeRect(cx - 30 * scale, cy - 20 * scale, 60 * scale, 40 * scale);
    g.strokeRect(cx - 15 * scale, cy - 12 * scale, 30 * scale, 24 * scale);

    g.lineStyle(3, color, 1);
    g.beginPath();
    g.moveTo(cx, cy - 5 * scale);
    g.lineTo(cx, cy - 40 * scale);
    g.strokePath();

    g.lineStyle(2, color, 0.7);
    g.strokeRect(cx - 35 * scale, cy - 18 * scale, 8 * scale, 36 * scale);
    g.strokeRect(cx + 27 * scale, cy - 18 * scale, 8 * scale, 36 * scale);

    g.lineStyle(1, color, 0.5);
    for (let i = -15; i <= 15; i += 6) {
      g.beginPath();
      g.moveTo(cx - 35 * scale, cy + i * scale);
      g.lineTo(cx - 27 * scale, cy + i * scale);
      g.strokePath();
      g.beginPath();
      g.moveTo(cx + 27 * scale, cy + i * scale);
      g.lineTo(cx + 35 * scale, cy + i * scale);
      g.strokePath();
    }

    this.tweens.add({
      targets: g,
      y: 15,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }
}
