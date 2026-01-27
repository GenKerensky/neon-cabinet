import { Physics } from "phaser";
import type { GameObjects, Scene } from "phaser";

export class Bullet extends Physics.Arcade.Sprite {
  private lifespan: number = 2000;
  private spawnTime: number = 0;
  private aimAngle: number = 0;
  private speed: number = 500;
  private trailEmitter: GameObjects.Particles.ParticleEmitter;
  private bloomGlow: GameObjects.Graphics;

  constructor(scene: Scene, x: number, y: number, aimAngle: number) {
    super(scene, x, y, "bullet");

    this.aimAngle = aimAngle;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Create bloom glow effect
    this.bloomGlow = scene.add.graphics();
    this.bloomGlow.setDepth(this.depth - 1);
    this.updateBloomGlow();

    // Create enhanced trailing particle effect with fade
    this.trailEmitter = scene.add.particles(x, y, "bullet_trail", {
      speed: { min: 0, max: 5 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1.0, end: 0 },
      lifespan: { min: 150, max: 250 },
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
    // Subtle glow for autocannon tracer - elongated ellipses
    this.bloomGlow.fillStyle(0xffd700, 0.1);
    this.bloomGlow.fillEllipse(0, 0, 10, 4);
    this.bloomGlow.fillStyle(0xffaa00, 0.2);
    this.bloomGlow.fillEllipse(0, 0, 6, 3);
    this.bloomGlow.fillStyle(0xffff00, 0.3);
    this.bloomGlow.fillEllipse(0, 0, 4, 2);
  }

  update(): void {
    // Check lifespan
    if (this.scene.time.now - this.spawnTime > this.lifespan) {
      this.destroy();
      return;
    }

    // Update bloom glow position
    this.bloomGlow.setPosition(this.x, this.y);
    this.bloomGlow.setDepth(this.depth - 1);

    // Update trail emitter position to follow bullet exactly
    this.trailEmitter.setPosition(this.x, this.y);

    // Screen wrap
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    if (this.x < 0) this.x = width;
    else if (this.x > width) this.x = 0;

    if (this.y < 0) this.y = height;
    else if (this.y > height) this.y = 0;
  }

  destroy(fromScene?: boolean): void {
    this.trailEmitter.destroy();
    this.bloomGlow.destroy();
    super.destroy(fromScene);
  }
}
