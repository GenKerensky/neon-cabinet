import { Scene } from "phaser";
import { EventBus } from "../EventBus";

export class Title extends Scene {
  constructor() {
    super("Title");
  }

  create(): void {
    this.cameras.main.setPostPipeline("VectorShader");
    const { width, height } = this.cameras.main;
    const fontFamily =
      (this.registry.get("fontFamily") as string) ?? "Orbitron";

    // Animated title
    const title = this.add
      .text(width / 2, height * 0.3, "MAZE RUNNER", {
        fontFamily,
        fontSize: "48px",
        color: "#00ffff",
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: title,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    // Subtitle
    this.add
      .text(width / 2, height * 0.42, "NEON CABINET", {
        fontFamily,
        fontSize: "16px",
        color: "#888888",
      })
      .setOrigin(0.5);

    // Start prompt
    const prompt = this.add
      .text(width / 2, height * 0.65, "PRESS SPACE TO START", {
        fontFamily,
        fontSize: "20px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // Controls info
    this.add
      .text(width / 2, height * 0.82, "ARROW KEYS / WASD - MOVE", {
        fontFamily,
        fontSize: "14px",
        color: "#666666",
      })
      .setOrigin(0.5);

    // Key listener
    this.input.keyboard?.on("keydown-SPACE", () => {
      this.scene.start("Game");
      EventBus.emit("current-scene-ready", this);
    });

    EventBus.emit("current-scene-ready", this);
  }
}
