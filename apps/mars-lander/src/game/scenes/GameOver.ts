import { Display, Scene } from "phaser";
import type { Types } from "phaser";
import { EventBus } from "../EventBus";
import { getFontFamily } from "../utils/font";

export class GameOver extends Scene {
  private score: number = 0;
  private level: number = 1;
  private crashReason: string = "";

  constructor() {
    super("GameOver");
  }

  init(data: { score: number; level: number; crashReason?: string }): void {
    this.score = data.score ?? 0;
    this.level = data.level ?? 1;
    this.crashReason = data.crashReason ?? "";
  }

  create(): void {
    const { width, height } = this.cameras.main;
    const font = getFontFamily(this);

    // Apply vector shader
    this.cameras.main.setPostPipeline("VectorShader");

    // Dark background with atmosphere
    this.createBackground();

    // Game Over text
    const gameOverText = this.add.text(width / 2, height * 0.2, "GAME OVER", {
      fontFamily: font,
      fontSize: "64px",
      color: "#ff3300",
      stroke: "#660000",
      strokeThickness: 3,
    });
    gameOverText.setOrigin(0.5);

    // Crash reason
    if (this.crashReason) {
      this.add
        .text(width / 2, height * 0.32, this.crashReason, {
          fontFamily: font,
          fontSize: "24px",
          fontStyle: "bold",
          color: "#ff6666",
        })
        .setOrigin(0.5);
    }

    // Stats
    const statsStyle: Types.GameObjects.Text.TextStyle = {
      fontFamily: font,
      fontSize: "24px",
      color: "#ffffff",
      align: "center",
    };

    this.add
      .text(width / 2, height * 0.45, `FINAL SCORE: ${this.score}`, statsStyle)
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.52, `LEVEL REACHED: ${this.level}`, {
        ...statsStyle,
        fontSize: "20px",
        color: "#ff6600",
      })
      .setOrigin(0.5);

    // High score
    const highScore = localStorage.getItem("marsLanderHighScore") || "0";
    const isNewHighScore = this.score >= parseInt(highScore);

    if (isNewHighScore && this.score > 0) {
      const newHighText = this.add.text(
        width / 2,
        height * 0.6,
        "NEW HIGH SCORE!",
        {
          fontFamily: font,
          fontSize: "28px",
          color: "#00ff00",
        },
      );
      newHighText.setOrigin(0.5);

      this.tweens.add({
        targets: newHighText,
        alpha: 0.5,
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    } else {
      this.add
        .text(width / 2, height * 0.6, `HIGH SCORE: ${highScore}`, {
          fontFamily: font,
          fontSize: "20px",
          color: "#888888",
        })
        .setOrigin(0.5);
    }

    // Restart prompt
    const restartText = this.add.text(
      width / 2,
      height * 0.75,
      "PRESS SPACE TO TRY AGAIN",
      {
        fontFamily: font,
        fontSize: "20px",
        color: "#ffffff",
      },
    );
    restartText.setOrigin(0.5);

    this.tweens.add({
      targets: restartText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Menu prompt
    this.add
      .text(width / 2, height * 0.82, "PRESS ESC FOR MENU", {
        fontFamily: font,
        fontSize: "16px",
        color: "#666666",
      })
      .setOrigin(0.5);

    // Input
    this.input.keyboard?.once("keydown-SPACE", () => {
      this.scene.start("Game");
    });

    this.input.keyboard?.once("keydown-ESC", () => {
      this.scene.start("Title");
    });

    this.input.once("pointerdown", () => {
      this.scene.start("Game");
    });

    EventBus.emit("current-scene-ready", this);
  }

  private createBackground(): void {
    const { width, height } = this.cameras.main;
    const graphics = this.add.graphics();

    // Dark gradient
    const steps = 20;
    for (let i = 0; i < steps; i++) {
      const y = (height / steps) * i;
      const h = height / steps + 1;
      const progress = i / steps;
      const r = Math.floor(progress * progress * 30);
      const g = Math.floor(progress * progress * 10);
      const b = Math.floor(progress * progress * 5);
      const color = Display.Color.GetColor(r, g, b);
      graphics.fillStyle(color, 1);
      graphics.fillRect(0, y, width, h);
    }

    graphics.setDepth(-1);
  }
}
