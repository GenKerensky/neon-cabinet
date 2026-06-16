import { AUTO, Game, Scene, WEBGL } from "phaser";
import { VectorMode, VectorShader } from "@neon-cabinet/shaders/shaders";
import type {
  WireSidecarStatus,
  WireframePreviewModel,
} from "../assets/wire-sidecar";
import {
  advanceAutoOrbit,
  clamp,
  createInitialPreviewState,
  normalizeDegrees,
  zoomPreviewState,
  type WireframePreviewState,
} from "./wireframe-preview-state";
import { WireframeRenderer } from "./wireframe-renderer";

export interface PreviewModelInput {
  assetLabel: string;
  model: WireframePreviewModel;
  sidecarStatus: WireSidecarStatus;
  sourcePath: string;
  warnings: string[];
}

export interface WireframePreviewControllerOptions {
  container: HTMLElement;
  onStateChange(state: WireframePreviewState): void;
}

export class WireframePreviewController {
  private readonly game: Game;
  private readonly scene: WireframeStudioScene;

  constructor({ container, onStateChange }: WireframePreviewControllerOptions) {
    this.scene = new WireframeStudioScene(onStateChange);
    this.game = new Game({
      type: AUTO,
      width: container.clientWidth || window.innerWidth,
      height: container.clientHeight || window.innerHeight,
      parent: container,
      backgroundColor: "#020107",
      scene: this.scene,
      callbacks: {
        postBoot: (game: Game) => {
          if (game.renderer.type === WEBGL) {
            (game.renderer as any).pipelines.addPostPipeline(
              "VectorShader",
              VectorShader,
            );
          }
        },
      },
    });
  }

  clearModel(): void {
    this.scene.clearModel();
  }

  previewModel(input: PreviewModelInput): void {
    this.scene.previewModel(input);
  }

  resetCamera(): void {
    this.scene.resetCamera();
  }

  setAutoOrbit(enabled: boolean): void {
    this.scene.setAutoOrbit(enabled);
  }

  setAxesEnabled(enabled: boolean): void {
    this.scene.setAxesEnabled(enabled);
  }

  setEdgeColorsEnabled(enabled: boolean): void {
    this.scene.setEdgeColorsEnabled(enabled);
  }

  setGridEnabled(enabled: boolean): void {
    this.scene.setGridEnabled(enabled);
  }

  setShaderEnabled(enabled: boolean): void {
    this.scene.setShaderEnabled(enabled);
  }

  setZoomDistance(distance: number): void {
    this.scene.setZoomDistance(distance);
  }

  destroy(): void {
    this.game.destroy(true);
  }
}

class WireframeStudioScene extends Scene {
  private isDragging = false;
  private lastPointer?: { x: number; y: number };
  private model?: WireframePreviewModel;
  private overlay?: Phaser.GameObjects.Graphics;
  private renderer?: WireframeRenderer;
  private state = createInitialPreviewState();
  private vectorMode = VectorMode.COLOR;

  constructor(
    private readonly onStateChange: (state: WireframePreviewState) => void,
  ) {
    super("WireframeStudioScene");
  }

  create(): void {
    this.overlay = this.add.graphics();
    this.renderer = new WireframeRenderer(this);
    this.overlay.setDepth(5);
    this.game.registry.set("vectorMode", this.vectorMode);
    this.applyShaderPipeline();
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.isDragging = true;
      this.lastPointer = { x: pointer.x, y: pointer.y };
    });
    this.input.on("pointerup", () => {
      this.isDragging = false;
      this.lastPointer = undefined;
    });
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging || !this.lastPointer) return;
      const dx = pointer.x - this.lastPointer.x;
      const dy = pointer.y - this.lastPointer.y;
      this.lastPointer = { x: pointer.x, y: pointer.y };
      this.state = {
        ...this.state,
        pitch: clamp(this.state.pitch - dy * 0.18, -78, 78),
        yaw: normalizeDegrees(this.state.yaw + dx * 0.22),
      };
      this.emitState();
    });
    this.input.on(
      "wheel",
      (
        _pointer: Phaser.Input.Pointer,
        _gameObjects: unknown[],
        _deltaX: number,
        deltaY: number,
      ) => {
        this.state = zoomPreviewState(this.state, deltaY * 0.18);
        this.emitState();
      },
    );
    this.emitState();
  }

  update(_time: number, delta: number): void {
    this.state = advanceAutoOrbit(this.state, delta, this.isDragging);
    this.renderPreview();
    this.emitState();
  }

  clearModel(): void {
    this.model = undefined;
    this.state = createInitialPreviewState();
    this.renderer?.clear();
    this.overlay?.clear();
    this.emitState();
  }

  previewModel(input: PreviewModelInput): void {
    this.model = input.model;
    this.state = {
      ...createInitialPreviewState(input.model),
      assetLabel: input.assetLabel,
      sidecarStatus: input.sidecarStatus,
      sourcePath: input.sourcePath,
      status: "LOADED",
      warnings: input.warnings,
    };
    this.renderPreview();
    this.emitState();
  }

  resetCamera(): void {
    if (!this.model) return;
    this.state = {
      ...this.state,
      pitch: -12,
      yaw: 35,
      zoomDistance: this.state.bounds.framingDistance,
    };
    this.emitState();
  }

  setAutoOrbit(enabled: boolean): void {
    this.state = { ...this.state, autoOrbit: enabled };
    this.emitState();
  }

  setAxesEnabled(enabled: boolean): void {
    this.state = { ...this.state, axesEnabled: enabled };
    this.emitState();
  }

  setEdgeColorsEnabled(enabled: boolean): void {
    this.state = { ...this.state, edgeColorsEnabled: enabled };
    this.emitState();
  }

  setGridEnabled(enabled: boolean): void {
    this.state = { ...this.state, gridEnabled: enabled };
    this.emitState();
  }

  setShaderEnabled(enabled: boolean): void {
    this.state = { ...this.state, shaderEnabled: enabled };
    this.applyShaderPipeline();
    this.emitState();
  }

  setZoomDistance(distance: number): void {
    this.state = {
      ...this.state,
      zoomDistance: clamp(
        distance,
        this.state.minZoomDistance,
        this.state.maxZoomDistance,
      ),
    };
    this.emitState();
  }

  private renderPreview(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    this.renderer?.clear();
    this.overlay?.clear();
    if (this.state.gridEnabled) this.drawGrid(width, height);
    if (this.state.axesEnabled) this.drawAxes(width, height);
    if (!this.model || !this.renderer) return;
    this.renderer.render(
      this.model,
      this.state.bounds,
      this.state,
      width,
      height,
    );
  }

  private drawGrid(width: number, height: number): void {
    if (!this.overlay) return;
    this.overlay.lineStyle(1, 0x12304c, 0.35);
    for (let x = 0; x <= width; x += 40)
      this.overlay.lineBetween(x, 0, x, height);
    for (let y = 0; y <= height; y += 40)
      this.overlay.lineBetween(0, y, width, y);
  }

  private drawAxes(width: number, height: number): void {
    if (!this.overlay) return;
    const cx = width / 2;
    const cy = height / 2;
    this.overlay.lineStyle(1, 0xff43d6, 0.45);
    this.overlay.lineBetween(cx - 42, cy, cx + 42, cy);
    this.overlay.lineStyle(1, 0x7be8ff, 0.45);
    this.overlay.lineBetween(cx, cy - 42, cx, cy + 42);
  }

  private applyShaderPipeline(): void {
    if (!this.cameras.main) return;
    if (this.state.shaderEnabled) {
      (this.cameras.main as any).setPostPipeline("VectorShader");
      this.game.registry.set("vectorMode", this.vectorMode);
      const pipeline = (this.cameras.main as any).getPostPipeline(
        "VectorShader",
      ) as unknown;
      const pipelines = Array.isArray(pipeline) ? pipeline : [pipeline];
      for (const shaderPipeline of pipelines) {
        if (
          shaderPipeline &&
          typeof shaderPipeline === "object" &&
          "setColorMode" in shaderPipeline &&
          typeof (shaderPipeline as { setColorMode(mode: VectorMode): void })
            .setColorMode === "function"
        ) {
          (
            shaderPipeline as { setColorMode(mode: VectorMode): void }
          ).setColorMode(this.vectorMode);
        }
      }
    } else {
      (this.cameras.main as any).removePostPipeline("VectorShader");
    }
  }

  private emitState(): void {
    this.onStateChange({ ...this.state });
  }
}
