import { Vector3D } from "../engine/Vector3D";
import { Camera3D } from "../engine/Camera3D";
import { COLORS } from "../models";

/**
 * Visual laser beam effect - rendered as a glowing line
 */
export class LaserBeam {
  startPos: Vector3D;
  endPos: Vector3D;
  private lifetime: number;
  private readonly maxLifetime = 150; // ms - quick flash
  private alive = true;

  constructor(startPos: Vector3D, endPos: Vector3D) {
    this.startPos = startPos.clone();
    this.endPos = endPos.clone();
    this.lifetime = 0;
  }

  update(delta: number): void {
    if (!this.alive) return;

    this.lifetime += delta;
    if (this.lifetime >= this.maxLifetime) {
      this.alive = false;
    }
  }

  /**
   * Render the beam using Phaser graphics
   * Draws a glowing line from start to end
   */
  render(
    graphics: Phaser.GameObjects.Graphics,
    camera: Camera3D,
    screenW: number,
    screenH: number,
  ): void {
    if (!this.alive) return;

    // Project start and end points to screen
    const startScreen = camera.worldToScreen(this.startPos, screenW, screenH);
    const endScreen = camera.worldToScreen(this.endPos, screenW, screenH);

    // Check if either point is behind camera
    if (!startScreen || !endScreen) return;

    // Calculate fade based on lifetime (fade out)
    const fade = 1 - this.lifetime / this.maxLifetime;
    const alpha = fade;

    // Draw multiple lines for glow effect
    // Outer glow
    graphics.lineStyle(8, COLORS.laser, alpha * 0.2);
    graphics.beginPath();
    graphics.moveTo(startScreen.x, startScreen.y);
    graphics.lineTo(endScreen.x, endScreen.y);
    graphics.strokePath();

    // Middle glow
    graphics.lineStyle(4, COLORS.laser, alpha * 0.5);
    graphics.beginPath();
    graphics.moveTo(startScreen.x, startScreen.y);
    graphics.lineTo(endScreen.x, endScreen.y);
    graphics.strokePath();

    // Core beam (brightest)
    graphics.lineStyle(2, 0xffffff, alpha);
    graphics.beginPath();
    graphics.moveTo(startScreen.x, startScreen.y);
    graphics.lineTo(endScreen.x, endScreen.y);
    graphics.strokePath();
  }

  isAlive(): boolean {
    return this.alive;
  }

  destroy(): void {
    this.alive = false;
  }
}
