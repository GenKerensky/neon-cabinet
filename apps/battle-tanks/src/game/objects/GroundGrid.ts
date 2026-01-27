import type { GameObjects, Scene } from "phaser";
import { Vector3D } from "../engine/Vector3D";
import { Camera3D, ScreenPoint } from "../engine/Camera3D";
import { COLORS } from "../models";

/**
 * Perspective ground grid for depth perception
 */
export class GroundGrid {
  private graphics: GameObjects.Graphics;
  private fadeOverlay: GameObjects.Graphics;
  private tankGlow: GameObjects.Graphics;
  private camera: Camera3D;
  private gridSize: number;
  private gridExtent: number;
  private lineColor: number;
  private groundY: number;
  private screenW: number;
  private screenH: number;

  constructor(
    scene: Scene,
    camera: Camera3D,
    gridSize = 200,
    gridExtent = 4000,
  ) {
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(1);

    this.fadeOverlay = scene.add.graphics();
    this.fadeOverlay.setDepth(2); // Above grid lines

    this.tankGlow = scene.add.graphics();
    this.tankGlow.setDepth(0); // Below grid lines

    this.camera = camera;
    this.gridSize = gridSize;
    this.gridExtent = gridExtent;
    this.lineColor = COLORS.grid;
    this.groundY = 0;

    const { width, height } = scene.cameras.main;
    this.screenW = width;
    this.screenH = height;

    this.createFadeOverlay();
    this.createTankGlow();
  }

  private createFadeOverlay(): void {
    const horizonY = this.screenH / 2;
    const groundHeight = this.screenH - horizonY;

    // Gradient from black (at horizon) to transparent (at bottom)
    const steps = 40;
    for (let i = 0; i < steps; i++) {
      const progress = i / steps;
      const y = horizonY + progress * groundHeight;
      const h = groundHeight / steps + 1;

      // Fade from opaque black to transparent
      const alpha = Math.pow(1 - progress, 2) * 0.95;

      this.fadeOverlay.fillStyle(0x000000, alpha);
      this.fadeOverlay.fillRect(0, y, this.screenW, h);
    }
  }

  private createTankGlow(): void {
    // Linear gradient from bottom (tank) toward horizon
    const horizonY = this.screenH / 2;
    const groundHeight = this.screenH - horizonY;

    // Draw horizontal strips from bottom to horizon
    const steps = 30;
    for (let i = 0; i < steps; i++) {
      const progress = i / steps;
      const y = this.screenH - progress * groundHeight;
      const h = groundHeight / steps + 1;

      // Fade from visible at bottom to transparent toward horizon
      const alpha = (1 - progress) * 0.07;

      this.tankGlow.fillStyle(0x00ff00, alpha);
      this.tankGlow.fillRect(0, y - h, this.screenW, h);
    }
  }

  setCamera(camera: Camera3D): void {
    this.camera = camera;
  }

  render(screenW: number, screenH: number): void {
    this.graphics.clear();

    const camX = this.camera.position.x;
    const camZ = this.camera.position.z;

    const startX =
      Math.floor((camX - this.gridExtent) / this.gridSize) * this.gridSize;
    const endX =
      Math.ceil((camX + this.gridExtent) / this.gridSize) * this.gridSize;
    const startZ =
      Math.floor((camZ - this.gridExtent) / this.gridSize) * this.gridSize;
    const endZ =
      Math.ceil((camZ + this.gridExtent) / this.gridSize) * this.gridSize;

    // Lines parallel to Z axis
    for (let x = startX; x <= endX; x += this.gridSize) {
      this.drawGridLine(
        new Vector3D(x, this.groundY, startZ),
        new Vector3D(x, this.groundY, endZ),
        screenW,
        screenH,
      );
    }

    // Lines parallel to X axis
    for (let z = startZ; z <= endZ; z += this.gridSize) {
      this.drawGridLine(
        new Vector3D(startX, this.groundY, z),
        new Vector3D(endX, this.groundY, z),
        screenW,
        screenH,
      );
    }
  }

  private drawGridLine(
    worldP1: Vector3D,
    worldP2: Vector3D,
    screenW: number,
    screenH: number,
  ): void {
    const camP1 = this.camera.worldToCameraSpace(worldP1);
    const camP2 = this.camera.worldToCameraSpace(worldP2);

    if (camP1.z <= this.camera.nearClip && camP2.z <= this.camera.nearClip) {
      return;
    }

    let clippedP1 = camP1;
    let clippedP2 = camP2;

    if (camP1.z <= this.camera.nearClip || camP2.z <= this.camera.nearClip) {
      const nearZ = this.camera.nearClip + 0.1;

      if (camP1.z <= this.camera.nearClip) {
        const t = (nearZ - camP1.z) / (camP2.z - camP1.z);
        clippedP1 = camP1.lerp(camP2, t);
      }

      if (camP2.z <= this.camera.nearClip) {
        const t = (nearZ - camP2.z) / (camP1.z - camP2.z);
        clippedP2 = camP2.lerp(camP1, t);
      }
    }

    if (
      clippedP1.z > this.camera.farClip &&
      clippedP2.z > this.camera.farClip
    ) {
      return;
    }

    if (clippedP1.z > this.camera.farClip) {
      const t =
        (this.camera.farClip - clippedP1.z) / (clippedP2.z - clippedP1.z);
      clippedP1 = clippedP1.lerp(clippedP2, t);
    }

    if (clippedP2.z > this.camera.farClip) {
      const t =
        (this.camera.farClip - clippedP2.z) / (clippedP1.z - clippedP2.z);
      clippedP2 = clippedP2.lerp(clippedP1, t);
    }

    const screenP1 = this.projectToScreen(clippedP1, screenW, screenH);
    const screenP2 = this.projectToScreen(clippedP2, screenW, screenH);

    if (!screenP1 || !screenP2) return;

    this.graphics.lineStyle(3, this.lineColor, 0.85);
    this.graphics.beginPath();
    this.graphics.moveTo(screenP1.x, screenP1.y);
    this.graphics.lineTo(screenP2.x, screenP2.y);
    this.graphics.strokePath();
  }

  private projectToScreen(
    camSpacePoint: Vector3D,
    screenW: number,
    screenH: number,
  ): ScreenPoint | null {
    if (camSpacePoint.z <= 0) return null;

    const screenX =
      (camSpacePoint.x / camSpacePoint.z) * this.camera.focalLength +
      screenW / 2;
    const screenY =
      screenH / 2 -
      (camSpacePoint.y / camSpacePoint.z) * this.camera.focalLength;

    return { x: screenX, y: screenY, z: camSpacePoint.z };
  }

  destroy(): void {
    this.graphics.destroy();
    this.fadeOverlay.destroy();
    this.tankGlow.destroy();
  }
}
