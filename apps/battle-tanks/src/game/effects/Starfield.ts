import { Display, Math as PhaserMath } from "phaser";
import type { GameObjects, Scene } from "phaser";

interface Star {
  x: number;
  y: number;
  size: number;
  color: number;
  alpha: number;
  hasGlow: boolean;
  parallax: number; // 0-1, lower = further away, moves slower
}

/**
 * Panoramic starfield with parallax depth effect
 */
export class Starfield {
  private graphics!: GameObjects.Graphics;
  private stars: Star[] = [];
  private screenWidth = 0;
  private panoramaWidth = 0;

  create(scene: Scene): void {
    const { width, height } = scene.cameras.main;
    this.screenWidth = width;
    this.panoramaWidth = width * 3; // Full 360 coverage

    this.graphics = scene.add.graphics();
    this.graphics.setDepth(-2);

    const horizonY = height / 2;

    // Generate stars across the panorama with parallax depths
    // Layer 1: Distant dim stars - slowest parallax
    for (let i = 0; i < 400; i++) {
      this.stars.push({
        x: Math.random() * this.panoramaWidth,
        y: Math.random() * horizonY * 0.95,
        size: 0.5,
        color: Display.Color.GetColor(
          PhaserMath.Between(30, 70),
          PhaserMath.Between(30, 70),
          PhaserMath.Between(30, 70),
        ),
        alpha: 0.5,
        hasGlow: false,
        parallax: 0.85 + Math.random() * 0.03, // Subtle - distant
      });
    }

    // Layer 2: Medium stars - medium parallax
    for (let i = 0; i < 200; i++) {
      const brightness = PhaserMath.Between(80, 140);
      const tint = PhaserMath.Between(0, 2);
      const r = tint === 1 ? brightness + 20 : brightness;
      const g = brightness;
      const b = tint === 0 ? brightness + 30 : brightness;
      this.stars.push({
        x: Math.random() * this.panoramaWidth,
        y: Math.random() * horizonY * 0.85,
        size: 1,
        color: Display.Color.GetColor(
          Math.min(255, r),
          Math.min(255, g),
          Math.min(255, b),
        ),
        alpha: 0.7,
        hasGlow: false,
        parallax: 0.9 + Math.random() * 0.03,
      });
    }

    // Layer 3: Bright stars - faster parallax
    for (let i = 0; i < 80; i++) {
      const brightness = PhaserMath.Between(160, 230);
      this.stars.push({
        x: Math.random() * this.panoramaWidth,
        y: Math.random() * horizonY * 0.7,
        size: PhaserMath.FloatBetween(1, 2),
        color: Display.Color.GetColor(brightness, brightness, brightness + 25),
        alpha: 1,
        hasGlow: false,
        parallax: 0.95 + Math.random() * 0.03,
      });
    }

    // Layer 4: Extra bright with glow - fastest parallax
    for (let i = 0; i < 20; i++) {
      this.stars.push({
        x: Math.random() * this.panoramaWidth,
        y: Math.random() * horizonY * 0.5,
        size: 1,
        color: 0xffffff,
        alpha: 1,
        hasGlow: true,
        parallax: 1.0,
      });
    }

    // Sort by parallax so distant stars draw first (behind closer ones)
    this.stars.sort((a, b) => a.parallax - b.parallax);
  }

  /**
   * Update starfield based on player rotation with parallax
   */
  update(rotation: number): void {
    if (!this.graphics) return;

    this.graphics.clear();

    // Base offset from rotation
    const baseOffset = (rotation / (Math.PI * 2)) * this.panoramaWidth;

    for (const star of this.stars) {
      // Apply parallax - multiply offset by star's parallax factor
      const offset = baseOffset * star.parallax;

      // Calculate wrapped x position
      let screenX = star.x - offset;

      // Wrap around
      while (screenX < 0) screenX += this.panoramaWidth;
      while (screenX >= this.panoramaWidth) screenX -= this.panoramaWidth;

      // Only draw if visible on screen
      if (screenX > this.screenWidth) continue;

      if (star.hasGlow) {
        this.graphics.fillStyle(0xffffff, 0.05);
        this.graphics.fillCircle(screenX, star.y, 6);
        this.graphics.fillStyle(0xffffff, 0.1);
        this.graphics.fillCircle(screenX, star.y, 4);
        this.graphics.fillStyle(0xffffff, 0.3);
        this.graphics.fillCircle(screenX, star.y, 2);
      }

      this.graphics.fillStyle(star.color, star.alpha);
      this.graphics.fillCircle(screenX, star.y, star.size);
    }
  }

  destroy(): void {
    if (this.graphics) {
      this.graphics.destroy();
    }
  }
}
