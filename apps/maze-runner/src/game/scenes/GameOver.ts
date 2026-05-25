import { Scene } from "phaser";
import { EventBus } from "../EventBus";

export class GameOver extends Scene {
  private finalScore = 0;

  constructor() {
    super("GameOver");
  }

  init(args: { score: number }): void {
    if (args && args.score) {
      this.finalScore = args.score;
    }
  }

  create(): void {
    this.cameras.main.setPostPipeline("VectorShader");
    const { width, height } = this.cameras.main;
    const fontFamily =
      (this.registry.get("fontFamily") as string) ?? "Orbitron";

    // Overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);

    // Game Over title
    const title = this.add
      .text(width / 2, height * 0.25, "GAME OVER", {
        fontFamily,
        fontSize: "48px",
        color: "#ff0000",
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: title,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Score
    this.add
      .text(width / 2, height * 0.4, `FINAL SCORE: ${this.finalScore}`, {
        fontFamily,
        fontSize: "24px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // High score
    const highScore = (this.registry.get("highScore") as number) ?? 0;
    if (this.finalScore > highScore) {
      this.registry.set("highScore", this.finalScore);
      this.add
        .text(width / 2, height * 0.5, "NEW HIGH SCORE!", {
          fontFamily,
          fontSize: "18px",
          color: "#ffff00",
        })
        .setOrigin(0.5);
    } else {
      this.add
        .text(width / 2, height * 0.5, `HIGH SCORE: ${highScore}`, {
          fontFamily,
          fontSize: "18px",
          color: "#aaaaaa",
        })
        .setOrigin(0.5);
    }

    // Restart prompt
    const restartText = this.add
      .text(width / 2, height * 0.65, "PRESS SPACE TO RESTART", {
        fontFamily,
        fontSize: "18px",
        color: "#00ffff",
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: restartText,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // Menu prompt
    this.add
      .text(width / 2, height * 0.75, "PRESS M FOR MENU", {
        fontFamily,
        fontSize: "14px",
        color: "#888888",
      })
      .setOrigin(0.5);

    // Key listeners
    this.input.keyboard?.on("keydown-SPACE", () => {
      this.registry.set("highScore", Math.max(this.finalScore, highScore));
      this.scene.stop("Game");
      this.scene.stop("GameOver");
      this.scene.start("Game");
    });

    this.input.keyboard?.on("keydown-M", () => {
      this.scene.stop("Game");
      this.scene.stop("GameOver");
      this.scene.start("Title");
    });

    EventBus.emit("current-scene-ready", this);
  }
}
