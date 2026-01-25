import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { getFontFamily } from "../utils/font";

export class Pause extends Scene {
  constructor() {
    super("Pause");
  }

  create(): void {
    const { width, height } = this.cameras.main;
    const font = getFontFamily(this);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, width, height);

    const pauseText = this.add.text(width / 2, height * 0.35, "PAUSED", {
      fontFamily: font,
      fontSize: "56px",
      color: "#00ff00",
      stroke: "#003300",
      strokeThickness: 3,
    });
    pauseText.setOrigin(0.5);

    const resumeText = this.add.text(
      width / 2,
      height * 0.5,
      "PRESS ESC TO RESUME",
      {
        fontFamily: font,
        fontSize: "20px",
        color: "#ffffff",
      },
    );
    resumeText.setOrigin(0.5);

    this.tweens.add({
      targets: resumeText,
      alpha: 0.4,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    this.add
      .text(width / 2, height * 0.58, "PRESS Q TO QUIT", {
        fontFamily: font,
        fontSize: "16px",
        color: "#888888",
      })
      .setOrigin(0.5);

    this.input.keyboard?.once("keydown-ESC", () => {
      this.scene.resume("Game");
      this.scene.stop();
    });

    this.input.keyboard?.once("keydown-Q", () => {
      this.scene.stop("Game");
      this.scene.start("Title");
    });

    EventBus.emit("current-scene-ready", this);
  }
}
