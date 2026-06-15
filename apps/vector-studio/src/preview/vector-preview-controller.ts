import { AUTO, Game, Scene, WEBGL } from "phaser";
import type { GameObjects } from "phaser";
import { SVGParser, VectorPuppet } from "@neon-cabinet/sprite-tools";
import type {
  LayerMetadata,
  SVGPuppetMetadata,
} from "@neon-cabinet/sprite-tools";
import { VectorMode, VectorShader } from "@neon-cabinet/shaders/shaders";

export interface PreviewAssetInput {
  label: string;
  source: string;
}

export interface PreviewLayerInfo {
  id: string;
  type: string;
  depth: number;
  visible: boolean;
}

export interface PreviewState {
  animationPaused: boolean;
  animationSpeed: number;
  assetLabel: string;
  colliderCount: number;
  layers: PreviewLayerInfo[];
  rotation: number;
  scale: number;
  shaderEnabled: boolean;
  socketCount: number;
  status: string;
  unsupportedWarnings: string[];
  vectorMode: VectorMode;
}

export interface VectorPreviewControllerOptions {
  container: HTMLElement;
  onStateChange(state: PreviewState): void;
}

const SUPPORTED_TAGS = new Set([
  "svg",
  "g",
  "path",
  "circle",
  "rect",
  "line",
  "polyline",
  "polygon",
]);

interface VectorShaderPipeline {
  setColorMode(mode: VectorMode): void;
}

function isVectorShaderPipeline(
  pipeline: unknown,
): pipeline is VectorShaderPipeline {
  return (
    typeof pipeline === "object" &&
    pipeline !== null &&
    "setColorMode" in pipeline &&
    typeof (pipeline as VectorShaderPipeline).setColorMode === "function"
  );
}

export class VectorPreviewController {
  private readonly game: Game;
  private readonly scene: StudioScene;

  constructor({ container, onStateChange }: VectorPreviewControllerOptions) {
    this.scene = new StudioScene(onStateChange);
    this.game = new Game({
      type: AUTO,
      width: container.clientWidth || window.innerWidth,
      height: container.clientHeight || window.innerHeight,
      parent: container,
      backgroundColor: "#000000",
      scene: this.scene,
      physics: {
        default: "arcade",
        arcade: { debug: false },
      },
      callbacks: {
        postBoot: (game: Game) => {
          const renderer = game.renderer;
          if (renderer.type === WEBGL) {
            (renderer as any).pipelines.addPostPipeline(
              "VectorShader",
              VectorShader,
            );
          }
        },
      },
    });
  }

  async loadAsset(asset: PreviewAssetInput): Promise<void> {
    this.scene.setStatus(`Loading ${asset.label}`);
    const response = await fetch(asset.source);
    if (!response.ok) {
      throw new Error(`Unable to load ${asset.label}`);
    }
    this.scene.previewSvg(await response.text(), asset.label);
  }

  clearAsset(): void {
    this.scene.clearPreview();
  }

  previewSvg(svgData: string, assetLabel: string): void {
    this.scene.previewSvg(svgData, assetLabel);
  }

  setAnimationPaused(paused: boolean): void {
    this.scene.setAnimationPaused(paused);
  }

  setAnimationSpeed(speed: number): void {
    this.scene.setAnimationSpeed(speed);
  }

  setDirection(direction: "CENTER" | "DOWN" | "LEFT" | "RIGHT" | "UP"): void {
    this.scene.setDirection(direction);
  }

  setLayerAlpha(layerId: string, value: number): void {
    this.scene.setLayerAlpha(layerId, value);
  }

  setLayerRotation(layerId: string, degrees: number): void {
    this.scene.setLayerRotation(layerId, degrees);
  }

  setLayerScale(layerId: string, value: number): void {
    this.scene.setLayerScale(layerId, value);
  }

  setLayerVisible(layerId: string, visible: boolean): void {
    this.scene.setLayerVisible(layerId, visible);
  }

  setOverlayVisibility(options: {
    colliders?: boolean;
    sockets?: boolean;
  }): void {
    this.scene.setOverlayVisibility(options);
  }

  setRotation(degrees: number): void {
    this.scene.setRotationDegrees(degrees);
  }

  setScale(scale: number): void {
    this.scene.setPreviewScale(scale);
  }

  setShaderEnabled(enabled: boolean): void {
    this.scene.setShaderEnabled(enabled);
  }

  setVectorMode(mode: VectorMode): void {
    this.scene.setVectorMode(mode);
  }

  stepFrame(direction: number): void {
    this.scene.stepFrame(direction);
  }

  destroy(): void {
    this.game.destroy(true);
  }
}

class StudioScene extends Scene {
  private animationPaused = false;
  private animationSpeed = 1;
  private animationTime = 0;
  private assetLabel = "No asset selected";
  private readonly frameMs = 1000 / 60;
  private metadata?: SVGPuppetMetadata;
  private overlayGraphics?: GameObjects.Graphics;
  private previewRotation = 0;
  private previewScale = 4;
  private puppet?: VectorPuppet;
  private shaderEnabled = true;
  private showColliders = true;
  private showSockets = true;
  private status = "READY";
  private unsupportedWarnings: string[] = [];
  private vectorMode = VectorMode.COLOR;

  constructor(private readonly onStateChange: (state: PreviewState) => void) {
    super("StudioScene");
  }

  create(): void {
    this.overlayGraphics = this.add.graphics();
    this.game.registry.set("vectorMode", this.vectorMode);
    this.applyShaderPipeline();
    this.emitState();
  }

  previewSvg(svgData: string, assetLabel: string): void {
    this.assetLabel = assetLabel;
    this.metadata = new SVGParser().parse(svgData);
    this.unsupportedWarnings = collectUnsupportedWarnings(svgData);
    this.puppet?.destroy();
    this.puppet = new VectorPuppet(
      this,
      (this.cameras.main as any).centerX,
      (this.cameras.main as any).centerY,
      this.metadata,
    );
    this.puppet.setScale(this.previewScale);
    this.puppet.setRotation((this.previewRotation * Math.PI) / 180);
    this.animationTime = 0;
    this.status = "LOADED";
    this.drawOverlays();
    this.emitState();
  }

  clearPreview(): void {
    this.assetLabel = "No asset selected";
    this.metadata = undefined;
    this.unsupportedWarnings = [];
    this.puppet?.destroy();
    this.puppet = undefined;
    this.overlayGraphics?.clear();
    this.animationTime = 0;
    this.status = "NO ASSET";
    this.emitState();
  }

  setAnimationPaused(paused: boolean): void {
    this.animationPaused = paused;
    this.emitState();
  }

  setAnimationSpeed(speed: number): void {
    this.animationSpeed = Math.min(4, Math.max(0.25, speed));
    this.emitState();
  }

  setDirection(direction: "CENTER" | "DOWN" | "LEFT" | "RIGHT" | "UP"): void {
    this.puppet?.setDirection(direction as any);
    this.status = direction;
    this.drawOverlays();
    this.emitState();
  }

  setLayerAlpha(layerId: string, value: number): void {
    this.puppet?.setLayerAlpha(layerId, value);
    this.emitState();
  }

  setLayerRotation(layerId: string, degrees: number): void {
    this.puppet?.setLayerRotation(layerId, (degrees * Math.PI) / 180);
    this.drawOverlays();
    this.emitState();
  }

  setLayerScale(layerId: string, value: number): void {
    this.puppet?.setLayerScale(layerId, value);
    this.drawOverlays();
    this.emitState();
  }

  setLayerVisible(layerId: string, visible: boolean): void {
    this.puppet?.setLayerVisibility(layerId, visible);
    this.emitState();
  }

  setOverlayVisibility({
    colliders,
    sockets,
  }: {
    colliders?: boolean;
    sockets?: boolean;
  }): void {
    if (typeof colliders === "boolean") this.showColliders = colliders;
    if (typeof sockets === "boolean") this.showSockets = sockets;
    this.drawOverlays();
    this.emitState();
  }

  setPreviewScale(scale: number): void {
    this.previewScale = Math.min(8, Math.max(1, scale));
    this.puppet?.setScale(this.previewScale);
    this.drawOverlays();
    this.emitState();
  }

  setRotationDegrees(degrees: number): void {
    this.previewRotation = Math.min(360, Math.max(-360, degrees));
    this.puppet?.setRotation((this.previewRotation * Math.PI) / 180);
    this.drawOverlays();
    this.emitState();
  }

  setShaderEnabled(enabled: boolean): void {
    this.shaderEnabled = enabled;
    this.applyShaderPipeline();
    this.emitState();
  }

  setStatus(status: string): void {
    this.status = status;
    this.emitState();
  }

  setVectorMode(mode: VectorMode): void {
    this.vectorMode = mode;
    this.game.registry.set("vectorMode", mode);
    const pipeline = (this.cameras.main as any).getPostPipeline(
      "VectorShader",
    ) as unknown;
    const pipelines = Array.isArray(pipeline) ? pipeline : [pipeline];
    pipelines.filter(isVectorShaderPipeline).forEach((shaderPipeline) => {
      shaderPipeline.setColorMode(mode);
    });
    this.emitState();
  }

  stepFrame(direction: number): void {
    this.animationPaused = true;
    this.animationTime = Math.max(
      0,
      this.animationTime + this.frameMs * direction,
    );
    this.puppet?.update(this.animationTime, this.frameMs);
    this.drawOverlays();
    this.emitState();
  }

  update(_time: number, delta: number): void {
    if (this.puppet && !this.animationPaused) {
      const scaledDelta = delta * this.animationSpeed;
      this.animationTime += scaledDelta;
      this.puppet.update(this.animationTime, scaledDelta);
      this.drawOverlays();
    }
  }

  private applyShaderPipeline(): void {
    if (!this.cameras.main) return;
    if (this.shaderEnabled) {
      (this.cameras.main as any).setPostPipeline("VectorShader");
      this.setVectorMode(this.vectorMode);
    } else {
      (this.cameras.main as any).removePostPipeline("VectorShader");
    }
  }

  private drawOverlays(): void {
    if (!this.overlayGraphics || !this.puppet || !this.metadata) return;

    const graphics = this.overlayGraphics;
    graphics.clear();
    graphics.setDepth((this.puppet.depth ?? 0) + 10);
    graphics.setPosition(this.puppet.x, this.puppet.y);
    graphics.setScale(this.previewScale);
    graphics.setRotation((this.previewRotation * Math.PI) / 180);

    const offX = -(this.metadata.viewBox.x + this.metadata.viewBox.width / 2);
    const offY = -(this.metadata.viewBox.y + this.metadata.viewBox.height / 2);

    if (this.showColliders) {
      graphics.lineStyle(1 / this.previewScale, 0xff4fd8, 0.95);
      this.forEachLayer(this.metadata.layers, (layer) => {
        if (!layer.physics) return;
        if (layer.physics.shape === "circle") {
          graphics.strokeCircle(
            offX + (layer.cx ?? 0),
            offY + (layer.cy ?? 0),
            layer.physics.radius ?? layer.r ?? 0,
          );
        } else {
          graphics.strokeRect(
            offX + (layer.x ?? 0),
            offY + (layer.y ?? 0),
            layer.physics.width ?? layer.width ?? 0,
            layer.physics.height ?? layer.height ?? 0,
          );
        }
      });
    }

    if (this.showSockets) {
      graphics.lineStyle(1 / this.previewScale, 0x66ffff, 1);
      graphics.fillStyle(0x061014, 0.9);
      this.metadata.sockets.forEach((socket) => {
        const x = offX + socket.x;
        const y = offY + socket.y;
        graphics.fillCircle(x, y, 3 / this.previewScale);
        graphics.strokeCircle(x, y, 5 / this.previewScale);
        graphics.lineBetween(
          x - 7 / this.previewScale,
          y,
          x + 7 / this.previewScale,
          y,
        );
        graphics.lineBetween(
          x,
          y - 7 / this.previewScale,
          x,
          y + 7 / this.previewScale,
        );
      });
    }
  }

  private emitState(): void {
    this.onStateChange({
      animationPaused: this.animationPaused,
      animationSpeed: this.animationSpeed,
      assetLabel: this.assetLabel,
      colliderCount: countColliders(this.metadata?.layers ?? []),
      layers: flattenLayers(this.metadata?.layers ?? []),
      rotation: this.previewRotation,
      scale: this.previewScale,
      shaderEnabled: this.shaderEnabled,
      socketCount: this.metadata?.sockets.length ?? 0,
      status: this.status,
      unsupportedWarnings: this.unsupportedWarnings,
      vectorMode: this.vectorMode,
    });
  }

  private forEachLayer(
    layers: LayerMetadata[],
    callback: (layer: LayerMetadata) => void,
  ): void {
    layers.forEach((layer) => {
      callback(layer);
      if (layer.children) this.forEachLayer(layer.children, callback);
    });
  }
}

function collectUnsupportedWarnings(svgData: string): string[] {
  const doc = new DOMParser().parseFromString(svgData, "image/svg+xml");
  const unsupported = new Set<string>();
  doc.querySelectorAll("*").forEach((node) => {
    const tag = node.tagName.toLowerCase();
    if (!SUPPORTED_TAGS.has(tag)) unsupported.add(`<${tag}>`);
  });
  return Array.from(unsupported);
}

function countColliders(layers: LayerMetadata[]): number {
  let count = 0;
  for (const layer of layers) {
    if (layer.physics) count += 1;
    if (layer.children) count += countColliders(layer.children);
  }
  return count;
}

function flattenLayers(layers: LayerMetadata[], depth = 0): PreviewLayerInfo[] {
  return layers.flatMap((layer) => [
    {
      depth,
      id: layer.id,
      type: layer.type,
      visible: layer.visible !== false,
    },
    ...flattenLayers(layer.children ?? [], depth + 1),
  ]);
}
