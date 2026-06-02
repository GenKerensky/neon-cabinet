import { Input, Math as PhaserMath, Time } from "phaser";
import type { Scene } from "phaser";
import { VectorPuppet } from "@neon-cabinet/sprite-tools";
import {
  getSpaceDefenderVectorMetadata,
  createEmptyVectorMetadata,
} from "../config/vectorAssets";
import { wrapObject } from "../utils/wrap";
import { VectorPhysicsPuppet } from "./VectorPhysicsPuppet";

export interface ShipThrustAudioState {
  intensity: number;
  pan: number;
}

export class Ship extends VectorPhysicsPuppet {
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
  private rotationAccel = 15;
  private maxRotationSpeed = 8;
  private rotationDamping = 0.92;
  private thrustFlame: VectorPuppet;
  private thrusting = false;
  private thrustAudioState: ShipThrustAudioState = { intensity: 0, pan: 0 };

  constructor(scene: Scene, x: number, y: number) {
    super(
      scene,
      x,
      y,
      getSpaceDefenderVectorMetadata(
        scene,
        "ship",
        createEmptyVectorMetadata(50, 80),
      ),
      34,
      68,
    );

    this.setBodySize(34, 68);
    this.setCollideWorldBounds(false);
    this.setDamping(true);
    this.setDrag(this.drag);
    this.setMaxVelocity(400);

    this.thrustFlame = new VectorPuppet(
      scene,
      x,
      y,
      getSpaceDefenderVectorMetadata(
        scene,
        "thrusterFlame",
        createEmptyVectorMetadata(24, 16),
      ),
    );
    this.thrustFlame.setVisible(false);
    this.thrustFlame.setDepth(this.depth - 1);

    if (scene.input.keyboard) {
      this.wasd = {
        W: scene.input.keyboard.addKey(Input.Keyboard.KeyCodes.W),
        A: scene.input.keyboard.addKey(Input.Keyboard.KeyCodes.A),
        S: scene.input.keyboard.addKey(Input.Keyboard.KeyCodes.S),
        D: scene.input.keyboard.addKey(Input.Keyboard.KeyCodes.D),
      };
    }
  }

  override update(): void {
    if (!this.active) return;

    super.update(this.scene.time.now, this.scene.game.loop.delta);

    const pointer = this.scene.input.activePointer;
    this.targetAimAngle = PhaserMath.Angle.Between(
      this.x,
      this.y,
      pointer.worldX,
      pointer.worldY,
    );

    const angleDiff = PhaserMath.Angle.Wrap(
      this.targetAimAngle - this.aimAngle,
    );
    const dt = this.scene.game.loop.delta / 1000;

    this.rotationVelocity += angleDiff * this.rotationAccel * dt;
    this.rotationVelocity = PhaserMath.Clamp(
      this.rotationVelocity,
      -this.maxRotationSpeed,
      this.maxRotationSpeed,
    );
    this.aimAngle += this.rotationVelocity * dt;
    this.aimAngle = PhaserMath.Angle.Wrap(this.aimAngle);
    this.rotationVelocity *= this.rotationDamping;

    this.setRotation(this.aimAngle + Math.PI / 2);

    const forward =
      (this.wasd?.W?.isDown ? 1 : 0) + (this.wasd?.S?.isDown ? -1 : 0);
    const strafe =
      (this.wasd?.D?.isDown ? 1 : 0) + (this.wasd?.A?.isDown ? -1 : 0);

    if (forward !== 0 || strafe !== 0) {
      const strafeAngle = this.aimAngle + Math.PI / 2;
      const rawAccelX =
        Math.cos(this.aimAngle) * forward * this.thrustSpeed +
        Math.cos(strafeAngle) * strafe * this.thrustSpeed;
      const rawAccelY =
        Math.sin(this.aimAngle) * forward * this.thrustSpeed +
        Math.sin(strafeAngle) * strafe * this.thrustSpeed;
      const magnitude = Math.hypot(rawAccelX, rawAccelY);
      const accelX =
        magnitude > this.thrustSpeed
          ? (rawAccelX / magnitude) * this.thrustSpeed
          : rawAccelX;
      const accelY =
        magnitude > this.thrustSpeed
          ? (rawAccelY / magnitude) * this.thrustSpeed
          : rawAccelY;

      this.setAcceleration(accelX, accelY);
      this.updateThrustFlame(accelX, accelY, forward, strafe);
    } else {
      this.setAcceleration(0, 0);
      this.thrusting = false;
      this.thrustAudioState = { intensity: 0, pan: this.getScreenPan() };
      this.thrustFlame.setVisible(false);
    }

    wrapObject(
      this,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
    );

    if (this.isInvulnerable) {
      this.setAlpha(Math.sin(this.scene.time.now / 50) * 0.5 + 0.5);
    }
  }

  private updateThrustFlame(
    accelX: number,
    accelY: number,
    forward: number,
    strafe: number,
  ): void {
    const thrustAngle = Math.atan2(accelY, accelX);
    const exhaustAngle = thrustAngle + Math.PI;
    const socketId = this.getThrusterSocket(forward, strafe, thrustAngle);
    const socket = this.getSocketWorldPosition(socketId);

    this.thrustFlame.setVisible(true);
    this.thrustFlame.setPosition(socket.x, socket.y);
    this.thrustFlame.setRotation(exhaustAngle);
    this.thrustFlame.setDepth(this.depth - 1);
    this.thrustFlame.update(this.scene.time.now, this.scene.game.loop.delta);

    const intensity = PhaserMath.Clamp(
      Math.hypot(accelX, accelY) / this.thrustSpeed,
      0,
      1,
    );
    this.thrusting = intensity > 0;
    this.thrustAudioState = {
      intensity,
      pan: this.getScreenPan(),
    };
  }

  private getThrusterSocket(
    forward: number,
    strafe: number,
    thrustAngle: number,
  ): string {
    if (Math.abs(strafe) > Math.abs(forward)) {
      return strafe > 0 ? "socket_left_thruster" : "socket_right_thruster";
    }

    const thrustRelativeToFacing = Math.abs(
      PhaserMath.Angle.Wrap(thrustAngle - this.aimAngle),
    );
    if (thrustRelativeToFacing > (Math.PI * 3) / 4) {
      return "socket_muzzle";
    }
    return "socket_engine";
  }

  private getScreenPan(): number {
    const width = this.scene.cameras.main.width;
    return PhaserMath.Clamp((this.x / width) * 2 - 1, -1, 1);
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

  getMuzzleWorldPosition(): PhaserMath.Vector2 {
    return this.getSocketWorldPosition("socket_muzzle");
  }

  getThrustAudioState(): ShipThrustAudioState {
    return this.thrustAudioState;
  }

  isThrusting(): boolean {
    return this.thrusting;
  }

  respawn(x: number, y: number): void {
    this.setPosition(x, y);
    this.setVelocity(0, 0);
    this.setAcceleration(0, 0);
    this.rotationVelocity = 0;
    this.setActive(true);
    this.setVisible(true);
    this.stopThrust();
    this.makeInvulnerable(3000);
  }

  stopThrust(): void {
    this.thrusting = false;
    this.thrustAudioState = { intensity: 0, pan: this.getScreenPan() };
    this.thrustFlame.setVisible(false);
  }

  override destroy(fromScene?: boolean): void {
    this.thrustFlame.destroy();
    super.destroy(fromScene);
  }
}
