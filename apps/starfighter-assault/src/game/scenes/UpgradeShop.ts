import { Scene } from "phaser";
import { getFontFamily } from "../../utils/font";
import { EventBus } from "../EventBus";
import { getAvailableUpgrades } from "../simulation/Upgrades";

export class UpgradeShop extends Scene {
  constructor() {
    super("UpgradeShop");
  }

  create(): void {
    const { width, height } = this.cameras.main;
    const fontFamily = getFontFamily(this);
    this.cameras.main.setBackgroundColor(0x020107);
    this.cameras.main.setPostPipeline("VectorShader");

    this.add
      .text(width / 2, height * 0.24, "SPEND BOUNTIES", {
        fontFamily,
        fontSize: "48px",
        color: "#ff43d6",
        stroke: "#4d2cff",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    getAvailableUpgrades()
      .slice(0, 3)
      .forEach((upgrade, index) => {
        this.add
          .text(
            width / 2,
            height * 0.42 + index * 52,
            `${formatUpgradeLabel(upgrade.id)}  ${upgrade.cost} BOUNTIES`,
            {
              fontFamily,
              fontSize: "22px",
              color: "#7be8ff",
            },
          )
          .setOrigin(0.5);
      });

    this.add
      .text(width / 2, height - 56, "SPACE OR CLICK TO LAUNCH", {
        fontFamily,
        fontSize: "16px",
        color: "#ffdf6e",
      })
      .setOrigin(0.5);

    const startGame = () => this.scene.start("Game");
    this.input.keyboard?.once("keydown-SPACE", startGame);
    this.input.once("pointerdown", startGame);

    EventBus.emit("current-scene-ready", this);
  }
}

function formatUpgradeLabel(id: string): string {
  return id
    .split("-")
    .map((part) => part.toUpperCase())
    .join(" ");
}
