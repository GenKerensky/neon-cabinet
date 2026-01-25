import Phaser from "phaser";

/**
 * Gradient atmosphere background from space to horizon glow
 */
export class Atmosphere {
  private graphics!: Phaser.GameObjects.Graphics;

  create(scene: Phaser.Scene, horizonColor = 0x002200): void {
    const { width, height } = scene.cameras.main;

    if (this.graphics) {
      this.graphics.destroy();
    }

    this.graphics = scene.add.graphics();

    const baseR = (horizonColor >> 16) & 0xff;
    const baseG = (horizonColor >> 8) & 0xff;
    const baseB = horizonColor & 0xff;

    const steps = 30;
    for (let i = 0; i < steps; i++) {
      const y = (height / steps) * i;
      const h = height / steps + 1;

      const progress = i / steps;
      const intensity = Math.pow(progress, 3);

      const r = Math.floor(intensity * baseR);
      const g = Math.floor(intensity * baseG);
      const b = Math.floor(intensity * baseB);

      const color = Phaser.Display.Color.GetColor(r, g, b);
      this.graphics.fillStyle(color, 1);
      this.graphics.fillRect(0, y, width, h);
    }

    this.graphics.setDepth(-3);
  }

  destroy(): void {
    if (this.graphics) {
      this.graphics.destroy();
    }
  }
}
