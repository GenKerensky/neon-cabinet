import Phaser, { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { getFontFamily } from "../utils/font";

export class GameOver extends Scene {
  private score: number = 0;

  constructor() {
    super("GameOver");
  }

  init(data: { score?: number }): void {
    this.score = data.score ?? 0;
  }

  create(): void {
    const { width, height } = this.cameras.main;
    const font = getFontFamily(this);

    this.cameras.main.setPostPipeline("VectorShader");

    this.createBackground();

    const gameOverText = this.add.text(width / 2, height * 0.25, "GAME OVER", {
      fontFamily: font,
      fontSize: "64px",
      color: "#ff3300",
      stroke: "#660000",
      strokeThickness: 3,
    });
    gameOverText.setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.45, `FINAL SCORE: ${this.score}`, {
        fontFamily: font,
        fontSize: "24px",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);

    const highScore = localStorage.getItem("battleTanksHighScore") || "0";
    const isNewHighScore = this.score > parseInt(highScore);

    if (isNewHighScore && this.score > 0) {
      localStorage.setItem("battleTanksHighScore", this.score.toString());

      const newHighText = this.add.text(
        width / 2,
        height * 0.55,
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
        .text(width / 2, height * 0.55, `HIGH SCORE: ${highScore}`, {
          fontFamily: font,
          fontSize: "20px",
          color: "#888888",
        })
        .setOrigin(0.5);
    }

    const restartText = this.add.text(
      width / 2,
      height * 0.72,
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

    this.add
      .text(width / 2, height * 0.8, "PRESS ESC FOR MENU", {
        fontFamily: font,
        fontSize: "16px",
        color: "#666666",
      })
      .setOrigin(0.5);

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

    const steps = 20;
    for (let i = 0; i < steps; i++) {
      const y = (height / steps) * i;
      const h = height / steps + 1;
      const progress = i / steps;
      const r = Math.floor(progress * progress * 20);
      const g = Math.floor(progress * progress * 15);
      const b = Math.floor(progress * progress * 5);
      const color = Phaser.Display.Color.GetColor(r, g, b);
      graphics.fillStyle(color, 1);
      graphics.fillRect(0, y, width, h);
    }

    graphics.setDepth(-1);
  }
}
