import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { getFontFamily } from "../../utils/font";

export class Game extends Scene {
  constructor() {
    super("Game");
  }

  create(): void {
    const { width, height } = this.cameras.main;
    this.cameras.main.setBackgroundColor(0x020107);
    this.cameras.main.setPostPipeline("VectorShader");

    this.add
      .text(width / 2, height / 2, "COCKPIT SYSTEMS ONLINE", {
        fontFamily: getFontFamily(this),
        fontSize: "28px",
        color: "#7be8ff",
      })
      .setOrigin(0.5);

    EventBus.emit("current-scene-ready", this);
  }
}
