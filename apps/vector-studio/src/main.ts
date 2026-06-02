import { Game, Scene, AUTO, WEBGL } from "phaser";
import type { GameObjects } from "phaser";
import { VectorPuppet, SVGParser } from "@neon-cabinet/sprite-tools";
import type {
  LayerMetadata,
  SVGPuppetMetadata,
} from "@neon-cabinet/sprite-tools";
import { VectorMode, VectorShader } from "@neon-cabinet/shaders/shaders";

declare const WORKSPACE_ROOT: string;

const BUILT_IN_ASSETS = [
  {
    label: "Space Defender Ship",
    value: "/space-defender-assets/vector/ship.svg",
  },
  {
    label: "Autocannon Bullet",
    value: "/space-defender-assets/vector/bullet.svg",
  },
  {
    label: "Guided Missile",
    value: "/space-defender-assets/vector/missile.svg",
  },
  {
    label: "Thruster Flame",
    value: "/space-defender-assets/vector/thruster-flame.svg",
  },
  {
    label: "Muzzle Flash",
    value: "/space-defender-assets/vector/muzzle-flash.svg",
  },
  {
    label: "Life Icon",
    value: "/space-defender-assets/vector/life-icon.svg",
  },
  {
    label: "Maze Runner Player",
    value: "apps/maze-runner/public/assets/vector/player.svg",
  },
];

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

window.onerror = (msg, _url, _line, _col, error) => {
  const el = document.getElementById("error-display");
  if (el) el.textContent = "Error: " + msg;
  console.error(error);
};

class StudioScene extends Scene {
  private puppet?: VectorPuppet;
  private metadata?: SVGPuppetMetadata;
  private overlayGraphics?: GameObjects.Graphics;
  private svgData = "";
  private shaderEnabled = true;
  private vectorMode = VectorMode.COLOR;
  private previewScale = 4;
  private previewRotation = 0;
  private animationPaused = false;
  private animationSpeed = 1;
  private animationTime = 0;
  private readonly frameMs = 1000 / 60;

  constructor() {
    super("StudioScene");
  }

  preload() {
    const urlParams = new URLSearchParams(window.location.search);
    let assetPath = urlParams.get("asset") || BUILT_IN_ASSETS[0].value;

    const el = document.getElementById("asset-path");
    if (el) el.textContent = assetPath;

    if (
      !assetPath.startsWith("/") &&
      !assetPath.startsWith(".") &&
      !assetPath.startsWith("http")
    ) {
      assetPath = `/@fs${WORKSPACE_ROOT}/${assetPath}`;
    }

    this.load.text("preview_svg", assetPath + "?cb=" + Date.now());
  }

  create() {
    this.populateAssetSelect();

    this.svgData = this.cache.text.get("preview_svg");
    if (this.svgData) {
      this.metadata = new SVGParser().parse(this.svgData);

      this.puppet = new VectorPuppet(
        this,
        (this.cameras.main as any).centerX,
        (this.cameras.main as any).centerY,
        this.metadata,
      );
      this.puppet.setScale(this.previewScale);
      this.puppet.setRotation(this.previewRotation);

      this.overlayGraphics = this.add.graphics();
      this.updateLayerUI(this.metadata.layers);
      this.updateUnsupportedWarnings(this.svgData);
      this.drawOverlays();
    }

    this.game.registry.set("vectorMode", this.vectorMode);
    if (this.shaderEnabled) {
      (this.cameras.main as any).setPostPipeline("VectorShader");
    }

    document
      .getElementById("reload-btn")
      ?.addEventListener("click", () => window.location.reload());
    document
      .getElementById("toggle-shader-btn")
      ?.addEventListener("click", () => {
        this.shaderEnabled = !this.shaderEnabled;
        if (this.shaderEnabled) {
          (this.cameras.main as any).setPostPipeline("VectorShader");
        } else {
          (this.cameras.main as any).removePostPipeline("VectorShader");
        }
      });
    document
      .getElementById("shader-color-btn")
      ?.addEventListener("click", () => this.setVectorMode(VectorMode.COLOR));
    document
      .getElementById("shader-mono-btn")
      ?.addEventListener("click", () =>
        this.setVectorMode(VectorMode.MONOCHROME),
      );
    document
      .getElementById("socket-overlay-control")
      ?.addEventListener("change", () => this.drawOverlays());
    document
      .getElementById("collider-overlay-control")
      ?.addEventListener("change", () => this.drawOverlays());

    document.querySelectorAll(".dir-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const dir = (e.target as HTMLButtonElement).dataset.dir;
        if (this.puppet && dir) {
          this.puppet.setDirection(dir as any);
          document
            .querySelectorAll(".dir-btn")
            .forEach((button) => button.classList.remove("is-active"));
          (e.target as HTMLButtonElement).classList.add("is-active");
        }
      });
    });

    this.bindScaleControls();
    this.bindRotationControls();
    this.bindAnimationControls();
  }

  private populateAssetSelect() {
    const select = document.getElementById(
      "asset-select",
    ) as HTMLSelectElement | null;
    if (!select) return;

    const urlParams = new URLSearchParams(window.location.search);
    const selected = urlParams.get("asset") || BUILT_IN_ASSETS[0].value;
    select.innerHTML = BUILT_IN_ASSETS.map(
      (asset) =>
        `<option value="${asset.value}" ${
          asset.value === selected ? "selected" : ""
        }>${asset.label}</option>`,
    ).join("");
    select.value = selected;
    select.addEventListener("change", () => {
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set("asset", select.value);
      window.location.href = nextUrl.toString();
    });
  }

  private bindScaleControls() {
    const scaleControl = document.getElementById(
      "scale-control",
    ) as HTMLInputElement | null;
    const scaleValue = document.getElementById("scale-value");
    const scaleDownBtn = document.getElementById("scale-down-btn");
    const scaleResetBtn = document.getElementById("scale-reset-btn");
    const scaleUpBtn = document.getElementById("scale-up-btn");

    const applyScale = (value: number) => {
      this.previewScale = Math.min(8, Math.max(1, value));
      if (scaleControl) scaleControl.value = this.previewScale.toString();
      if (scaleValue)
        scaleValue.textContent = this.previewScale
          .toFixed(2)
          .replace(/\.00$/, ".0");
      this.puppet?.setScale(this.previewScale);
      this.drawOverlays();
    };

    applyScale(this.previewScale);

    scaleControl?.addEventListener("input", () =>
      applyScale(Number(scaleControl.value)),
    );
    scaleDownBtn?.addEventListener("click", () =>
      applyScale(this.previewScale - 0.25),
    );
    scaleResetBtn?.addEventListener("click", () => applyScale(4));
    scaleUpBtn?.addEventListener("click", () =>
      applyScale(this.previewScale + 0.25),
    );
  }

  private bindRotationControls() {
    const rotationControl = document.getElementById(
      "rotation-control",
    ) as HTMLInputElement | null;
    const rotationInput = document.getElementById(
      "rotation-input",
    ) as HTMLInputElement | null;
    const rotationValue = document.getElementById("rotation-value");

    const applyRotation = (degrees: number) => {
      this.previewRotation = Math.min(360, Math.max(-360, degrees));
      if (rotationControl) rotationControl.value = String(this.previewRotation);
      if (rotationInput) rotationInput.value = String(this.previewRotation);
      if (rotationValue)
        rotationValue.textContent = `${this.previewRotation}deg`;
      this.puppet?.setRotation((this.previewRotation * Math.PI) / 180);
      this.drawOverlays();
    };

    applyRotation(0);

    rotationControl?.addEventListener("input", () =>
      applyRotation(Number(rotationControl.value)),
    );
    rotationInput?.addEventListener("input", () =>
      applyRotation(Number(rotationInput.value)),
    );
  }

  private bindAnimationControls() {
    const playPauseBtn = document.getElementById("play-pause-btn");
    const slowDownBtn = document.getElementById("slow-down-btn");
    const speedUpBtn = document.getElementById("speed-up-btn");
    const prevFrameBtn = document.getElementById("prev-frame-btn");
    const nextFrameBtn = document.getElementById("next-frame-btn");
    const speedValue = document.getElementById("animation-speed-value");

    const syncTransportUI = () => {
      if (speedValue) speedValue.textContent = this.animationSpeed.toFixed(2);
      if (playPauseBtn) {
        playPauseBtn.textContent = this.animationPaused ? "▶" : "⏸";
        playPauseBtn.classList.toggle("is-active", !this.animationPaused);
      }
    };

    const applySpeed = (speed: number) => {
      this.animationSpeed = Math.min(4, Math.max(0.25, speed));
      syncTransportUI();
    };

    const stepFrame = (direction: number) => {
      this.animationPaused = true;
      this.animationTime = Math.max(
        0,
        this.animationTime + this.frameMs * direction,
      );
      this.puppet?.update(this.animationTime, this.frameMs);
      syncTransportUI();
    };

    syncTransportUI();

    playPauseBtn?.addEventListener("click", () => {
      this.animationPaused = !this.animationPaused;
      syncTransportUI();
    });
    slowDownBtn?.addEventListener("click", () =>
      applySpeed(this.animationSpeed - 0.25),
    );
    speedUpBtn?.addEventListener("click", () =>
      applySpeed(this.animationSpeed + 0.25),
    );
    prevFrameBtn?.addEventListener("click", () => stepFrame(-1));
    nextFrameBtn?.addEventListener("click", () => stepFrame(1));
  }

  private updateLayerUI(layers: LayerMetadata[], isRoot = true) {
    const container = document.getElementById("layer-toggles");
    if (!container) return;
    if (isRoot) container.innerHTML = "";

    layers.forEach((layer) => {
      const div = document.createElement("div");
      div.className = "layer-control-row";
      if (!isRoot) div.style.marginLeft = "15px";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = layer.visible !== false;
      checkbox.id = `toggle-${layer.id}`;
      checkbox.addEventListener("change", (e) => {
        this.puppet?.setLayerVisibility(
          layer.id,
          (e.target as HTMLInputElement).checked,
        );
      });

      const label = document.createElement("label");
      label.htmlFor = checkbox.id;
      label.textContent = ` ${layer.id} (${layer.type})`;

      div.appendChild(checkbox);
      div.appendChild(label);
      div.appendChild(
        this.createLayerRange(
          "alpha",
          0,
          1,
          0.05,
          layer.opacity ?? 1,
          (value) => this.puppet?.setLayerAlpha(layer.id, value),
        ),
      );
      div.appendChild(
        this.createLayerRange("scale", 0.2, 2, 0.05, 1, (value) =>
          this.puppet?.setLayerScale(layer.id, value),
        ),
      );
      div.appendChild(
        this.createLayerRange("rotate", -180, 180, 1, 0, (value) =>
          this.puppet?.setLayerRotation(layer.id, (value * Math.PI) / 180),
        ),
      );
      container.appendChild(div);

      if (layer.children) {
        this.updateLayerUI(layer.children, false);
      }
    });
  }

  private createLayerRange(
    label: string,
    min: number,
    max: number,
    step: number,
    value: number,
    onInput: (value: number) => void,
  ): HTMLElement {
    const wrapper = document.createElement("label");
    wrapper.className = "layer-range";
    const span = document.createElement("span");
    span.textContent = label;
    const input = document.createElement("input");
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(value);
    input.addEventListener("input", () => onInput(Number(input.value)));
    wrapper.append(span, input);
    return wrapper;
  }

  private updateUnsupportedWarnings(svgData: string) {
    const display = document.getElementById("unsupported-warnings");
    if (!display) return;
    const doc = new DOMParser().parseFromString(svgData, "image/svg+xml");
    const unsupported = new Set<string>();
    doc.querySelectorAll("*").forEach((node) => {
      const tag = node.tagName.toLowerCase();
      if (!SUPPORTED_TAGS.has(tag)) unsupported.add(`<${tag}>`);
    });
    display.textContent =
      unsupported.size === 0
        ? "No unsupported SVG elements detected."
        : `Unsupported: ${Array.from(unsupported).join(", ")}`;
  }

  private setVectorMode(mode: VectorMode) {
    this.vectorMode = mode;
    this.game.registry.set("vectorMode", mode);
    document
      .getElementById("shader-color-btn")
      ?.classList.toggle("is-active", mode === VectorMode.COLOR);
    document
      .getElementById("shader-mono-btn")
      ?.classList.toggle("is-active", mode === VectorMode.MONOCHROME);
    const pipeline = (this.cameras.main as any).getPostPipeline(
      "VectorShader",
    ) as VectorShader | undefined;
    pipeline?.setColorMode(mode);
  }

  private drawOverlays() {
    if (!this.overlayGraphics || !this.puppet || !this.metadata) return;

    const showSockets = (
      document.getElementById(
        "socket-overlay-control",
      ) as HTMLInputElement | null
    )?.checked;
    const showColliders = (
      document.getElementById(
        "collider-overlay-control",
      ) as HTMLInputElement | null
    )?.checked;

    const graphics = this.overlayGraphics;
    graphics.clear();
    graphics.setDepth((this.puppet.depth ?? 0) + 10);
    graphics.setPosition(this.puppet.x, this.puppet.y);
    graphics.setScale(this.previewScale);
    graphics.setRotation((this.previewRotation * Math.PI) / 180);

    const offX = -(this.metadata.viewBox.x + this.metadata.viewBox.width / 2);
    const offY = -(this.metadata.viewBox.y + this.metadata.viewBox.height / 2);

    if (showColliders) {
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

    if (showSockets) {
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

  private forEachLayer(
    layers: LayerMetadata[],
    callback: (layer: LayerMetadata) => void,
  ) {
    layers.forEach((layer) => {
      callback(layer);
      if (layer.children) this.forEachLayer(layer.children, callback);
    });
  }

  update(_time: number, delta: number) {
    if (this.puppet && !this.animationPaused) {
      const scaledDelta = delta * this.animationSpeed;
      this.animationTime += scaledDelta;
      this.puppet.update(this.animationTime, scaledDelta);
      this.drawOverlays();
    }
  }
}

const config: any = {
  type: AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: "game-container",
  backgroundColor: "#000000",
  scene: StudioScene,
  physics: {
    default: "arcade",
    arcade: { debug: true },
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
};

const game = new Game(config);
(window as any).phaserGame = game;
(window as any).PhaserBridge = { VectorPuppet, SVGParser };
