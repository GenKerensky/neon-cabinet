import Phaser from "phaser";

interface TwinklingStar {
  x: number;
  y: number;
  baseAlpha: number;
  phase: number;
}

/**
 * Multi-layered starfield background with twinkling effect
 */
export class Starfield {
  private graphics!: Phaser.GameObjects.Graphics;
  private twinklingStars: TwinklingStar[] = [];

  create(scene: Phaser.Scene): void {
    if (this.graphics) {
      this.graphics.destroy();
    }

    const { width, height } = scene.cameras.main;
    this.graphics = scene.add.graphics();
    this.twinklingStars = [];

    // Layer 1: Distant dim stars
    for (let i = 0; i < 200; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height * 0.7);
      const brightness = Phaser.Math.Between(30, 70);
      const color = Phaser.Display.Color.GetColor(
        brightness,
        brightness,
        brightness,
      );
      this.graphics.fillStyle(color, 0.5);
      this.graphics.fillCircle(x, y, 0.5);
    }

    // Layer 2: Medium stars
    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height * 0.6);
      const brightness = Phaser.Math.Between(80, 140);
      const tint = Phaser.Math.Between(0, 2);
      const r = tint === 1 ? brightness + 20 : brightness;
      const g = brightness;
      const b = tint === 0 ? brightness + 30 : brightness;
      const color = Phaser.Display.Color.GetColor(
        Math.min(255, r),
        Math.min(255, g),
        Math.min(255, b),
      );
      this.graphics.fillStyle(color, 0.7);
      this.graphics.fillCircle(x, y, 1);
    }

    // Layer 3: Bright stars
    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height * 0.5);
      const brightness = Phaser.Math.Between(160, 230);
      const color = Phaser.Display.Color.GetColor(
        brightness,
        brightness,
        brightness + 25,
      );
      this.graphics.fillStyle(color, 1);
      this.graphics.fillCircle(x, y, Phaser.Math.FloatBetween(1, 2));

      if (Math.random() < 0.5) {
        this.twinklingStars.push({
          x,
          y,
          baseAlpha: 0.8 + Math.random() * 0.2,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    // Layer 4: Extra bright with glow
    for (let i = 0; i < 10; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height * 0.4);

      this.graphics.fillStyle(0xffffff, 0.05);
      this.graphics.fillCircle(x, y, 6);
      this.graphics.fillStyle(0xffffff, 0.1);
      this.graphics.fillCircle(x, y, 4);
      this.graphics.fillStyle(0xffffff, 0.3);
      this.graphics.fillCircle(x, y, 2);
      this.graphics.fillStyle(0xffffff, 1);
      this.graphics.fillCircle(x, y, 1);

      this.twinklingStars.push({
        x,
        y,
        baseAlpha: 1,
        phase: Math.random() * Math.PI * 2,
      });
    }

    this.graphics.setDepth(-2);
  }

  update(_time: number): void {
    // Twinkling handled by vector shader
  }

  destroy(): void {
    if (this.graphics) {
      this.graphics.destroy();
    }
  }
}
