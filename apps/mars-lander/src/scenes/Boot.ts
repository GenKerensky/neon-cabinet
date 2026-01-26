import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { VectorMode } from "@neon-cabinet/games-shared";

export class Boot extends Scene {
  constructor() {
    super("Boot");
  }

  preload(): void {
    // Create complex lander sprite inspired by Blue Moon lander
    // Lander dimensions: 80x120 pixels (tall cylindrical design)
    this.createLanderTexture();

    // Create flame/thruster particle
    this.createFlameTexture();

    // Create particle texture
    this.createParticleTexture();

    // Create landing pad texture
    this.createLandingPadTexture();

    // Create star texture
    this.createStarTexture();
  }

  private createLanderTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    const w = 80;
    const h = 120;
    const cx = w / 2; // Center X

    // Colors - martian/orange theme for the lander
    const bodyColor = 0xffffff; // White body
    const accentColor = 0xff6600; // Orange accents
    const detailColor = 0x00ddff; // Cyan details/lights
    const legColor = 0xccaa00; // Gold/tan legs
    const trussColor = 0x888888; // Gray truss

    // ===== DOMED TOP SECTION =====
    // Main dome outline
    g.lineStyle(2, bodyColor, 1);
    g.beginPath();
    g.arc(cx, 18, 20, Math.PI, 0, false);
    g.strokePath();

    // Dome base line
    g.lineStyle(2, accentColor, 1);
    g.lineBetween(cx - 20, 18, cx + 20, 18);

    // Small antennas on top
    g.lineStyle(1, trussColor, 1);
    g.lineBetween(cx - 8, 2, cx - 8, 10);
    g.lineBetween(cx + 8, 2, cx + 8, 10);
    g.fillStyle(detailColor, 1);
    g.fillCircle(cx - 8, 2, 2);
    g.fillCircle(cx + 8, 2, 2);

    // Center light on dome
    g.fillStyle(detailColor, 1);
    g.fillCircle(cx, 8, 3);
    g.lineStyle(1, 0xffffff, 0.5);
    g.strokeCircle(cx, 8, 5);

    // ===== UPPER CYLINDRICAL BODY =====
    // Main body outline
    g.lineStyle(2, bodyColor, 1);
    g.strokeRect(cx - 22, 18, 44, 35);

    // Panel lines on body
    g.lineStyle(1, trussColor, 0.6);
    g.lineBetween(cx - 10, 18, cx - 10, 53);
    g.lineBetween(cx + 10, 18, cx + 10, 53);

    // Logo/marking area (orange rectangle)
    g.fillStyle(accentColor, 0.8);
    g.fillRect(cx - 8, 28, 16, 12);
    g.lineStyle(1, accentColor, 1);
    g.strokeRect(cx - 8, 28, 16, 12);

    // Side equipment pods
    g.lineStyle(1, bodyColor, 1);
    g.strokeRect(cx - 28, 25, 6, 20);
    g.strokeRect(cx + 22, 25, 6, 20);
    g.fillStyle(detailColor, 0.5);
    g.fillRect(cx - 27, 30, 4, 4);
    g.fillRect(cx + 23, 30, 4, 4);

    // ===== MIDDLE TRUSS/LATTICE SECTION =====
    const trussTop = 53;
    const trussBottom = 75;

    // Outer frame
    g.lineStyle(2, trussColor, 1);
    g.lineBetween(cx - 22, trussTop, cx - 28, trussBottom);
    g.lineBetween(cx + 22, trussTop, cx + 28, trussBottom);
    g.lineBetween(cx - 28, trussBottom, cx + 28, trussBottom);

    // Cross-bracing (X pattern)
    g.lineStyle(1, trussColor, 0.8);
    // Left side
    g.lineBetween(cx - 22, trussTop, cx - 8, trussBottom);
    g.lineBetween(cx - 8, trussTop + 5, cx - 22, trussBottom - 5);
    // Right side
    g.lineBetween(cx + 22, trussTop, cx + 8, trussBottom);
    g.lineBetween(cx + 8, trussTop + 5, cx + 22, trussBottom - 5);
    // Center
    g.lineBetween(cx - 8, trussTop, cx + 8, trussBottom);
    g.lineBetween(cx + 8, trussTop, cx - 8, trussBottom);

    // Horizontal struts
    g.lineBetween(cx - 15, trussTop + 11, cx + 15, trussTop + 11);

    // ===== LOWER ENGINE SECTION =====
    g.lineStyle(2, bodyColor, 1);
    g.strokeRect(cx - 15, trussBottom, 30, 15);

    // Engine bell
    g.lineStyle(2, accentColor, 1);
    g.beginPath();
    g.moveTo(cx - 10, trussBottom + 15);
    g.lineTo(cx - 14, trussBottom + 28);
    g.lineTo(cx + 14, trussBottom + 28);
    g.lineTo(cx + 10, trussBottom + 15);
    g.strokePath();

    // Engine interior lines
    g.lineStyle(1, trussColor, 0.6);
    g.lineBetween(cx - 5, trussBottom + 15, cx - 7, trussBottom + 26);
    g.lineBetween(cx, trussBottom + 15, cx, trussBottom + 26);
    g.lineBetween(cx + 5, trussBottom + 15, cx + 7, trussBottom + 26);

    // ===== LANDING LEGS (4 legs, viewed from side) =====
    const legAttachY = trussBottom + 5;
    const legEndY = h - 5;
    const legSpread = 35;

    g.lineStyle(2, legColor, 1);

    // Front-left leg
    g.lineBetween(cx - 10, legAttachY, cx - legSpread, legEndY);
    // Front-right leg
    g.lineBetween(cx + 10, legAttachY, cx + legSpread, legEndY);

    // Leg struts (diagonal bracing)
    g.lineStyle(1, legColor, 0.8);
    g.lineBetween(cx - 18, trussBottom, cx - legSpread + 5, legEndY - 10);
    g.lineBetween(cx + 18, trussBottom, cx + legSpread - 5, legEndY - 10);

    // Foot pads (circular)
    g.lineStyle(2, legColor, 1);
    g.strokeCircle(cx - legSpread, legEndY, 4);
    g.strokeCircle(cx + legSpread, legEndY, 4);

    // Landing sensors on feet
    g.fillStyle(detailColor, 1);
    g.fillCircle(cx - legSpread, legEndY, 2);
    g.fillCircle(cx + legSpread, legEndY, 2);

    // ===== STATUS LIGHTS =====
    // Running lights on body
    g.fillStyle(0x00ff00, 1); // Green
    g.fillCircle(cx - 18, 35, 2);
    g.fillStyle(0xff0000, 1); // Red
    g.fillCircle(cx + 18, 35, 2);

    // Generate texture
    g.generateTexture("lander", w, h);
    g.destroy();
  }

  private createFlameTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });

    // Main flame (orange/red gradient simulation with layers)
    g.fillStyle(0xff0000, 0.3); // Red outer
    g.fillEllipse(12, 20, 20, 35);
    g.fillStyle(0xff6600, 0.5); // Orange
    g.fillEllipse(12, 16, 16, 28);
    g.fillStyle(0xffaa00, 0.7); // Yellow-orange
    g.fillEllipse(12, 12, 12, 20);
    g.fillStyle(0xffff00, 0.9); // Yellow
    g.fillEllipse(12, 8, 8, 14);
    g.fillStyle(0xffffff, 1); // White hot core
    g.fillEllipse(12, 5, 4, 8);

    g.generateTexture("flame", 24, 40);
    g.destroy();
  }

  private createParticleTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffffff);
    g.lineStyle(1, 0xeeeeee, 1);
    g.fillCircle(2.5, 2.5, 2.5);
    g.strokeCircle(2.5, 2.5, 2.5);
    g.generateTexture("particle", 5, 5);
    g.destroy();
  }

  private createLandingPadTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });

    // Landing pad - flat surface with markings
    g.lineStyle(3, 0x00ff00, 1); // Bright green
    g.lineBetween(0, 5, 100, 5);

    // Landing zone markings
    g.lineStyle(2, 0x00ff00, 0.8);
    g.lineBetween(10, 0, 10, 10);
    g.lineBetween(90, 0, 90, 10);

    // Center H marking
    g.lineStyle(2, 0x00ffff, 1);
    g.lineBetween(45, 2, 45, 8);
    g.lineBetween(55, 2, 55, 8);
    g.lineBetween(45, 5, 55, 5);

    g.generateTexture("landing_pad", 100, 10);
    g.destroy();
  }

  private createStarTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(2, 2, 2);
    g.generateTexture("star", 4, 4);
    g.destroy();
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
