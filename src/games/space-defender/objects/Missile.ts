import Phaser from "phaser";

export class Missile extends Phaser.Physics.Arcade.Sprite {
  private lifespan: number = 3000;
  private spawnTime: number = 0;
  private speed: number = 250;
  private turnRate: number = 0.03;
  private trailEmitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private hasExploded: boolean = false;
  private onAutoDetonate?: (missile: Missile) => void;
  private exhaustAngleDeg: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, aimAngle: number) {
    super(scene, x, y, "missile");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Sprite points right by default, so rotation = aimAngle
    this.setRotation(aimAngle);
    this.exhaustAngleDeg = Phaser.Math.RadToDeg(aimAngle + Math.PI);

    // Create flame trail
    this.trailEmitter = scene.add.particles(x, y, "missile_trail", {
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
          Phaser.Math.FloatBetween(
            this.exhaustAngleDeg - 8,
            this.exhaustAngleDeg + 8,
          ),
      },
      emitting: false,
    });
  }

  fire(): void {
    this.spawnTime = this.scene.time.now;
    // Rotation directly equals the travel angle
    this.setVelocity(
      Math.cos(this.rotation) * this.speed,
      Math.sin(this.rotation) * this.speed,
    );
    this.trailEmitter.emitting = true;
  }

  setOnAutoDetonate(callback: (missile: Missile) => void): void {
    this.onAutoDetonate = callback;
  }

  update(): void {
    if (this.hasExploded) return;

    // Check lifespan - auto-detonate after 3 seconds
    if (this.scene.time.now - this.spawnTime > this.lifespan) {
      if (this.onAutoDetonate) {
        this.onAutoDetonate(this);
      } else {
        this.explode();
      }
      return;
    }

    // Track mouse cursor
    const pointer = this.scene.input.activePointer;
    const targetAngle = Phaser.Math.Angle.Between(
      this.x,
      this.y,
      pointer.worldX,
      pointer.worldY,
    );

    // Current velocity angle
    const currentAngle = Math.atan2(
      this.body?.velocity.y ?? 0,
      this.body?.velocity.x ?? 0,
    );

    // Smoothly rotate toward target
    let angleDiff = targetAngle - currentAngle;

    // Normalize angle difference to -PI to PI
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    const newAngle = currentAngle + angleDiff * this.turnRate;

    this.setVelocity(
      Math.cos(newAngle) * this.speed,
      Math.sin(newAngle) * this.speed,
    );
    this.setRotation(newAngle);

    // Update trail position and angle
    const exhaustAngle = newAngle + Math.PI;
    this.exhaustAngleDeg = Phaser.Math.RadToDeg(exhaustAngle);
    this.trailEmitter.setPosition(
      this.x - Math.cos(newAngle) * 10,
      this.y - Math.sin(newAngle) * 10,
    );

    // Screen wrap
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

  destroy(fromScene?: boolean): void {
    if (this.trailEmitter && !this.hasExploded) {
      this.trailEmitter.destroy();
    }
    super.destroy(fromScene);
  }
}
