import { Math as PhaserMath } from "phaser";
import type { GameObjects, Scene } from "phaser";
import {
  getSpaceDefenderVectorMetadata,
  createEmptyVectorMetadata,
} from "../config/vectorAssets";
import { VectorPhysicsPuppet } from "./VectorPhysicsPuppet";

export class Missile extends VectorPhysicsPuppet {
  private lifespan = 3000;
  private spawnTime = 0;
  private speed = 250;
  private turnRate = 0.03;
  private trailEmitter: GameObjects.Particles.ParticleEmitter;
  private hasExploded = false;
  private onAutoDetonate?: (missile: Missile) => void;
  private exhaustAngleDeg = 0;

  constructor(scene: Scene, x: number, y: number, aimAngle: number) {
    super(
      scene,
      x,
      y,
      getSpaceDefenderVectorMetadata(
        scene,
        "missile",
        createEmptyVectorMetadata(28, 18),
      ),
      24,
      12,
    );

    this.setBodySize(24, 12);
    this.setRotation(aimAngle);
    this.exhaustAngleDeg = PhaserMath.RadToDeg(aimAngle + Math.PI);

    this.trailEmitter = scene.add.particles(x, y, "particle", {
      color: [0xffffff, 0xffee66, 0xffaa22, 0xff6622, 0xff3311],
      colorEase: "quad.out",
      lifespan: 100,
      scale: { start: 0.9, end: 0, ease: "sine.out" },
      speed: { min: 80, max: 120 },
      blendMode: "ADD",
      frequency: 12,
      quantity: 2,
      angle: {
        onEmit: () =>
          PhaserMath.FloatBetween(
            this.exhaustAngleDeg - 8,
            this.exhaustAngleDeg + 8,
          ),
      },
      emitting: false,
    });
  }

  fire(): void {
    this.spawnTime = this.scene.time.now;
    this.setVelocity(
      Math.cos(this.rotation) * this.speed,
      Math.sin(this.rotation) * this.speed,
    );
    this.trailEmitter.emitting = true;
  }

  setOnAutoDetonate(callback: (missile: Missile) => void): void {
    this.onAutoDetonate = callback;
  }

  override update(): void {
    super.update(this.scene.time.now, this.scene.game.loop.delta);

    if (this.hasExploded) return;

    if (this.scene.time.now - this.spawnTime > this.lifespan) {
      if (this.onAutoDetonate) {
        this.onAutoDetonate(this);
      } else {
        this.explode();
      }
      return;
    }

    const pointer = this.scene.input.activePointer;
    const targetAngle = PhaserMath.Angle.Between(
      this.x,
      this.y,
      pointer.worldX,
      pointer.worldY,
    );
    const currentAngle = Math.atan2(
      this.arcadeBody.velocity.y,
      this.arcadeBody.velocity.x,
    );
    const angleDiff = PhaserMath.Angle.Wrap(targetAngle - currentAngle);
    const newAngle = currentAngle + angleDiff * this.turnRate;

    this.setVelocity(
      Math.cos(newAngle) * this.speed,
      Math.sin(newAngle) * this.speed,
    );
    this.setRotation(newAngle);

    const exhaustAngle = newAngle + Math.PI;
    this.exhaustAngleDeg = PhaserMath.RadToDeg(exhaustAngle);
    const exhaust = this.getSocketWorldPosition("socket_exhaust");
    this.trailEmitter.setPosition(exhaust.x, exhaust.y);

    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    if (this.x < 0) this.x = width;
    else if (this.x > width) this.x = 0;

    if (this.y < 0) this.y = height;
    else if (this.y > height) this.y = 0;
  }

  explode(): { x: number; y: number; radius: number } | null {
    if (this.hasExploded) return null;

    this.hasExploded = true;
    const explosionData = { x: this.x, y: this.y, radius: 55 };

    this.trailEmitter.emitting = false;
    this.trailEmitter.destroy();
    this.destroy();

    return explosionData;
  }

  override destroy(fromScene?: boolean): void {
    if (this.trailEmitter && !this.hasExploded) {
      this.trailEmitter.destroy();
    }
    super.destroy(fromScene);
  }
}
