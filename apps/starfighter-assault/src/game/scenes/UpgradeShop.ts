import { Scene } from "phaser";
import { getFontFamily } from "../../utils/font";
import { EventBus } from "../EventBus";
import type { GeneratedSortie } from "../rail/SegmentTypes";
import type { BountyState } from "../simulation/Bounties";
import type { RunState } from "../simulation/RunState";
import { getAvailableUpgrades } from "../simulation/Upgrades";
import type { WeaponsState } from "../simulation/Weapons";

interface UpgradeShopSceneData {
  runState?: RunState;
  sortie?: GeneratedSortie;
  bountyState?: BountyState;
  weapons?: WeaponsState;
}

export class UpgradeShop extends Scene {
  constructor() {
    super("UpgradeShop");
  }

  create(data: UpgradeShopSceneData = {}): void {
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
      .text(width / 2, height * 0.33, `${data.runState?.bounties ?? 0} BOUNTIES`, {
        fontFamily,
        fontSize: "18px",
        color: "#ffdf6e",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height - 56, "SPACE OR CLICK TO LAUNCH", {
        fontFamily,
        fontSize: "16px",
        color: "#ffdf6e",
      })
      .setOrigin(0.5);

    const startGame = () =>
      this.scene.start("Game", {
        ...data,
        runState:
          data.runState === undefined
            ? undefined
            : {
                ...data.runState,
                status: "playing",
              },
      });
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
