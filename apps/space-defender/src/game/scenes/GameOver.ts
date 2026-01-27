import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { getFontFamily } from "../utils/font";

export class GameOver extends Scene {
  private score: number = 0;
  private isNewHighScore: boolean = false;

  constructor() {
    super("GameOver");
  }

  init(data: { score: number }): void {
    this.score = data.score || 0;

    // Check and update high score
    const currentHighScore = parseInt(
      localStorage.getItem("spaceDefenderHighScore") || "0",
      10,
    );
    if (this.score > currentHighScore) {
      localStorage.setItem("spaceDefenderHighScore", this.score.toString());
      this.isNewHighScore = true;
    } else {
      this.isNewHighScore = false;
    }
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x000000);
    // Color mode will be set automatically in onPreRender from registry
    this.cameras.main.setPostPipeline("VectorShader");

    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    const font = getFontFamily(this);

    const title = this.add.text(centerX, centerY - 100, "GAME OVER", {
      fontFamily: font,
      fontSize: "56px",
      color: "#ffffff",
      stroke: "#444444",
      strokeThickness: 2,
    });
    title.setOrigin(0.5);

    // Score display
    const scoreText = this.add.text(
      centerX,
      centerY - 10,
      `FINAL SCORE: ${this.score}`,
      {
        fontFamily: font,
        fontSize: "28px",
        color: "#ffffff",
      },
    );
    scoreText.setOrigin(0.5);

    // New high score notification
    if (this.isNewHighScore) {
      const highScoreText = this.add.text(
        centerX,
        centerY + 30,
        "★ NEW HIGH SCORE ★",
        {
          fontFamily: font,
          fontSize: "20px",
          color: "#ffffff",
        },
      );
      highScoreText.setOrigin(0.5);

      this.tweens.add({
        targets: highScoreText,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 400,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    // Restart instruction
    const restartText = this.add.text(
      centerX,
      centerY + 80,
      "[ CLICK TO PLAY AGAIN ]",
      {
        fontFamily: font,
        fontSize: "18px",
        color: "#ffffff",
      },
    );
    restartText.setOrigin(0.5);

    // Return to title
    const titleText = this.add.text(
      centerX,
      centerY + 115,
      "[ PRESS ESC FOR TITLE ]",
      {
        fontFamily: font,
        fontSize: "14px",
        color: "#666666",
      },
    );
    titleText.setOrigin(0.5);

    // Blink effect on restart text
    this.tweens.add({
      targets: restartText,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // Click to restart
    this.input.once("pointerdown", () => {
      this.cameras.main.fade(300, 0, 0, 0);
      this.time.delayedCall(300, () => {
        this.scene.start("Game");
      });
    });

    // Also allow spacebar to restart
    this.input.keyboard?.once("keydown-SPACE", () => {
      this.cameras.main.fade(300, 0, 0, 0);
      this.time.delayedCall(300, () => {
        this.scene.start("Game");
      });
    });

    // ESC to return to title
    this.input.keyboard?.once("keydown-ESC", () => {
      this.cameras.main.fade(300, 0, 0, 0);
      this.time.delayedCall(300, () => {
        this.scene.start("Title");
      });
    });

    // Fade in
    this.cameras.main.fadeIn(500);

    // Emit event for React bridge
    EventBus.emit("current-scene-ready", this);
  }
}
