import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { getFontFamily } from "../../utils/font";

export class Title extends Scene {
  constructor() {
    super("Title");
  }

  create(): void {
    const { width, height } = this.cameras.main;
    const fontFamily = getFontFamily(this);
    this.cameras.main.setBackgroundColor(0x020107);
    this.cameras.main.setPostPipeline("VectorShader");

    this.add
      .text(width / 2, height * 0.36, "STARFIGHTER ASSAULT", {
        fontFamily,
        fontSize: "56px",
        color: "#ff43d6",
        stroke: "#4d2cff",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.54, "PRESS SPACE OR CLICK TO START", {
        fontFamily,
        fontSize: "22px",
        color: "#7be8ff",
      })
      .setOrigin(0.5);

    const startRun = () => this.scene.start("OpeningCrawl");
    this.input.keyboard?.once("keydown-SPACE", startRun);
    this.input.once("pointerdown", startRun);

    EventBus.emit("current-scene-ready", this);
  }
}
