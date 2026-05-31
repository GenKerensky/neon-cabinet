import { Game, Scene, AUTO, WEBGL } from "phaser";
import { VectorPuppet, SVGParser } from "@neon-cabinet/sprite-tools";
import { VectorShader } from "@neon-cabinet/shaders/shaders";

declare const WORKSPACE_ROOT: string;

window.onerror = (msg, _url, _line, _col, error) => {
  const el = document.getElementById("error-display");
  if (el) el.textContent = "Error: " + msg;
  console.error(error);
};

class StudioScene extends Scene {
  private puppet?: VectorPuppet;
  private shaderEnabled = true;
  private previewScale = 4;
  private animationPaused = false;
  private animationSpeed = 1;
  private animationTime = 0;
  private readonly frameMs = 1000 / 60;

  constructor() {
    super("StudioScene");
  }

  preload() {
    const urlParams = new URLSearchParams(window.location.search);
    let assetPath = urlParams.get("asset");

    if (assetPath) {
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
  }

  create() {
    const svgData = this.cache.text.get("preview_svg");
    if (svgData) {
      const metadata = new SVGParser().parse(svgData);

      this.puppet = new VectorPuppet(
        this,
        (this.cameras.main as any).centerX,
        (this.cameras.main as any).centerY,
        metadata,
      );
      this.puppet.setScale(this.previewScale);

      this.updateLayerUI(metadata.layers);
    }

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
    this.bindAnimationControls();
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

  private updateLayerUI(layers: any[], isRoot = true) {
    const container = document.getElementById("layer-toggles");
    if (!container) return;
    if (isRoot) container.innerHTML = "";

    layers.forEach((layer) => {
      const div = document.createElement("div");
      div.style.marginBottom = "2px";
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
      label.style.fontSize = "12px";

      div.appendChild(checkbox);
      div.appendChild(label);
      container.appendChild(div);

      if (layer.children) {
        this.updateLayerUI(layer.children, false);
      }
    });
  }

  update(_time: number, delta: number) {
    if (this.puppet && !this.animationPaused) {
      const scaledDelta = delta * this.animationSpeed;
      this.animationTime += scaledDelta;
      this.puppet.update(this.animationTime, scaledDelta);
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
