import * as Phaser from "phaser";
import { SVGPuppetMetadata, LayerMetadata, MaterialMetadata } from "./types.js";
type LayerGameObject =
  | Phaser.GameObjects.Container
  | Phaser.GameObjects.Graphics;
export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
export declare class VectorPuppet extends Phaser.GameObjects.Container {
  protected metadata: SVGPuppetMetadata;
  protected layers: Map<string, LayerGameObject>;
  protected layerDrawables: Map<string, LayerGameObject>;
  protected directionRotationTargets: Map<string, Phaser.GameObjects.Container>;
  protected layersMetadata: Map<string, LayerMetadata>;
  protected sockets: Map<
    string,
    {
      x: number;
      y: number;
    }
  >;
  protected directionRotationContext: Map<string, boolean>;
  protected content: Phaser.GameObjects.Container;
  protected directionBendX: number;
  protected currentDirection: string;
  scene: Phaser.Scene;
  x: number;
  y: number;
  alpha: number;
  scale: number;
  depth: number;
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    metadata: SVGPuppetMetadata,
  );
  getLayer(id: string): LayerGameObject | undefined;
  getLayerDrawable(id: string): LayerGameObject | undefined;
  getRotationTarget(id: string): Phaser.GameObjects.Container | undefined;
  private setupLayers;
  private drawLayer;
  private executeCommand;
  private drawQuadraticCurve;
  private drawCubicCurve;
  private drawSVGPathArc;
  private applyTransform;
  private setupSockets;
  private setupPhysics;
  getSocketWorldPosition(id: string): Phaser.Math.Vector2;
  getLayerMaterial(layerId: string): MaterialMetadata | undefined;
  setLayerVisibility(layerId: string, visible: boolean): void;
  setLayerAlpha(layerId: string, alpha: number): void;
  setLayerScale(layerId: string, scale: number): void;
  setLayerRotation(layerId: string, rotation: number): void;
  setDirection(dir: Direction): void;
  update(time: number, delta: number): void;
  private createDirectionBendTransform;
  private applyWaveAnimation;
  private applyWobbleAnimation;
  private applyChompAnimation;
  private applyFlashAnimation;
  private applyPulseAnimation;
  private getDirectionRotationDegrees;
  private degreesToRadians;
  private getShortestRotationTarget;
  private getChompGapCenter;
}
export {};
