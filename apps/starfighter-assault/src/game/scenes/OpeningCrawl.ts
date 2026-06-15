import { Input, Scene } from "phaser";
import { CRAWL_DURATION_MS, CRAWL_LINES } from "../config/crawl";
import { EventBus } from "../EventBus";
import { getFontFamily } from "../../utils/font";

export class OpeningCrawl extends Scene {
  private hasAdvanced = false;

  constructor() {
    super("OpeningCrawl");
  }

  create(): void {
    const { width, height } = this.cameras.main;
    const fontFamily = getFontFamily(this);
    this.cameras.main.setBackgroundColor(0x020107);
    this.cameras.main.setPostPipeline("VectorShader");

    const text = this.add
      .text(width / 2, height + 80, CRAWL_LINES.join("\n\n"), {
        fontFamily,
        fontSize: "26px",
        align: "center",
        color: "#ff43d6",
        wordWrap: { width: Math.floor(width * 0.72) },
      })
      .setOrigin(0.5, 0);

    this.add
      .text(width / 2, height - 40, "CLICK OR SPACE TO SKIP", {
        fontFamily,
        fontSize: "14px",
        color: "#7be8ff",
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: text,
      y: -text.height - 80,
      duration: CRAWL_DURATION_MS,
      ease: "Linear",
      onComplete: () => this.advance(),
    });

    this.input.once("pointerdown", () => this.advance());
    this.input.keyboard?.once("keydown-SPACE", () => this.advance());
    this.input.keyboard?.once("keydown-ENTER", () => this.advance());
    this.input.keyboard?.once("keydown-ESC", () => this.advance());
    this.input.keyboard
      ?.addKey(Input.Keyboard.KeyCodes.S)
      .once("down", () => this.advance());

    EventBus.emit("current-scene-ready", this);
  }

  private advance(): void {
    if (this.hasAdvanced) return;
    this.hasAdvanced = true;
    this.scene.start("Game");
  }
}
