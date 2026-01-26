import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { VectorMode } from "@neon-cabinet/games-shared";

export class Boot extends Scene {
  constructor() {
    super("Boot");
  }

  preload(): void {
    // Razorback-style racing yacht - WIREFRAME vector drawing
    // Sleek triangular hull, pointed nose, large engine bell
    // Ship oriented pointing UP (nose at top)
    const g = this.make.graphics({ x: 0, y: 0 });
    const w = 50;
    const h = 80;
    const cx = w / 2; // Center X = 25

    // Colors
    const hullColor = 0xffffff; // White hull lines
    const hullDim = 0xaaaaaa; // Dimmer structural lines
    const cyanAccent = 0x00ffff; // Cyan accents
    const cyanBright = 0x66ffff; // Bright cyan

    // ===== MAIN HULL FILL (black so stars don't show through) =====
    g.fillStyle(0x000000, 1);
    g.beginPath();
    // Nose (top point)
    g.moveTo(cx, 2);
    // Right side - sleek angled hull
    g.lineTo(cx + 4, 12);
    g.lineTo(cx + 8, 28);
    g.lineTo(cx + 12, 45);
    // Right side flare near engine
    g.lineTo(cx + 16, 55);
    g.lineTo(cx + 18, 62);
    // Right landing strut attachment
    g.lineTo(cx + 14, 65);
    // Engine bay right edge
    g.lineTo(cx + 10, 68);
    // Engine bell bottom right
    g.lineTo(cx + 8, 75);
    // Engine nozzle
    g.lineTo(cx + 6, 78);
    g.lineTo(cx - 6, 78);
    g.lineTo(cx - 8, 75);
    // Engine bay left edge
    g.lineTo(cx - 10, 68);
    // Left landing strut attachment
    g.lineTo(cx - 14, 65);
    // Left side flare near engine
    g.lineTo(cx - 18, 62);
    g.lineTo(cx - 16, 55);
    // Left side - sleek angled hull
    g.lineTo(cx - 12, 45);
    g.lineTo(cx - 8, 28);
    g.lineTo(cx - 4, 12);
    g.closePath();
    g.fillPath();

    // ===== MAIN HULL OUTLINE =====
    // Sleek triangular shape with pointed nose
    g.lineStyle(2, hullColor, 1);
    g.beginPath();
    // Nose (top point)
    g.moveTo(cx, 2);
    // Right side - sleek angled hull
    g.lineTo(cx + 4, 12);
    g.lineTo(cx + 8, 28);
    g.lineTo(cx + 12, 45);
    // Right side flare near engine
    g.lineTo(cx + 16, 55);
    g.lineTo(cx + 18, 62);
    // Right landing strut attachment
    g.lineTo(cx + 14, 65);
    // Engine bay right edge
    g.lineTo(cx + 10, 68);
    // Engine bell bottom right
    g.lineTo(cx + 8, 75);
    // Engine nozzle
    g.lineTo(cx + 6, 78);
    g.lineTo(cx - 6, 78);
    g.lineTo(cx - 8, 75);
    // Engine bay left edge
    g.lineTo(cx - 10, 68);
    // Left landing strut attachment
    g.lineTo(cx - 14, 65);
    // Left side flare near engine
    g.lineTo(cx - 18, 62);
    g.lineTo(cx - 16, 55);
    // Left side - sleek angled hull
    g.lineTo(cx - 12, 45);
    g.lineTo(cx - 8, 28);
    g.lineTo(cx - 4, 12);
    g.closePath();
    g.strokePath();

    // ===== COCKPIT / NOSE SECTION =====
    g.lineStyle(1, hullDim, 0.9);
    // Cockpit window outline
    g.beginPath();
    g.moveTo(cx - 2, 8);
    g.lineTo(cx + 2, 8);
    g.lineTo(cx + 3, 16);
    g.lineTo(cx - 3, 16);
    g.closePath();
    g.strokePath();

    // ===== HULL PANEL LINES =====
    g.lineStyle(1, hullDim, 0.7);
    // Vertical center seam
    g.lineBetween(cx, 18, cx, 45);
    // Horizontal panel lines
    g.lineBetween(cx - 6, 25, cx + 6, 25);
    g.lineBetween(cx - 9, 38, cx + 9, 38);
    g.lineBetween(cx - 11, 50, cx + 11, 50);

    // Side panel details
    g.lineBetween(cx + 5, 20, cx + 10, 42);
    g.lineBetween(cx - 5, 20, cx - 10, 42);

    // ===== ENGINE BAY / INTERNAL STRUCTURE =====
    g.lineStyle(1, hullDim, 0.8);
    // Engine bay frame
    g.beginPath();
    g.moveTo(cx - 6, 52);
    g.lineTo(cx + 6, 52);
    g.lineTo(cx + 8, 68);
    g.lineTo(cx - 8, 68);
    g.closePath();
    g.strokePath();

    // Internal pipes/machinery (like the Razorback's exposed internals)
    g.lineStyle(1, hullDim, 0.6);
    // Vertical pipes
    g.lineBetween(cx - 3, 54, cx - 3, 66);
    g.lineBetween(cx + 3, 54, cx + 3, 66);
    g.lineBetween(cx, 56, cx, 68);
    // Horizontal connectors
    g.lineBetween(cx - 4, 58, cx + 4, 58);
    g.lineBetween(cx - 5, 64, cx + 5, 64);

    // ===== LANDING STRUTS =====
    g.lineStyle(2, hullDim, 1);
    // Left strut
    g.lineBetween(cx - 14, 65, cx - 20, 76);
    // Right strut
    g.lineBetween(cx + 14, 65, cx + 20, 76);
    // Foot pads
    g.lineStyle(1, hullDim, 1);
    g.strokeCircle(cx - 20, 76, 2);
    g.strokeCircle(cx + 20, 76, 2);

    // ===== CYAN ACCENT LINES =====
    // Racing stripes along hull edges
    g.lineStyle(2, cyanAccent, 1);
    // Left stripe
    g.lineBetween(cx - 5, 10, cx - 14, 52);
    // Right stripe
    g.lineBetween(cx + 5, 10, cx + 14, 52);

    // Nose accent
    g.lineStyle(1, cyanBright, 1);
    g.lineBetween(cx - 1, 4, cx + 1, 4);

    // Cockpit glow
    g.fillStyle(cyanBright, 1);
    g.fillRect(cx - 1, 10, 2, 4);

    // Engine glow
    g.lineStyle(1, cyanAccent, 1);
    g.beginPath();
    g.arc(cx, 76, 5, 0, Math.PI, false);
    g.strokePath();

    // Engine exhaust (small filled area)
    g.fillStyle(cyanBright, 1);
    g.fillRect(cx - 4, 76, 8, 2);

    // Landing strut lights
    g.fillStyle(cyanAccent, 1);
    g.fillCircle(cx - 20, 76, 1);
    g.fillCircle(cx + 20, 76, 1);

    g.generateTexture("ship", w, h);
    g.destroy();

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

    // Autocannon round - thin tracer-like projectile
    const bulletGraphics = this.make.graphics({ x: 0, y: 0 });
    bulletGraphics.lineStyle(1, 0xffd700, 1); // Gold/yellow outline
    bulletGraphics.fillStyle(0xffaa00); // Orange core
    bulletGraphics.fillRect(0, 0, 8, 2); // Thin elongated shape
    bulletGraphics.generateTexture("bullet", 8, 2);
    bulletGraphics.destroy();

    // Autocannon trail - thin streak
    const trailGraphics = this.make.graphics({ x: 0, y: 0 });
    trailGraphics.fillStyle(0xffaa00, 0.8); // Orange
    trailGraphics.fillRect(0, 0, 6, 1); // Very thin trail
    trailGraphics.generateTexture("bullet_trail", 6, 1);
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

    // Autocannon icon - multiple thin rounds
    const autocannonIcon = this.make.graphics({ x: 0, y: 0 });
    autocannonIcon.fillStyle(0xffd700); // Gold
    // Three staggered tracer rounds
    autocannonIcon.fillRect(2, 6, 8, 2);
    autocannonIcon.fillRect(12, 4, 8, 2);
    autocannonIcon.fillRect(22, 8, 8, 2);
    autocannonIcon.lineStyle(1, 0xffaa00, 1);
    autocannonIcon.strokeRect(2, 6, 8, 2);
    autocannonIcon.strokeRect(12, 4, 8, 2);
    autocannonIcon.strokeRect(22, 8, 8, 2);
    autocannonIcon.generateTexture("autocannon_icon", 30, 15);
    autocannonIcon.destroy();

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
