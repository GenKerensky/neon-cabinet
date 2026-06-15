import { Input, Math as PhaserMath, Physics } from "phaser";
import type { GameObjects, Scene, Types } from "phaser";
import {
  SVGParser,
  VectorPuppet,
  type SVGPuppetMetadata,
} from "@neon-cabinet/sprite-tools";

export type LandingGearState =
  | "stowed"
  | "deploying"
  | "deployed"
  | "compressing"
  | "settled";

const GEAR_LAYER_IDS = [
  "gear_left",
  "gear_right",
  "foot_left",
  "foot_right",
] as const;
const THRUSTER_PARTICLE_ORIGIN_OFFSET = 14;

type GearLayer = GameObjects.Container | GameObjects.Graphics;

export class Lander extends VectorPuppet {
  private fuel = 100;
  private maxFuel = 100;
  private fuelConsumption = 15; // per second when thrusting
  private thrustPower = 250;
  private rotationSpeed = 150; // degrees per second
  private thrustEmitter: GameObjects.Particles.ParticleEmitter;
  private landingGearState: LandingGearState = "stowed";
  private thrusting = false;
  private gearDeployQueued = false;

  declare public body: Physics.Arcade.Body;

  // Input keys
  private cursors!: Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Input.Keyboard.Key;
    A: Input.Keyboard.Key;
    S: Input.Keyboard.Key;
    D: Input.Keyboard.Key;
  };

  constructor(scene: Scene, x: number, y: number) {
    super(scene, x, y, createLanderPuppetMetadata(scene));

    if (!this.body) {
      scene.physics.add.existing(this);
    }

    // Physics setup
    const body = this.body;
    body.setCollideWorldBounds(false);
    body.setMaxVelocity(300, 400);
    body.setDrag(0); // No air drag in space
    body.setAngularDrag(100);

    // Set up hitbox (smaller than sprite for fair collision)
    body.setSize(40, 80);
    body.setOffset(-20, -40);

    this.resetLandingGear();

    // Create thrust particle emitter
    this.thrustEmitter = scene.add.particles(0, 0, "flame", {
      speed: { min: 100, max: 200 },
      angle: { min: 80, max: 100 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 200, max: 400 },
      blendMode: "ADD",
      frequency: 20,
      quantity: 3,
      emitting: false,
    });
    this.thrustEmitter.setDepth(this.depth - 1);

    // Setup input
    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.wasd = {
        W: scene.input.keyboard.addKey(Input.Keyboard.KeyCodes.W),
        A: scene.input.keyboard.addKey(Input.Keyboard.KeyCodes.A),
        S: scene.input.keyboard.addKey(Input.Keyboard.KeyCodes.S),
        D: scene.input.keyboard.addKey(Input.Keyboard.KeyCodes.D),
      };
    }
  }

  update(delta: number, altitude = Number.POSITIVE_INFINITY): void {
    if (!this.active) return;

    super.update(this.scene.time.now, delta);

    const deltaSeconds = delta / 1000;

    if (altitude < 150 && this.getVerticalSpeed() > 20) {
      this.deployLandingGear();
    }

    // Handle rotation
    if (this.cursors?.left.isDown || this.wasd?.A.isDown) {
      this.setAngularVelocity(-this.rotationSpeed);
    } else if (this.cursors?.right.isDown || this.wasd?.D.isDown) {
      this.setAngularVelocity(this.rotationSpeed);
    } else {
      this.setAngularVelocity(0);
    }

    // Handle thrust
    const thrustPressed =
      this.cursors?.up.isDown || this.wasd?.W.isDown || this.wasd?.S.isDown;

    if (thrustPressed && this.fuel > 0) {
      this.applyThrust(deltaSeconds);
    } else {
      this.stopThrust();
    }

    // Update thruster particle position
    this.updateThrusterPosition();
  }

  setAngularVelocity(value: number): this {
    this.body.setAngularVelocity(value);
    return this;
  }

  deployLandingGear(): void {
    if (this.landingGearState !== "stowed") return;

    this.landingGearState = "deploying";
    this.gearDeployQueued = true;
    this.scene.tweens.add({
      targets: this.getGearLayers(),
      scaleY: 1,
      y: 0,
      duration: 340,
      ease: "Back.easeOut",
      onComplete: () => {
        if (this.landingGearState === "deploying") {
          this.landingGearState = "deployed";
        }
      },
    });
  }

  playTouchdownCompression(): void {
    if (
      this.landingGearState === "compressing" ||
      this.landingGearState === "settled"
    ) {
      return;
    }

    if (this.landingGearState === "stowed") {
      this.deployLandingGear();
    }

    this.landingGearState = "compressing";
    this.scene.tweens.add({
      targets: this.getGearLayers(),
      scaleY: 0.86,
      y: 10,
      duration: 110,
      ease: "Quad.easeOut",
      yoyo: true,
      hold: 45,
      onComplete: () => {
        this.landingGearState = "settled";
        this.getGearLayers().forEach((layer) => {
          layer.scaleY = 0.96;
          layer.y = 2;
        });
      },
    });
  }

  resetLandingGear(): void {
    this.scene.tweens.killTweensOf(this.getGearLayers());
    this.landingGearState = "stowed";
    this.gearDeployQueued = false;
    this.getGearLayers().forEach((layer) => {
      layer.scaleY = 0.72;
      layer.y = 22;
    });
  }

  consumeGearDeployEvent(): boolean {
    const queued = this.gearDeployQueued;
    this.gearDeployQueued = false;
    return queued;
  }

  getLandingGearState(): LandingGearState {
    return this.landingGearState;
  }

  isThrusting(): boolean {
    return this.thrusting;
  }

  private applyThrust(deltaSeconds: number): void {
    // Consume fuel
    this.fuel -= this.fuelConsumption * deltaSeconds;
    if (this.fuel < 0) this.fuel = 0;

    // Calculate thrust direction based on lander rotation
    // Lander points up at 0 degrees, so thrust pushes in the -90 direction
    const angleRad = PhaserMath.DegToRad(this.angle - 90);
    const thrustX = Math.cos(angleRad) * this.thrustPower * deltaSeconds;
    const thrustY = Math.sin(angleRad) * this.thrustPower * deltaSeconds;

    // Apply thrust as velocity change (gravity continues to act via physics world)
    this.body.velocity.x += thrustX;
    this.body.velocity.y += thrustY;

    // Start thrust particles
    this.thrustEmitter.start();
    this.thrusting = true;
  }

  private updateThrusterPosition(): void {
    const thrusterSocket = this.getSocketWorldPosition("thruster");

    const particleAngle = this.angle + 90;
    const particleAngleRad = PhaserMath.DegToRad(particleAngle);
    this.thrustEmitter.setPosition(
      thrusterSocket.x +
        Math.cos(particleAngleRad) * THRUSTER_PARTICLE_ORIGIN_OFFSET,
      thrusterSocket.y +
        Math.sin(particleAngleRad) * THRUSTER_PARTICLE_ORIGIN_OFFSET,
    );

    // Update particle emission angle based on lander rotation.
    this.thrustEmitter.ops.angle.loadConfig({
      angle: { min: particleAngle - 15, max: particleAngle + 15 },
    });
  }

  private getGearLayers(): GearLayer[] {
    return GEAR_LAYER_IDS.map((id) => this.getLayer(id)).filter(
      (layer): layer is GearLayer => layer !== undefined,
    );
  }

  getFuel(): number {
    return this.fuel;
  }

  getFuelPercent(): number {
    return (this.fuel / this.maxFuel) * 100;
  }

  getHorizontalSpeed(): number {
    return Math.abs(this.body.velocity.x);
  }

  getVerticalSpeed(): number {
    return this.body.velocity.y;
  }

  getRotationAngle(): number {
    // Normalize angle to -180 to 180
    let angle = this.angle % 360;
    if (angle > 180) angle -= 360;
    if (angle < -180) angle += 360;
    return angle;
  }

  isLandingSafe(): boolean {
    const hSpeed = this.getHorizontalSpeed();
    const vSpeed = this.getVerticalSpeed();
    const angle = Math.abs(this.getRotationAngle());

    // Safe landing conditions
    const maxHSpeed = 30;
    const maxVSpeed = 100;
    const maxAngle = 15;

    return hSpeed < maxHSpeed && vSpeed < maxVSpeed && angle < maxAngle;
  }

  isCrashing(): boolean {
    const vSpeed = this.getVerticalSpeed();
    return vSpeed > 200; // Definitely crashing if going this fast
  }

  stopThrust(): void {
    this.thrustEmitter.stop();
    this.thrusting = false;
  }

  resetFuel(): void {
    this.fuel = this.maxFuel;
  }

  destroy(fromScene?: boolean): void {
    this.thrustEmitter.destroy();
    super.destroy(fromScene);
  }
}

export function createLanderPuppetMetadata(scene: Scene): SVGPuppetMetadata {
  const landerSvg = scene.cache.text.get("lander_svg") as string | undefined;
  if (landerSvg) {
    return new SVGParser().parse(landerSvg);
  }

  return {
    viewBox: { x: 0, y: 0, width: 80, height: 120 },
    layers: [],
    sockets: [{ id: "thruster", x: 40, y: 104, type: "effect" }],
  };
}
