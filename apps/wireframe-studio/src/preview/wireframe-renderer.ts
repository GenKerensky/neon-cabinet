import type { GameObjects, Scene } from "phaser";
import type { WireframePreviewModel } from "../assets/wire-sidecar";
import { rotatePoint, type Vector3Like } from "./vector3d";
import type { ModelBounds } from "./wireframe-model";

export interface WireframeRenderState {
  edgeColorsEnabled: boolean;
  pitch: number;
  yaw: number;
  zoomDistance: number;
}

export class WireframeRenderer {
  private readonly graphics: GameObjects.Graphics;

  constructor(scene: Scene) {
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(10);
  }

  clear(): void {
    this.graphics.clear();
  }

  render(
    model: WireframePreviewModel,
    bounds: ModelBounds,
    state: WireframeRenderState,
    screenW: number,
    screenH: number,
  ): void {
    const projected = model.vertices.map((vertex) =>
      projectVertex(vertex, bounds, state, screenW, screenH),
    );

    for (const edge of model.edges) {
      const start = projected[edge.start];
      const end = projected[edge.end];
      if (!start || !end) continue;
      const color =
        state.edgeColorsEnabled && typeof edge.color === "number"
          ? edge.color
          : model.color;
      const alpha = Math.max(0.28, 1 - (start.z + end.z) / 2 / 5000);
      this.graphics.lineStyle(2, color, alpha);
      this.graphics.beginPath();
      this.graphics.moveTo(start.x, start.y);
      this.graphics.lineTo(end.x, end.y);
      this.graphics.strokePath();
    }
  }

  getGraphics(): GameObjects.Graphics {
    return this.graphics;
  }

  destroy(): void {
    this.graphics.destroy();
  }
}

function projectVertex(
  vertex: Vector3Like,
  bounds: ModelBounds,
  state: WireframeRenderState,
  screenW: number,
  screenH: number,
): { x: number; y: number; z: number } | null {
  const centered = {
    x: vertex.x - bounds.center.x,
    y: vertex.y - bounds.center.y,
    z: vertex.z - bounds.center.z,
  };
  const rotated = rotatePoint(centered, state.yaw, state.pitch);
  const z = rotated.z + state.zoomDistance;
  if (z <= 6) return null;
  const focalLength = Math.min(screenW, screenH) * 0.82;

  return {
    x: screenW / 2 + (rotated.x / z) * focalLength,
    y: screenH / 2 - (rotated.y / z) * focalLength,
    z,
  };
}
