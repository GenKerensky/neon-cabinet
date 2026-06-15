import type { GameObjects, Scene } from "phaser";
import {
  getSpaceDefenderVectorMetadata,
  createEmptyVectorMetadata,
} from "../config/vectorAssets";
import { VectorPhysicsPuppet } from "./VectorPhysicsPuppet";

export class Bullet extends VectorPhysicsPuppet {
  private lifespan = 2000;
  private spawnTime = 0;
  private aimAngle = 0;
  private speed = 500;
  private trailEmitter: GameObjects.Particles.ParticleEmitter;
  private bloomGlow: GameObjects.Graphics;

  constructor(scene: Scene, x: number, y: number, aimAngle: number) {
    super(
      scene,
      x,
      y,
      getSpaceDefenderVectorMetadata(
        scene,
        "bullet",
        createEmptyVectorMetadata(16, 6),
      ),
      14,
      4,
    );

    this.aimAngle = aimAngle;
    this.setBodySize(14, 4);

    this.bloomGlow = scene.add.graphics();
    this.bloomGlow.setDepth(this.depth - 1);
    this.updateBloomGlow();

    this.trailEmitter = scene.add.particles(x, y, "particle", {
      speed: { min: 0, max: 5 },
      scale: { start: 0.35, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: { min: 120, max: 220 },
      tint: [0xffd700, 0xffaa00, 0xffffff],
      blendMode: "ADD",
      frequency: 3,
      quantity: 1,
      emitting: false,
    });
  }

  fire(): void {
    this.spawnTime = this.scene.time.now;
    this.setVelocity(
      Math.cos(this.aimAngle) * this.speed,
      Math.sin(this.aimAngle) * this.speed,
    );
    this.setRotation(this.aimAngle);
    this.trailEmitter.emitting = true;
  }

  private updateBloomGlow(): void {
    this.bloomGlow.clear();
    this.bloomGlow.fillStyle(0xffd700, 0.1);
    this.bloomGlow.fillEllipse(0, 0, 12, 5);
    this.bloomGlow.fillStyle(0xffaa00, 0.2);
    this.bloomGlow.fillEllipse(0, 0, 7, 3);
    this.bloomGlow.fillStyle(0xffff00, 0.3);
    this.bloomGlow.fillEllipse(0, 0, 4, 2);
  }

  override update(): void {
    super.update(this.scene.time.now, this.scene.game.loop.delta);

    if (this.scene.time.now - this.spawnTime > this.lifespan) {
      this.destroy();
      return;
    }

    this.bloomGlow.setPosition(this.x, this.y);
    this.bloomGlow.setDepth(this.depth - 1);
    this.trailEmitter.setPosition(this.x, this.y);

    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    if (this.x < 0) this.x = width;
    else if (this.x > width) this.x = 0;

    if (this.y < 0) this.y = height;
    else if (this.y > height) this.y = 0;
  }

  override destroy(fromScene?: boolean): void {
    this.trailEmitter.destroy();
    this.bloomGlow.destroy();
    super.destroy(fromScene);
  }
}
