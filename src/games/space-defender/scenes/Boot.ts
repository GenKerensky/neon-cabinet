import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { VectorMode } from "../utils/settings";

export class Boot extends Scene {
  constructor() {
    super("Boot");
  }

  preload(): void {
    const shipGraphics = this.make.graphics({ x: 0, y: 0 });
    shipGraphics.fillStyle(0x4a9eff); // Blue
    shipGraphics.lineStyle(1, 0x7bb3ff, 1); // Lighter blue
    shipGraphics.beginPath();
    shipGraphics.moveTo(15, 0);
    shipGraphics.lineTo(30, 30);
    shipGraphics.lineTo(15, 24);
    shipGraphics.lineTo(0, 30);
    shipGraphics.closePath();
    shipGraphics.fillPath();
    shipGraphics.strokePath();
    shipGraphics.generateTexture("ship", 30, 30);
    shipGraphics.destroy();

    // Create multiple asteroid variants with varied desaturated blue-green phosphor shades
    // Less saturated, closer to grayscale with subtle blue-green tint
    const asteroidColors = [
      0x7a7f82, // Dark desaturated blue-green
      0x858b8f, // Medium-dark desaturated blue-green
      0x90979c, // Medium desaturated blue-green
      0x9ba3a9, // Medium-light desaturated blue-green
      0xa6afb6, // Light desaturated blue-green
    ];
    for (let variant = 0; variant < 5; variant++) {
      const asteroidGraphics = this.make.graphics({ x: 0, y: 0 });
      asteroidGraphics.fillStyle(asteroidColors[variant]);
      asteroidGraphics.lineStyle(1, 0xffffff, 1);
      asteroidGraphics.beginPath();

      const points = Phaser.Math.Between(7, 12);
      const baseRadius = 27;
      const center = 30;

      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const r = baseRadius + Phaser.Math.Between(-12, 10);
        const px = center + Math.cos(angle) * r;
        const py = center + Math.sin(angle) * r;
        if (i === 0) {
          asteroidGraphics.moveTo(px, py);
        } else {
          asteroidGraphics.lineTo(px, py);
        }
      }

      asteroidGraphics.closePath();
      asteroidGraphics.fillPath();
      asteroidGraphics.strokePath();
      asteroidGraphics.generateTexture(`asteroid_${variant}`, 60, 60);
      asteroidGraphics.destroy();
    }

    const bulletGraphics = this.make.graphics({ x: 0, y: 0 });
    bulletGraphics.fillStyle(0xffd700); // Gold/yellow
    bulletGraphics.fillEllipse(1.5, 1.5, 1.5, 1.5);
    bulletGraphics.generateTexture("bullet", 6, 3);
    bulletGraphics.destroy();

    const trailGraphics = this.make.graphics({ x: 0, y: 0 });
    trailGraphics.fillStyle(0xffaa00); // Orange
    trailGraphics.fillEllipse(3, 1.5, 4, 1.5);
    trailGraphics.strokeEllipse(3, 1.5, 4, 1.5);
    trailGraphics.generateTexture("bullet_trail", 6, 3);
    trailGraphics.destroy();

    const particleGraphics = this.make.graphics({ x: 0, y: 0 });
    particleGraphics.fillStyle(0xffffff);
    particleGraphics.lineStyle(1, 0xeeeeee, 1);
    particleGraphics.fillCircle(2.5, 2.5, 2.5);
    particleGraphics.strokeCircle(2.5, 2.5, 2.5);
    particleGraphics.generateTexture("particle", 5, 5);
    particleGraphics.destroy();

    const flameGraphics = this.make.graphics({ x: 0, y: 0 });
    flameGraphics.fillStyle(0x0066ff); // Blue outer
    flameGraphics.fillEllipse(8, 3, 14, 4);
    flameGraphics.fillStyle(0x33aaff); // Bright blue
    flameGraphics.fillEllipse(5, 3, 8, 3);
    flameGraphics.fillStyle(0xaaddff); // Light blue
    flameGraphics.fillEllipse(3, 3, 4, 2);
    flameGraphics.fillStyle(0xffffff); // White hot core
    flameGraphics.fillEllipse(2, 3, 2, 1);
    flameGraphics.generateTexture("flame", 16, 6);
    flameGraphics.destroy();

    const blasterIcon = this.make.graphics({ x: 0, y: 0 });
    blasterIcon.fillStyle(0xffaa00); // Dark gold/yellow
    blasterIcon.fillEllipse(15, 7.5, 25, 10);
    blasterIcon.fillStyle(0xffcc00); // Medium gold/yellow
    blasterIcon.fillEllipse(15, 7.5, 20, 7.5);
    blasterIcon.fillStyle(0xffd700); // Bright gold/yellow
    blasterIcon.fillEllipse(15, 7.5, 10, 5);
    blasterIcon.lineStyle(1, 0xffd700, 1);
    blasterIcon.strokeEllipse(15, 7.5, 25, 10);
    blasterIcon.generateTexture("blaster_icon", 30, 15);
    blasterIcon.destroy();

    const laserIcon = this.make.graphics({ x: 0, y: 0 });
    laserIcon.fillStyle(0xff0000, 0.5); // Red outer
    laserIcon.fillRect(0, 5, 30, 5);
    laserIcon.fillStyle(0xff4444, 0.8); // Red
    laserIcon.fillRect(0, 5, 30, 2.5);
    laserIcon.fillStyle(0xff8888); // Light red
    laserIcon.fillRect(0, 7.5, 30, 2.5);
    laserIcon.fillStyle(0xffffff); // White core
    laserIcon.fillRect(0, 7.5, 30, 2.5);
    laserIcon.lineStyle(1, 0xff0000, 1); // Red
    laserIcon.strokeRect(0, 4, 30, 8);
    laserIcon.generateTexture("laser_icon", 30, 15);
    laserIcon.destroy();

    const rayGunIcon = this.make.graphics({ x: 0, y: 0 });
    rayGunIcon.fillStyle(0x00aa00, 0.5); // Green outer
    rayGunIcon.fillRect(0, 5, 30, 5);
    rayGunIcon.fillStyle(0x44ff44, 0.8); // Bright green
    rayGunIcon.fillRect(0, 5, 30, 2.5);
    rayGunIcon.fillStyle(0x88ff88); // Light green
    rayGunIcon.fillRect(0, 7.5, 30, 2.5);
    rayGunIcon.fillStyle(0xffffff); // White core
    rayGunIcon.fillRect(0, 7.5, 30, 2.5);
    rayGunIcon.lineStyle(1, 0x00ff00, 1); // Green
    rayGunIcon.strokeRect(0, 4, 30, 8);
    rayGunIcon.generateTexture("ray_gun_icon", 30, 15);
    rayGunIcon.destroy();

    const missileGraphics = this.make.graphics({ x: 0, y: 0 });
    missileGraphics.fillStyle(0xff4444); // Red body
    missileGraphics.fillRect(2.5, 5, 10, 7.5);
    missileGraphics.fillStyle(0xffaa00); // Orange tip
    missileGraphics.fillTriangle(12.5, 5, 12.5, 12.5, 17.5, 7.5);
    missileGraphics.fillStyle(0xcc0000); // Dark red fins
    missileGraphics.fillTriangle(2.5, 5, 2.5, 2.5, 5, 5);
    missileGraphics.fillTriangle(2.5, 12.5, 2.5, 15, 5, 12.5);
    missileGraphics.fillStyle(0xffffff); // White window
    missileGraphics.fillRect(0, 7.5, 2.5, 2.5);
    missileGraphics.lineStyle(1, 0xffaa00, 1); // Orange
    missileGraphics.strokeRect(2.5, 5, 10, 7.5);
    missileGraphics.beginPath();
    missileGraphics.moveTo(12.5, 5);
    missileGraphics.lineTo(12.5, 12.5);
    missileGraphics.lineTo(17.5, 7.5);
    missileGraphics.closePath();
    missileGraphics.strokePath();
    missileGraphics.beginPath();
    missileGraphics.moveTo(2.5, 5);
    missileGraphics.lineTo(2.5, 2.5);
    missileGraphics.lineTo(5, 5);
    missileGraphics.closePath();
    missileGraphics.strokePath();
    missileGraphics.beginPath();
    missileGraphics.moveTo(2.5, 12.5);
    missileGraphics.lineTo(2.5, 15);
    missileGraphics.lineTo(5, 12.5);
    missileGraphics.closePath();
    missileGraphics.strokePath();
    missileGraphics.generateTexture("missile", 20, 15);
    missileGraphics.destroy();

    const missileTrail = this.make.graphics({ x: 0, y: 0 });
    missileTrail.fillStyle(0xff6600); // Orange
    missileTrail.fillCircle(2.5, 2.5, 2.5);
    missileTrail.fillStyle(0xffff00); // Yellow
    missileTrail.fillCircle(2.5, 2.5, 2.5);
    missileTrail.lineStyle(1, 0xffaa00, 1); // Orange
    missileTrail.strokeCircle(2.5, 2.5, 2.5);
    missileTrail.generateTexture("missile_trail", 5, 5);
    missileTrail.destroy();

    const missileIcon = this.make.graphics({ x: 0, y: 0 });
    missileIcon.fillStyle(0xff4444); // Red body
    missileIcon.fillRect(5, 5, 15, 7.5);
    missileIcon.fillStyle(0xffaa00); // Orange tip
    missileIcon.fillTriangle(20, 5, 20, 12.5, 30, 7.5);
    missileIcon.fillStyle(0xcc0000); // Dark red fins
    missileIcon.fillTriangle(5, 5, 5, 0, 10, 5);
    missileIcon.fillTriangle(5, 12.5, 5, 15, 10, 12.5);
    missileIcon.fillStyle(0xffffff); // White window
    missileIcon.fillRect(0, 5, 5, 5);
    missileIcon.lineStyle(1, 0xffaa00, 1); // Orange
    missileIcon.strokeRect(5, 5, 15, 7.5);
    missileIcon.beginPath();
    missileIcon.moveTo(20, 5);
    missileIcon.lineTo(20, 12.5);
    missileIcon.lineTo(30, 7.5);
    missileIcon.closePath();
    missileIcon.strokePath();
    missileIcon.beginPath();
    missileIcon.moveTo(5, 5);
    missileIcon.lineTo(5, 0);
    missileIcon.lineTo(10, 5);
    missileIcon.closePath();
    missileIcon.strokePath();
    missileIcon.beginPath();
    missileIcon.moveTo(5, 12.5);
    missileIcon.lineTo(5, 15);
    missileIcon.lineTo(10, 12.5);
    missileIcon.closePath();
    missileIcon.strokePath();
    missileIcon.generateTexture("missile_icon", 30, 15);
    missileIcon.destroy();
  }

  create(): void {
    const fontFamily = (this.game.config as { customFontFamily?: string })
      .customFontFamily;
    if (fontFamily) this.registry.set("fontFamily", fontFamily);

    // Initialize vector mode to COLOR (default)
    if (this.registry.get("vectorMode") === undefined) {
      this.registry.set("vectorMode", VectorMode.COLOR);
    }

    EventBus.emit("current-scene-ready", this);
    this.scene.start("Title");
  }
}
