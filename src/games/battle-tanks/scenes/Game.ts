import Phaser, { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { Camera3D } from "../engine/Camera3D";
import { WireframeRenderer } from "../engine/WireframeRenderer";
import { PlayerTank } from "../objects/PlayerTank";
import { GroundGrid } from "../objects/GroundGrid";
import { Mountains } from "../objects/Mountains";
import { HUD } from "../objects/HUD";
import { Starfield } from "../effects/Starfield";
import { Atmosphere } from "../effects/Atmosphere";
import { ScreenShake } from "../effects/ScreenShake";
import {
  VectorParticleSystem,
  PARTICLE_PRESETS,
} from "../objects/VectorParticles";
import { Vector3D } from "../engine/Vector3D";
import { PYRAMID, CUBE } from "../models/models";

export class Game extends Scene {
  private camera3d!: Camera3D;
  private wireframeRenderer!: WireframeRenderer;
  private tank!: PlayerTank;

  private starfield!: Starfield;
  private atmosphere!: Atmosphere;
  private groundGrid!: GroundGrid;
  private mountains!: Mountains;

  private particles!: VectorParticleSystem;
  private screenShake!: ScreenShake;

  private hud!: HUD;

  private testObstacles: {
    position: Vector3D;
    rotation: number;
    model: typeof PYRAMID;
  }[] = [];

  constructor() {
    super("Game");
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x000000);
    this.cameras.main.setPostPipeline("VectorShader");

    this.atmosphere = new Atmosphere();
    this.atmosphere.create(this, 0x002200);

    this.starfield = new Starfield();
    this.starfield.create(this);

    this.camera3d = new Camera3D(400);

    this.tank = new PlayerTank(this, this.camera3d);

    this.wireframeRenderer = new WireframeRenderer(this, this.camera3d);

    this.groundGrid = new GroundGrid(this, this.camera3d);
    this.mountains = new Mountains(this);

    this.particles = new VectorParticleSystem(this);
    this.particles.setCamera(this.camera3d);
    this.screenShake = new ScreenShake(this);

    this.hud = new HUD(this);
    this.hud.draw();

    this.createTestObstacles();

    this.input.keyboard
      ?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
      .on("down", () => {
        if (!this.scene.isPaused("Game")) {
          this.scene.pause("Game");
          this.scene.launch("Pause");
        }
      });

    this.input.keyboard
      ?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
      .on("down", () => {
        this.triggerTestExplosion();
      });

    EventBus.emit("current-scene-ready", this);
  }

  private createTestObstacles(): void {
    this.testObstacles = [
      { position: new Vector3D(500, 0, 500), rotation: 0, model: PYRAMID },
      {
        position: new Vector3D(-500, 0, 500),
        rotation: Math.PI / 4,
        model: PYRAMID,
      },
      { position: new Vector3D(0, 0, 800), rotation: 0, model: CUBE },
      {
        position: new Vector3D(700, 0, -300),
        rotation: Math.PI / 6,
        model: PYRAMID,
      },
      { position: new Vector3D(-600, 0, -600), rotation: 0, model: CUBE },
      {
        position: new Vector3D(300, 0, -700),
        rotation: Math.PI / 3,
        model: PYRAMID,
      },
      { position: new Vector3D(-800, 0, 200), rotation: 0, model: CUBE },
      { position: new Vector3D(1000, 0, 1000), rotation: 0, model: PYRAMID },
      {
        position: new Vector3D(-1000, 0, 1000),
        rotation: Math.PI / 2,
        model: CUBE,
      },
    ];
  }

  private triggerTestExplosion(): void {
    const forward = this.camera3d.getForward();
    const explosionPos = this.tank.getPosition().add(forward.scale(200));
    explosionPos.y = 30;

    this.particles.emitRing(explosionPos, 20, PARTICLE_PRESETS.explosion);
    this.particles.emit(explosionPos, 10, PARTICLE_PRESETS.debris);
    this.screenShake.explosion();
  }

  update(time: number, delta: number): void {
    const { width, height } = this.cameras.main;

    this.tank.update(delta);

    this.particles.update(delta);

    this.wireframeRenderer.clear();

    this.groundGrid.render(width, height);
    this.mountains.render(this.camera3d, width, height);

    for (const obstacle of this.testObstacles) {
      this.wireframeRenderer.render(
        obstacle.model,
        obstacle.position,
        obstacle.rotation,
        width,
        height,
      );
    }

    this.particles.render(width, height);

    const pos = this.tank.getPosition();
    this.hud.update(this.tank.getVelocity(), pos.x, pos.z);

    this.starfield.update(time);
  }

  shutdown(): void {
    this.starfield?.destroy();
    this.atmosphere?.destroy();
    this.groundGrid?.destroy();
    this.mountains?.destroy();
    this.particles?.destroy();
    this.wireframeRenderer?.destroy();
    this.hud?.destroy();
  }
}
