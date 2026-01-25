import Phaser from "phaser";
import { Vector3D } from "./Vector3D";
import { Camera3D, ScreenPoint } from "./Camera3D";
import { WireframeModel } from "./WireframeModel";

/**
 * Renders 3D wireframe models to 2D lines using Phaser Graphics
 */
export class WireframeRenderer {
  private graphics: Phaser.GameObjects.Graphics;
  private camera: Camera3D;
  private lineWidth: number;

  constructor(scene: Phaser.Scene, camera: Camera3D, lineWidth = 2) {
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(10);
    this.camera = camera;
    this.lineWidth = lineWidth;
  }

  setCamera(camera: Camera3D): void {
    this.camera = camera;
  }

  clear(): void {
    this.graphics.clear();
  }

  /**
   * Render a wireframe model at a given position and rotation
   */
  render(
    model: WireframeModel,
    position: Vector3D,
    rotation: number,
    screenW: number,
    screenH: number,
  ): void {
    // Transform all vertices to world space, then project to screen
    const screenPoints: (ScreenPoint | null)[] = model.vertices.map(
      (vertex) => {
        const worldPos = vertex.rotateY(rotation).add(position);
        return this.camera.worldToScreen(worldPos, screenW, screenH);
      },
    );

    // Draw each edge
    for (const edge of model.edges) {
      const p1 = screenPoints[edge.start];
      const p2 = screenPoints[edge.end];

      if (!p1 || !p2) {
        // Try to clip the line if one point is visible
        const clipped = this.clipEdge(
          model.vertices[edge.start].rotateY(rotation).add(position),
          model.vertices[edge.end].rotateY(rotation).add(position),
          screenW,
          screenH,
        );
        if (clipped) {
          this.drawLine(clipped[0], clipped[1], edge.color ?? model.color);
        }
        continue;
      }

      this.drawLine(p1, p2, edge.color ?? model.color);
    }
  }

  /**
   * Draw a single line between two screen points
   */
  drawLine(p1: ScreenPoint, p2: ScreenPoint, color: number): void {
    const avgDepth = (p1.z + p2.z) / 2;
    const alpha = Math.max(0.3, 1 - avgDepth / this.camera.farClip);

    this.graphics.lineStyle(this.lineWidth, color, alpha);
    this.graphics.beginPath();
    this.graphics.moveTo(p1.x, p1.y);
    this.graphics.lineTo(p2.x, p2.y);
    this.graphics.strokePath();
  }

  /**
   * Draw a line directly in screen space (for HUD elements)
   */
  drawScreenLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: number,
    alpha = 1,
  ): void {
    this.graphics.lineStyle(this.lineWidth, color, alpha);
    this.graphics.beginPath();
    this.graphics.moveTo(x1, y1);
    this.graphics.lineTo(x2, y2);
    this.graphics.strokePath();
  }

  /**
   * Clip an edge that crosses the near plane
   */
  private clipEdge(
    worldP1: Vector3D,
    worldP2: Vector3D,
    screenW: number,
    screenH: number,
  ): [ScreenPoint, ScreenPoint] | null {
    const camP1 = this.camera.worldToCameraSpace(worldP1);
    const camP2 = this.camera.worldToCameraSpace(worldP2);

    if (camP1.z <= this.camera.nearClip && camP2.z <= this.camera.nearClip) {
      return null;
    }

    if (camP1.z > this.camera.nearClip && camP2.z > this.camera.nearClip) {
      const sp1 = this.camera.worldToScreen(worldP1, screenW, screenH);
      const sp2 = this.camera.worldToScreen(worldP2, screenW, screenH);
      if (sp1 && sp2) return [sp1, sp2];
      return null;
    }

    const nearZ = this.camera.nearClip + 0.1;
    const t = (nearZ - camP1.z) / (camP2.z - camP1.z);
    const clippedCam = camP1.lerp(camP2, t);

    const clippedScreen: ScreenPoint = {
      x: (clippedCam.x / clippedCam.z) * this.camera.focalLength + screenW / 2,
      y: screenH / 2 - (clippedCam.y / clippedCam.z) * this.camera.focalLength,
      z: clippedCam.z,
    };

    if (camP1.z > this.camera.nearClip) {
      const sp1 = this.camera.worldToScreen(worldP1, screenW, screenH);
      if (sp1) return [sp1, clippedScreen];
    } else {
      const sp2 = this.camera.worldToScreen(worldP2, screenW, screenH);
      if (sp2) return [clippedScreen, sp2];
    }

    return null;
  }

  getGraphics(): Phaser.GameObjects.Graphics {
    return this.graphics;
  }

  destroy(): void {
    this.graphics.destroy();
  }
}
