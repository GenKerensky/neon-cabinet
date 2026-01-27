import { Display } from "phaser";
import type { GameObjects, Scene } from "phaser";

/**
 * Gradient atmosphere background with horizon glow effect
 * Similar to Mars Lander but with green-tinted Battlezone aesthetic
 * Glow extends from horizon (middle) up to 1/4 from top
 */
export class Atmosphere {
  private graphics!: GameObjects.Graphics;
  private horizonGlow!: GameObjects.Graphics;

  create(scene: Scene, horizonColor = 0x003300): void {
    const { width, height } = scene.cameras.main;

    if (this.graphics) {
      this.graphics.destroy();
    }
    if (this.horizonGlow) {
      this.horizonGlow.destroy();
    }

    this.graphics = scene.add.graphics();
    this.horizonGlow = scene.add.graphics();

    const baseR = (horizonColor >> 16) & 0xff;
    const baseG = (horizonColor >> 8) & 0xff;
    const baseB = horizonColor & 0xff;

    const horizonY = height / 2;

    // Sky gradient (top half only - from top to horizon)
    const skySteps = 30;
    for (let i = 0; i < skySteps; i++) {
      const y = (horizonY / skySteps) * i;
      const h = horizonY / skySteps + 1;

      const progress = i / skySteps;
      // Exponential curve - more color near horizon
      const intensity = Math.pow(progress, 2.5);

      const r = Math.floor(intensity * baseR * 0.5);
      const g = Math.floor(intensity * baseG * 0.5);
      const b = Math.floor(intensity * baseB * 0.5);

      const color = Display.Color.GetColor(r, g, b);
      this.graphics.fillStyle(color, 1);
      this.graphics.fillRect(0, y, width, h);
    }

    // Ground (bottom half - solid dark color)
    this.graphics.fillStyle(0x000000, 1);
    this.graphics.fillRect(0, horizonY, width, horizonY);

    this.graphics.setDepth(-3);

    // Horizon glow - extends from horizon UP to halfway to top (height/4)
    const glowHeight = horizonY / 2; // From horizon to 1/4 from top

    // Glow color - darker green for contrast with crosshair
    const glowColor = 0x000d00;

    // Draw continuous gradient strips from horizon upward
    const glowSteps = 60;
    for (let i = 0; i < glowSteps; i++) {
      const glowProgress = i / glowSteps;
      // Fade out as we go up
      const alpha = 0.12 * Math.pow(1 - glowProgress, 1.5);

      const y = horizonY - glowProgress * glowHeight;
      const stripHeight = glowHeight / glowSteps + 1; // +1 to ensure overlap

      this.horizonGlow.fillStyle(glowColor, alpha);
      this.horizonGlow.fillRect(0, y - stripHeight, width, stripHeight);
    }

    // Subtle horizon line
    this.horizonGlow.lineStyle(2, 0x001100, 0.2);
    this.horizonGlow.beginPath();
    this.horizonGlow.moveTo(0, horizonY);
    this.horizonGlow.lineTo(width, horizonY);
    this.horizonGlow.strokePath();

    this.horizonGlow.setDepth(-1); // In front of starfield but behind mountains
  }

  destroy(): void {
    if (this.graphics) {
      this.graphics.destroy();
    }
    if (this.horizonGlow) {
      this.horizonGlow.destroy();
    }
  }
}
