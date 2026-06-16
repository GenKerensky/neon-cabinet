import type * as Phaser from "phaser";
import { VectorPuppet } from "./vector-puppet.js";
import type {
  HudStateStyle,
  LayerMetadata,
  SocketMetadata,
  SVGPuppetMetadata,
} from "./types.js";

export class HudVectorPuppet extends VectorPuppet {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    metadata: SVGPuppetMetadata,
  ) {
    super(scene, x, y, metadata);
  }

  getSocketByHudRole(role: string): SocketMetadata | undefined {
    return this.getAllSocketMetadata().find(
      (socket) => socket.hud?.role === role,
    );
  }

  getHudLayerMetadata(layerId: string): LayerMetadata | undefined {
    return this.getLayerMetadata(layerId);
  }

  applyHudState(bind: string, state: string): void {
    this.layersMetadata.forEach((layer, layerId) => {
      if (layer.hud?.bind !== bind && layer.hud?.role !== bind) return;

      const style = layer.hud?.stateStyles?.[state];
      if (!style) return;

      this.applyStateStyle(layer, style);
      this.redrawLayer(layerId);
    });
  }

  private applyStateStyle(layer: LayerMetadata, style: HudStateStyle): void {
    if (style.fill !== undefined) layer.fill = style.fill;
    if (style.stroke !== undefined) layer.stroke = style.stroke;
    if (style.strokeWidth !== undefined) layer.strokeWidth = style.strokeWidth;
    if (style.opacity !== undefined) layer.opacity = style.opacity;
    if (style.visible !== undefined) layer.visible = style.visible;
  }
}
