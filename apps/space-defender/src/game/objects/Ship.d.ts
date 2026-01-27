import type { Physics, Scene } from "phaser";
export declare class Ship extends Physics.Arcade.Sprite {
  private wasd;
  private thrustSpeed;
  private drag;
  private isInvulnerable;
  private invulnerabilityTimer?;
  private aimAngle;
  private targetAimAngle;
  private rotationVelocity;
  private rotationAccel;
  private maxRotationSpeed;
  private rotationDamping;
  private exhaustAngleDeg;
  private thrustEmitter;
  constructor(scene: Scene, x: number, y: number);
  update(): void;
  makeInvulnerable(duration?: number): void;
  getIsInvulnerable(): boolean;
  getAimAngle(): number;
  respawn(x: number, y: number): void;
  stopThrust(): void;
}
