import { Vector3D } from "../engine/Vector3D";
import { Camera3D } from "../engine/Camera3D";

// Laser beam colors
const LASER_RED = 0xff0000;
const LASER_CORE = 0xffaacc; // Bright pink fill

/**
 * Visual laser beam effect - triangle wedge from screen edge to crosshair
 * Creates illusion of beam from off-screen mounted weapon
 */
export class LaserBeam {
  endPos: Vector3D;
  private lifetime: number;
  private readonly maxLifetime = 180; // ms - quick flash
  private alive = true;

  constructor(_startPos: Vector3D, endPos: Vector3D) {
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
   * Render the beam as a triangle wedge from screen edge to crosshair center
   * Triangle with pink fill and red glowing stroke
   */
  render(
    graphics: Phaser.GameObjects.Graphics,
    _camera: Camera3D,
    screenW: number,
    screenH: number,
  ): void {
    if (!this.alive) return;

    // Target point: screen center (crosshair)
    const targetX = screenW / 2;
    const targetY = screenH / 2;

    // Origin: off the right edge of screen, spread vertically for triangle width
    const originX = screenW + 50; // Past right edge
    const beamWidth = 60; // Width of triangle at origin
    const originY1 = screenH * 0.25 - beamWidth / 2; // Upper point
    const originY2 = screenH * 0.25 + beamWidth / 2; // Lower point

    // Calculate fade based on lifetime
    const fade = 1 - this.lifetime / this.maxLifetime;
    const alpha = fade;

    // Draw outer glow strokes (multiple passes for blur effect)
    // Outermost glow
    graphics.lineStyle(16, LASER_RED, alpha * 0.08);
    this.drawTriangleStroke(
      graphics,
      targetX,
      targetY,
      originX,
      originY1,
      originY2,
    );

    graphics.lineStyle(12, LASER_RED, alpha * 0.12);
    this.drawTriangleStroke(
      graphics,
      targetX,
      targetY,
      originX,
      originY1,
      originY2,
    );

    graphics.lineStyle(8, LASER_RED, alpha * 0.2);
    this.drawTriangleStroke(
      graphics,
      targetX,
      targetY,
      originX,
      originY1,
      originY2,
    );

    // Inner glow stroke
    graphics.lineStyle(4, LASER_RED, alpha * 0.5);
    this.drawTriangleStroke(
      graphics,
      targetX,
      targetY,
      originX,
      originY1,
      originY2,
    );

    // Core stroke
    graphics.lineStyle(2, LASER_RED, alpha * 0.9);
    this.drawTriangleStroke(
      graphics,
      targetX,
      targetY,
      originX,
      originY1,
      originY2,
    );

    // Bright pink/white fill
    graphics.fillStyle(LASER_CORE, alpha * 0.7);
    graphics.beginPath();
    graphics.moveTo(targetX, targetY);
    graphics.lineTo(originX, originY1);
    graphics.lineTo(originX, originY2);
    graphics.closePath();
    graphics.fillPath();

    // Inner bright core (smaller triangle)
    graphics.fillStyle(0xffffff, alpha * 0.5);
    const coreWidth = beamWidth * 0.3;
    const coreY1 = screenH * 0.25 - coreWidth / 2;
    const coreY2 = screenH * 0.25 + coreWidth / 2;
    graphics.beginPath();
    graphics.moveTo(targetX, targetY);
    graphics.lineTo(originX, coreY1);
    graphics.lineTo(originX, coreY2);
    graphics.closePath();
    graphics.fillPath();
  }

  /**
   * Draw triangle outline (stroke only)
   */
  private drawTriangleStroke(
    graphics: Phaser.GameObjects.Graphics,
    tipX: number,
    tipY: number,
    baseX: number,
    baseY1: number,
    baseY2: number,
  ): void {
    graphics.beginPath();
    graphics.moveTo(tipX, tipY);
    graphics.lineTo(baseX, baseY1);
    graphics.lineTo(baseX, baseY2);
    graphics.closePath();
    graphics.strokePath();
  }

  isAlive(): boolean {
    return this.alive;
  }

  destroy(): void {
    this.alive = false;
  }
}
