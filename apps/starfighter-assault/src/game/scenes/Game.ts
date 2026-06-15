import Phaser, { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { projectThreatsToRadar } from "../hud/RadarProjection";
import { CockpitHud } from "../objects/CockpitHud";
import { RailPlayer } from "../objects/RailPlayer";
import {
  createThreatWave,
  getAliveThreats,
  type Threat,
} from "../objects/Threats";
import { generateSortie } from "../rail/RouteGenerator";
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
  private threats: Threat[] = [];

  constructor() {
    super("Game");
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x020107);
    this.cameras.main.setPostPipeline("VectorShader");

    this.player = new RailPlayer({ width: 620, height: 380 });
    this.weapons = createWeaponsState();
    const sortie = generateSortie({ seed: Date.now(), difficulty: 1 });
    this.threats = createThreatWave(sortie.segments[0].allowedThreats, 1);

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
    const dots = projectThreatsToRadar(
      getAliveThreats(this.threats).map(({ id, x, y, z, threat }) => ({
        id,
        x,
        y,
        z,
        threat,
      })),
    );

    this.cockpitHud.render(width, height, dots, this.player.position);
  }

  private fireLaserAtPlayerTarget(): void {
    this.weapons = fireLaser(this.weapons, this.player.target).state;
  }
}
