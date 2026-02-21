import { Input, Math as PhaserMath, Physics, Time } from "phaser";
import type { GameObjects, Scene } from "phaser";
import { wrapObject } from "../utils/wrap";

export class Ship extends Physics.Arcade.Sprite {
  private wasd!: {
    W: Input.Keyboard.Key;
    A: Input.Keyboard.Key;
    S: Input.Keyboard.Key;
    D: Input.Keyboard.Key;
  };
  private thrustSpeed = 300;
  private drag = 0.99;
  private isInvulnerable = false;
  private invulnerabilityTimer?: Time.TimerEvent;
  private aimAngle = 0;
  private targetAimAngle = 0;
  private rotationVelocity = 0;
  private rotationAccel = 15; // Angular acceleration (radians/sec²)
  private maxRotationSpeed = 8; // Max rotation speed (radians/sec)
  private rotationDamping = 0.92; // Friction on rotation
  private exhaustAngleDeg = 0;
  private thrustEmitter: GameObjects.Particles.ParticleEmitter;

  constructor(scene: Scene, x: number, y: number) {
    super(scene, x, y, "ship");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(false);
    this.setDamping(true);
    this.setDrag(this.drag);
    this.setMaxVelocity(400);

    // Create thrust particle emitter (blue flame)
    this.thrustEmitter = scene.add.particles(0, 0, "flame", {
      color: [0xffffff, 0xaaddff, 0x33aaff, 0x0066ff, 0x003388],
      colorEase: "quad.out",
      lifespan: 400,
      scale: { start: 0.7, end: 0, ease: "sine.out" },
      speed: { min: 120, max: 180 },
      blendMode: "ADD",
      frequency: 15,
      quantity: 2,
      angle: {
        onEmit: () =>
          PhaserMath.FloatBetween(
            this.exhaustAngleDeg - 10,
            this.exhaustAngleDeg + 10,
          ),
      },
      emitting: false,
    });

    if (scene.input.keyboard) {
      this.wasd = {
        W: scene.input.keyboard.addKey(Input.Keyboard.KeyCodes.W),
        A: scene.input.keyboard.addKey(Input.Keyboard.KeyCodes.A),
        S: scene.input.keyboard.addKey(Input.Keyboard.KeyCodes.S),
        D: scene.input.keyboard.addKey(Input.Keyboard.KeyCodes.D),
      };
    }
  }

  update(): void {
    if (!this.active) return;

    // Mouse aiming - get target angle toward mouse
    const pointer = this.scene.input.activePointer;
    this.targetAimAngle = PhaserMath.Angle.Between(
      this.x,
      this.y,
      pointer.worldX,
      pointer.worldY,
    );

    // Calculate shortest angle difference
    const angleDiff = PhaserMath.Angle.Wrap(
      this.targetAimAngle - this.aimAngle,
    );

    // Apply rotational acceleration toward target
    const dt = this.scene.game.loop.delta / 1000; // Delta time in seconds
    this.rotationVelocity += angleDiff * this.rotationAccel * dt;

    // Clamp rotation speed
    this.rotationVelocity = PhaserMath.Clamp(
      this.rotationVelocity,
      -this.maxRotationSpeed,
      this.maxRotationSpeed,
    );

    // Apply rotation velocity
    this.aimAngle += this.rotationVelocity * dt;
    this.aimAngle = PhaserMath.Angle.Wrap(this.aimAngle);

    // Apply damping to rotation velocity
    this.rotationVelocity *= this.rotationDamping;

    this.setRotation(this.aimAngle + Math.PI / 2); // Offset since ship graphic points up

    // Movement relative to ship facing direction
    const forward =
      (this.wasd?.W?.isDown ? 1 : 0) + (this.wasd?.S?.isDown ? -1 : 0);
    const strafe =
      (this.wasd?.D?.isDown ? 1 : 0) + (this.wasd?.A?.isDown ? -1 : 0);

    if (forward !== 0 || strafe !== 0) {
      // Forward is toward mouse (aimAngle), strafe is perpendicular
      const strafeAngle = this.aimAngle + Math.PI / 2;
      const accelX =
        Math.cos(this.aimAngle) * forward * this.thrustSpeed +
        Math.cos(strafeAngle) * strafe * this.thrustSpeed;
      const accelY =
        Math.sin(this.aimAngle) * forward * this.thrustSpeed +
        Math.sin(strafeAngle) * strafe * this.thrustSpeed;

      // Normalize if both inputs active
      if (forward !== 0 && strafe !== 0) {
        const mag = Math.sqrt(accelX * accelX + accelY * accelY);
        this.setAcceleration(
          (accelX / mag) * this.thrustSpeed,
          (accelY / mag) * this.thrustSpeed,
        );
      } else {
        this.setAcceleration(accelX, accelY);
      }

      // Rocket burn effect - emit in opposite direction of thrust
      const thrustAngle = Math.atan2(accelY, accelX);
      const exhaustAngle = thrustAngle + Math.PI; // Opposite direction

      // Different exhaust distances based on thrust direction relative to ship facing
      // Forward/back thrust uses main engine (far from center)
      // Strafe thrust uses side thrusters (closer to center)
      const thrustRelativeToFacing = Math.abs(
        PhaserMath.Angle.Wrap(thrustAngle - this.aimAngle),
      );
      const isMainEngine =
        thrustRelativeToFacing < Math.PI / 4 ||
        thrustRelativeToFacing > (Math.PI * 3) / 4;
      const exhaustDistance = isMainEngine ? 38 : 18;

      this.thrustEmitter.setPosition(
        this.x + Math.cos(exhaustAngle) * exhaustDistance,
        this.y + Math.sin(exhaustAngle) * exhaustDistance,
      );
      this.exhaustAngleDeg = PhaserMath.RadToDeg(exhaustAngle);
      this.thrustEmitter.emitting = true;
    } else {
      this.setAcceleration(0, 0);
      this.thrustEmitter.emitting = false;
    }

    // Screen wrap
    wrapObject(
      this,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
    );

    // Invulnerability blink effect
    if (this.isInvulnerable) {
      this.setAlpha(Math.sin(this.scene.time.now / 50) * 0.5 + 0.5);
    }
  }

  makeInvulnerable(duration = 2000): void {
    this.isInvulnerable = true;

    if (this.invulnerabilityTimer) {
      this.invulnerabilityTimer.destroy();
    }

    this.invulnerabilityTimer = this.scene.time.delayedCall(duration, () => {
      this.isInvulnerable = false;
      this.setAlpha(1);
    });
  }

  getIsInvulnerable(): boolean {
    return this.isInvulnerable;
  }

  getAimAngle(): number {
    return this.aimAngle;
  }

  respawn(x: number, y: number): void {
    this.setPosition(x, y);
    this.setVelocity(0, 0);
    this.setAcceleration(0, 0);
    this.rotationVelocity = 0;
    this.setActive(true);
    this.setVisible(true);
    this.thrustEmitter.emitting = false;
    this.makeInvulnerable(3000);
  }

  stopThrust(): void {
    this.thrustEmitter.emitting = false;
  }
}
