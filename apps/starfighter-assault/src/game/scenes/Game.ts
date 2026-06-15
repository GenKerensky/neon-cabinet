import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { projectThreatsToRadar } from "../hud/RadarProjection";
import { CockpitHud } from "../objects/CockpitHud";

export class Game extends Scene {
  private cockpitHud!: CockpitHud;

  constructor() {
    super("Game");
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x020107);
    this.cameras.main.setPostPipeline("VectorShader");

    this.cockpitHud = new CockpitHud(this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.cockpitHud.destroy();
    });

    EventBus.emit("current-scene-ready", this);
  }

  update(): void {
    const { width, height } = this.cameras.main;
    const dots = projectThreatsToRadar([
      { id: "alpha", x: -280, y: 40, z: 720, threat: 0.8 },
      { id: "beta", x: 340, y: -10, z: 1_240, threat: 0.45 },
    ]);

    this.cockpitHud.render(width, height, dots);
  }
}
