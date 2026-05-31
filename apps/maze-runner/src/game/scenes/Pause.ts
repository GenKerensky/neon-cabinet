import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { VectorMode } from "../utils/settings";
import {
  fadeInScene,
  resumeSceneWithFade,
  startSceneWithFade,
} from "../utils/sceneTransitions";

export class Pause extends Scene {
  constructor() {
    super("Pause");
  }

  create(): void {
    this.cameras.main.setPostPipeline("VectorShader");
    const { width, height } = this.cameras.main;
    const fontFamily =
      (this.registry.get("fontFamily") as string) ?? "Orbitron";

    // Overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    fadeInScene(this);

    // Title
    this.add
      .text(width / 2, height * 0.3, "PAUSED", {
        fontFamily,
        fontSize: "48px",
        color: "#00ffff",
      })
      .setOrigin(0.5);

    // Resume option
    const resumeText = this.add
      .text(width / 2, height * 0.45, "PRESS ESC TO RESUME", {
        fontFamily,
        fontSize: "20px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: resumeText,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // Vector mode toggle
    const currentMode =
      (this.registry.get("vectorMode") as VectorMode) ?? VectorMode.COLOR;
    const newMode =
      currentMode === VectorMode.COLOR
        ? VectorMode.MONOCHROME
        : VectorMode.COLOR;
    const modeLabel =
      newMode === VectorMode.MONOCHROME ? "MONOCHROME MODE" : "COLOR MODE";

    this.add
      .text(width / 2, height * 0.58, `PRESS V FOR ${modeLabel}`, {
        fontFamily,
        fontSize: "14px",
        color: "#888888",
      })
      .setOrigin(0.5);

    // Quit option
    this.add
      .text(width / 2, height * 0.7, "PRESS Q TO QUIT", {
        fontFamily,
        fontSize: "16px",
        color: "#aaaaaa",
      })
      .setOrigin(0.5);

    // Key listeners
    this.input.keyboard?.on("keydown-ESC", () => {
      resumeSceneWithFade(this, "Game", "Pause");
    });

    this.input.keyboard?.on("keydown-V", () => {
      this.registry.set("vectorMode", newMode);
      EventBus.emit("vector-mode-changed", newMode);
    });

    this.input.keyboard?.on("keydown-Q", () => {
      startSceneWithFade(this, "Title", undefined, {
        stop: ["Game", "Pause"],
      });
    });

    EventBus.emit("current-scene-ready", this);
  }
}
