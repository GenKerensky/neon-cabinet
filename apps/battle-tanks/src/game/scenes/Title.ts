import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { getFontFamily } from "../../utils/font";
import { Camera3D } from "../engine/Camera3D";
import { WireframeRenderer } from "../engine/WireframeRenderer";
import { GroundGrid } from "../objects/GroundGrid";
import { Mountains } from "../objects/Mountains";
import { Starfield } from "../effects/Starfield";
import { Atmosphere } from "../effects/Atmosphere";
import { ENEMY_TANK } from "../models";
import { TURRET_MODEL } from "../objects/Turret";
import { Vector3D } from "../engine/Vector3D";
import { WireframeModel } from "../engine/WireframeModel";

interface PassingObject {
  position: Vector3D;
  rotation: number;
  model: WireframeModel;
}

export class Title extends Scene {
  private camera3d!: Camera3D;
  private wireframeRenderer!: WireframeRenderer;
  private groundGrid!: GroundGrid;
  private mountains!: Mountains;
  private starfield!: Starfield;
  private atmosphere!: Atmosphere;

  private cameraZ = 0;
  private readonly moveSpeed = 150;
  private passingObjects: PassingObject[] = [];
  private spawnTimer = 0;

  constructor() {
    super("Title");
  }

  create(): void {
    const { width, height } = this.cameras.main;
    const font = getFontFamily(this);

    this.cameras.main.setBackgroundColor(0x000000);
    this.cameras.main.setPostPipeline("VectorShader");

    // Initialize 3D camera (stationary rotation, moving forward)
    this.camera3d = new Camera3D(400);
    this.camera3d.position.y = 50;
    this.cameraZ = 0;

    // Create visual effects (same as game)
    this.atmosphere = new Atmosphere();
    this.atmosphere.create(this, 0x004400);

    this.starfield = new Starfield();
    this.starfield.create(this);

    this.wireframeRenderer = new WireframeRenderer(this, this.camera3d);
    this.groundGrid = new GroundGrid(this, this.camera3d);
    this.mountains = new Mountains(this);

    // Spawn initial tanks
    this.spawnInitialObjects();

    // Title text - centered
    const titleText = this.add.text(width / 2, height * 0.35, "BATTLE TANKS", {
      fontFamily: font,
      fontSize: "72px",
      color: "#00ff00",
      stroke: "#003300",
      strokeThickness: 3,
    });
    titleText.setOrigin(0.5);
    titleText.setDepth(100);

    const titleGlow = this.add.text(width / 2, height * 0.35, "BATTLE TANKS", {
      fontFamily: font,
      fontSize: "72px",
      color: "#00ff00",
    });
    titleGlow.setOrigin(0.5);
    titleGlow.setAlpha(0.3);
    titleGlow.setDepth(99);

    this.tweens.add({
      targets: titleGlow,
      alpha: 0.1,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.add
      .text(width / 2, height * 0.45, "WIREFRAME COMBAT", {
        fontFamily: font,
        fontSize: "24px",
        color: "#00aa00",
      })
      .setOrigin(0.5)
      .setDepth(100);

    const startText = this.add.text(
      width / 2,
      height * 0.58,
      "PRESS SPACE TO START",
      {
        fontFamily: font,
        fontSize: "24px",
        color: "#ffffff",
      },
    );
    startText.setOrigin(0.5);
    startText.setDepth(100);

    this.tweens.add({
      targets: startText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    this.add
      .text(width / 2, height * 0.66, "SPACE - FIRE  |  R - RELOAD", {
        fontFamily: font,
        fontSize: "16px",
        color: "#666666",
      })
      .setOrigin(0.5)
      .setDepth(100);

    this.add
      .text(
        width / 2,
        height * 0.71,
        "W/S or ↑/↓ - MOVE  |  A/D or ←/→ - TURN",
        {
          fontFamily: font,
          fontSize: "16px",
          color: "#666666",
        },
      )
      .setOrigin(0.5)
      .setDepth(100);

    this.input.keyboard?.once("keydown-SPACE", () => {
      this.scene.start("Game");
    });

    this.input.once("pointerdown", () => {
      this.scene.start("Game");
    });

    EventBus.emit("current-scene-ready", this);
  }

  private spawnInitialObjects(): void {
    // Spawn a few objects ahead at start
    for (let i = 0; i < 4; i++) {
      this.spawnObject(400 + i * 500);
    }
  }

  private spawnObject(zOffset = 1000): void {
    const side = Math.random() > 0.5 ? "left" : "right";
    const xOffset =
      side === "left" ? -250 - Math.random() * 200 : 250 + Math.random() * 200;

    // Randomly choose between tank and turret
    const model = Math.random() > 0.4 ? ENEMY_TANK : TURRET_MODEL;

    this.passingObjects.push({
      position: new Vector3D(xOffset, 0, this.cameraZ + zOffset),
      rotation: Math.random() * Math.PI * 2,
      model,
    });
  }

  update(_time: number, delta: number): void {
    const { width, height } = this.cameras.main;
    const dt = delta / 1000;

    // Move camera forward
    this.cameraZ += this.moveSpeed * dt;
    this.camera3d.position.z = this.cameraZ;

    // Spawn new objects periodically
    this.spawnTimer += delta;
    if (this.spawnTimer > 2500 + Math.random() * 1500) {
      this.spawnTimer = 0;
      this.spawnObject();
    }

    // Remove objects that are behind the camera
    this.passingObjects = this.passingObjects.filter(
      (obj) => obj.position.z > this.cameraZ - 200,
    );

    // Update starfield (no rotation on title)
    this.starfield.update(0);

    // Render scene
    this.wireframeRenderer.clear();
    this.groundGrid.render(width, height);
    this.mountains.render(this.camera3d, width, height);

    // Render passing tanks and turrets (green)
    for (const obj of this.passingObjects) {
      this.wireframeRenderer.render(
        obj.model,
        obj.position,
        obj.rotation,
        width,
        height,
        0x00ff00,
      );
    }
  }

  shutdown(): void {
    this.starfield?.destroy();
    this.atmosphere?.destroy();
    this.groundGrid?.destroy();
    this.mountains?.destroy();
    this.wireframeRenderer?.destroy();
  }
}
