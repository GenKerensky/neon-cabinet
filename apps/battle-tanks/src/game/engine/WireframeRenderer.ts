import type { GameObjects, Scene } from "phaser";
import { Vector3D } from "./Vector3D";
import { Camera3D, ScreenPoint } from "./Camera3D";
import { WireframeModel } from "./WireframeModel";

/**
 * Renders 3D wireframe models to 2D lines using Phaser Graphics
 */
export class WireframeRenderer {
  private graphics: GameObjects.Graphics;
  private camera: Camera3D;
  private lineWidth: number;
  private worldPoints: Vector3D[] = [];
  private cameraPoints: Vector3D[] = [];

  constructor(scene: Scene, camera: Camera3D, lineWidth = 2) {
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
   * @param colorOverride Optional color to use instead of model color
   */
  render(
    model: WireframeModel,
    position: Vector3D,
    rotation: number,
    screenW: number,
    screenH: number,
    colorOverride?: number,
  ): void {
    const useColor = colorOverride ?? model.color;
    this.ensureScratchCapacity(model.vertices.length);

    const cosModel = Math.cos(rotation);
    const sinModel = Math.sin(rotation);
    const cosCamera = Math.cos(this.camera.rotation);
    const sinCamera = Math.sin(this.camera.rotation);

    for (let i = 0; i < model.vertices.length; i++) {
      const vertex = model.vertices[i];
      const world = this.worldPoints[i];
      const cameraPoint = this.cameraPoints[i];

      world.x = vertex.x * cosModel + vertex.z * sinModel + position.x;
      world.y = vertex.y + position.y;
      world.z = -vertex.x * sinModel + vertex.z * cosModel + position.z;

      const relX = world.x - this.camera.position.x;
      const relY = world.y - this.camera.position.y;
      const relZ = world.z - this.camera.position.z;
      cameraPoint.x = relX * cosCamera - relZ * sinCamera;
      cameraPoint.y = relY;
      cameraPoint.z = relX * sinCamera + relZ * cosCamera;
    }

    // Draw each edge
    for (const edge of model.edges) {
      const clipped = this.clipCameraEdge(
        this.cameraPoints[edge.start],
        this.cameraPoints[edge.end],
        screenW,
        screenH,
      );

      if (clipped) {
        this.drawLine(clipped[0], clipped[1], edge.color ?? useColor);
      }
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

  private clipCameraEdge(
    camP1: Vector3D,
    camP2: Vector3D,
    screenW: number,
    screenH: number,
  ): [ScreenPoint, ScreenPoint] | null {
    if (camP1.z <= this.camera.nearClip && camP2.z <= this.camera.nearClip) {
      return null;
    }
    if (camP1.z > this.camera.farClip && camP2.z > this.camera.farClip) {
      return null;
    }
    if (this.isOutsideSameFrustumSide(camP1, camP2, screenW, screenH)) {
      return null;
    }

    const p1 = camP1.clone();
    const p2 = camP2.clone();

    if (p1.z <= this.camera.nearClip || p2.z <= this.camera.nearClip) {
      const nearZ = this.camera.nearClip + 0.1;
      if (p1.z <= this.camera.nearClip) {
        this.lerpInto(
          p1,
          camP1,
          camP2,
          (nearZ - camP1.z) / (camP2.z - camP1.z),
        );
      }
      if (p2.z <= this.camera.nearClip) {
        this.lerpInto(
          p2,
          camP2,
          camP1,
          (nearZ - camP2.z) / (camP1.z - camP2.z),
        );
      }
    }

    const sp1 = this.camera.projectCameraPoint(p1, screenW, screenH);
    const sp2 = this.camera.projectCameraPoint(p2, screenW, screenH);
    return this.clipScreenLine(sp1, sp2, screenW, screenH);
  }

  getGraphics(): GameObjects.Graphics {
    return this.graphics;
  }

  destroy(): void {
    this.graphics.destroy();
  }

  private ensureScratchCapacity(count: number): void {
    while (this.worldPoints.length < count) {
      this.worldPoints.push(Vector3D.zero());
      this.cameraPoints.push(Vector3D.zero());
    }
  }

  private isOutsideSameFrustumSide(
    p1: Vector3D,
    p2: Vector3D,
    screenW: number,
    screenH: number,
  ): boolean {
    const b1 = this.camera.getFrustumBounds(screenW, screenH, p1.z);
    const b2 = this.camera.getFrustumBounds(screenW, screenH, p2.z);
    return (
      (p1.x < b1.minX && p2.x < b2.minX) ||
      (p1.x > b1.maxX && p2.x > b2.maxX) ||
      (p1.y < b1.minY && p2.y < b2.minY) ||
      (p1.y > b1.maxY && p2.y > b2.maxY)
    );
  }

  private lerpInto(
    target: Vector3D,
    from: Vector3D,
    to: Vector3D,
    t: number,
  ): void {
    target.x = from.x + (to.x - from.x) * t;
    target.y = from.y + (to.y - from.y) * t;
    target.z = from.z + (to.z - from.z) * t;
  }

  private clipScreenLine(
    p1: ScreenPoint,
    p2: ScreenPoint,
    screenW: number,
    screenH: number,
  ): [ScreenPoint, ScreenPoint] | null {
    let x1 = p1.x;
    let y1 = p1.y;
    let z1 = p1.z;
    let x2 = p2.x;
    let y2 = p2.y;
    let z2 = p2.z;
    let code1 = this.outCode(x1, y1, screenW, screenH);
    let code2 = this.outCode(x2, y2, screenW, screenH);

    while (true) {
      if ((code1 | code2) === 0) {
        return [
          { x: x1, y: y1, z: z1 },
          { x: x2, y: y2, z: z2 },
        ];
      }
      if ((code1 & code2) !== 0) return null;

      const codeOut = code1 !== 0 ? code1 : code2;
      let x = 0;
      let y = 0;
      let t = 0;

      if ((codeOut & 8) !== 0) {
        t = (0 - y1) / (y2 - y1);
        x = x1 + (x2 - x1) * t;
        y = 0;
      } else if ((codeOut & 4) !== 0) {
        t = (screenH - y1) / (y2 - y1);
        x = x1 + (x2 - x1) * t;
        y = screenH;
      } else if ((codeOut & 2) !== 0) {
        t = (screenW - x1) / (x2 - x1);
        y = y1 + (y2 - y1) * t;
        x = screenW;
      } else {
        t = (0 - x1) / (x2 - x1);
        y = y1 + (y2 - y1) * t;
        x = 0;
      }

      const z = z1 + (z2 - z1) * t;
      if (codeOut === code1) {
        x1 = x;
        y1 = y;
        z1 = z;
        code1 = this.outCode(x1, y1, screenW, screenH);
      } else {
        x2 = x;
        y2 = y;
        z2 = z;
        code2 = this.outCode(x2, y2, screenW, screenH);
      }
    }
  }

  private outCode(
    x: number,
    y: number,
    screenW: number,
    screenH: number,
  ): number {
    let code = 0;
    if (x < 0) code |= 1;
    if (x > screenW) code |= 2;
    if (y > screenH) code |= 4;
    if (y < 0) code |= 8;
    return code;
  }
}
