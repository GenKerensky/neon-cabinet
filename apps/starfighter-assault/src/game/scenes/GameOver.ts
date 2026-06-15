import { Scene } from "phaser";
import { getFontFamily } from "../../utils/font";

interface GameOverSceneData {
  status?: "victory" | "game-over";
  bounties?: number;
}

export class GameOver extends Scene {
  constructor() {
    super("GameOver");
  }

  create(data: GameOverSceneData = {}): void {
    const { width, height } = this.cameras.main;
    const fontFamily = getFontFamily(this);
    const didWin = data.status === "victory";

    this.cameras.main.setBackgroundColor(0x020107);
    this.cameras.main.setPostPipeline("VectorShader");

    this.add
      .text(width / 2, height * 0.36, didWin ? "OBSIDIAN CROWN DOWN" : "RUN LOST", {
        fontFamily,
        fontSize: "44px",
        color: didWin ? "#7be8ff" : "#ff43d6",
        stroke: "#4d2cff",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.5, `${data.bounties ?? 0} BOUNTIES CLAIMED`, {
        fontFamily,
        fontSize: "22px",
        color: "#ffdf6e",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.66, "SPACE OR CLICK TO RETURN", {
        fontFamily,
        fontSize: "16px",
        color: "#7be8ff",
      })
      .setOrigin(0.5);

    const restart = () => this.scene.start("Title");
    this.time.delayedCall(600, () => {
      this.input.keyboard?.once("keydown-SPACE", restart);
      this.input.once("pointerdown", restart);
    });
  }
}
