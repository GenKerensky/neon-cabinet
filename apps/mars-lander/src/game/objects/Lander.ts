import { Input, Math as PhaserMath, Physics } from "phaser";
import type { GameObjects, Scene, Types } from "phaser";

export class Lander extends Physics.Arcade.Sprite {
  private fuel = 100;
  private maxFuel = 100;
  private fuelConsumption = 15; // per second when thrusting
  private thrustPower = 250;
  private rotationSpeed = 150; // degrees per second
  private thrustEmitter: GameObjects.Particles.ParticleEmitter;

  // Input keys
  private cursors!: Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Input.Keyboard.Key;
    A: Input.Keyboard.Key;
    S: Input.Keyboard.Key;
    D: Input.Keyboard.Key;
  };

  constructor(scene: Scene, x: number, y: number) {
    super(scene, x, y, "lander");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Physics setup
    const body = this.body as Physics.Arcade.Body;
    body.setCollideWorldBounds(false);
    body.setMaxVelocity(300, 400);
    body.setDrag(0); // No air drag in space
    body.setAngularDrag(100);

    // Set up hitbox (smaller than sprite for fair collision)
    body.setSize(40, 80);
    body.setOffset(20, 20);

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

  update(delta: number): void {
    if (!this.active) return;

    const deltaSeconds = delta / 1000;

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
      this.thrustEmitter.stop();
    }

    // Update thruster particle position
    this.updateThrusterPosition();
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
    const body = this.body as Physics.Arcade.Body;
    body.velocity.x += thrustX;
    body.velocity.y += thrustY;

    // Start thrust particles
    this.thrustEmitter.start();
  }

  private updateThrusterPosition(): void {
    // Position emitter at bottom of lander, accounting for rotation
    const angleRad = PhaserMath.DegToRad(this.angle + 90);
    const offsetDistance = 60; // Distance from center to thruster
    const emitterX = this.x + Math.cos(angleRad) * offsetDistance;
    const emitterY = this.y + Math.sin(angleRad) * offsetDistance;

    this.thrustEmitter.setPosition(emitterX, emitterY);

    // Update particle emission angle based on lander rotation
    const particleAngle = this.angle + 90;
    this.thrustEmitter.ops.angle.loadConfig({
      angle: { min: particleAngle - 15, max: particleAngle + 15 },
    });
  }

  getFuel(): number {
    return this.fuel;
  }

  getFuelPercent(): number {
    return (this.fuel / this.maxFuel) * 100;
  }

  getHorizontalSpeed(): number {
    const body = this.body as Physics.Arcade.Body;
    return Math.abs(body.velocity.x);
  }

  getVerticalSpeed(): number {
    const body = this.body as Physics.Arcade.Body;
    return body.velocity.y;
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
  }

  resetFuel(): void {
    this.fuel = this.maxFuel;
  }

  destroy(fromScene?: boolean): void {
    this.thrustEmitter.destroy();
    super.destroy(fromScene);
  }
}
