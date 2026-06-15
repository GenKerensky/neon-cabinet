import Phaser, { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { projectThreatsToRadar } from "../hud/RadarProjection";
import { CockpitHud } from "../objects/CockpitHud";
import { RailPlayer } from "../objects/RailPlayer";
import {
  createWeaponsState,
  fireLaser,
  fireTorpedo,
  type WeaponsState,
} from "../simulation/Weapons";

export class Game extends Scene {
  private cockpitHud!: CockpitHud;
  private player!: RailPlayer;
  private weapons!: WeaponsState;

  constructor() {
    super("Game");
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x020107);
    this.cameras.main.setPostPipeline("VectorShader");

    this.player = new RailPlayer({ width: 620, height: 380 });
    this.weapons = createWeaponsState();

    this.cockpitHud = new CockpitHud(this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.cockpitHud.destroy();
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      const { width, height } = this.cameras.main;
      this.player.setPointerTarget(pointer.x - width / 2, pointer.y - height / 2);
    });

    this.input.on("pointerdown", () => {
      this.fireLaserAtPlayerTarget();
    });

    this.input.keyboard?.on("keydown-SPACE", () => {
      this.fireLaserAtPlayerTarget();
    });

    this.input.keyboard?.on("keydown-SHIFT", () => {
      this.weapons = fireTorpedo(this.weapons).state;
    });

    EventBus.emit("current-scene-ready", this);
  }

  update(_time: number, delta: number): void {
    this.player.update(delta / 1000);

    const { width, height } = this.cameras.main;
    const dots = projectThreatsToRadar([
      { id: "alpha", x: -280, y: 40, z: 720, threat: 0.8 },
      { id: "beta", x: 340, y: -10, z: 1_240, threat: 0.45 },
    ]);

    this.cockpitHud.render(width, height, dots);
  }

  private fireLaserAtPlayerTarget(): void {
    const { x, y } = this.player.target;
    this.weapons = fireLaser(this.weapons, `${x},${y}`).state;
  }
}
