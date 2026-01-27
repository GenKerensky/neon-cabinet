import { Math as PhaserMath, Physics } from "phaser";
import type { Scene } from "phaser";
import { wrapObject } from "../utils/wrap";

export type AsteroidSize = "large" | "medium" | "small";

const ASTEROID_CONFIG: Record<
  AsteroidSize,
  {
    scale: number;
    points: number;
    speed: { min: number; max: number };
    mass: number;
  }
> = {
  large: { scale: 1.15, points: 20, speed: { min: 30, max: 60 }, mass: 3 },
  medium: { scale: 0.7, points: 50, speed: { min: 40, max: 80 }, mass: 2 },
  small: { scale: 0.35, points: 100, speed: { min: 50, max: 100 }, mass: 1 },
};

export class Asteroid extends Physics.Arcade.Sprite {
  public asteroidSize: AsteroidSize;
  public points: number;
  private storedVelocityX: number = 0;
  private storedVelocityY: number = 0;
  private storedAngularVelocity: number = 0;

  constructor(
    scene: Scene,
    x: number,
    y: number,
    size: AsteroidSize = "large",
    velocityX?: number,
    velocityY?: number,
  ) {
    const textureVariant = PhaserMath.Between(0, 4);
    super(scene, x, y, `asteroid_${textureVariant}`);

    this.asteroidSize = size;
    this.points = ASTEROID_CONFIG[size].points;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const config = ASTEROID_CONFIG[size];
    this.setScale(config.scale);

    // Store velocity to apply after adding to group
    if (velocityX === undefined || velocityY === undefined) {
      const speed = PhaserMath.Between(config.speed.min, config.speed.max);
      const angle = PhaserMath.FloatBetween(0, Math.PI * 2);
      this.storedVelocityX = Math.cos(angle) * speed;
      this.storedVelocityY = Math.sin(angle) * speed;
    } else {
      this.storedVelocityX = velocityX;
      this.storedVelocityY = velocityY;
    }

    this.storedAngularVelocity = PhaserMath.Between(-50, 50);
  }

  launch(): void {
    const body = this.body as Physics.Arcade.Body;
    if (body) {
      const config = ASTEROID_CONFIG[this.asteroidSize];

      // Set circular hitbox (account for scale)
      body.setCircle(this.width / 2);

      // Enable bounce for asteroid-asteroid collisions (nearly elastic)
      body.setBounce(1, 1);
      body.setMass(config.mass);

      // Apply velocity
      body.setVelocity(this.storedVelocityX, this.storedVelocityY);
      body.setAngularVelocity(this.storedAngularVelocity);
    }
  }

  update(): void {
    wrapObject(
      this,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      this.width * this.scaleX,
    );
  }

  split(impactAngle?: number): Asteroid[] {
    const children: Asteroid[] = [];

    // Use impact angle or current velocity angle as base direction
    const baseAngle =
      impactAngle ??
      Math.atan2(this.body?.velocity.y ?? 0, this.body?.velocity.x ?? 0);

    // Inherit some of parent's velocity
    const parentVelX = (this.body?.velocity.x ?? 0) * 0.3;
    const parentVelY = (this.body?.velocity.y ?? 0) * 0.3;

    let newSize: AsteroidSize | null = null;
    let speedMin = 60;
    let speedMax = 120;

    if (this.asteroidSize === "large") {
      newSize = "medium";
      speedMin = 60;
      speedMax = 100;
    } else if (this.asteroidSize === "medium") {
      newSize = "small";
      speedMin = 80;
      speedMax = 140;
    }

    if (newSize) {
      // Split into 2 chunks going in opposite-ish directions
      // Perpendicular to impact, with some randomness
      for (let i = 0; i < 2; i++) {
        // Offset by ~90 degrees in opposite directions + random spread
        const spreadAngle = PhaserMath.FloatBetween(-0.5, 0.5);
        const angle = baseAngle + Math.PI / 2 + Math.PI * i + spreadAngle;
        const speed = PhaserMath.Between(speedMin, speedMax);

        // Offset spawn position slightly so they don't immediately collide
        const offsetDist = 8;
        const spawnX = this.x + Math.cos(angle) * offsetDist;
        const spawnY = this.y + Math.sin(angle) * offsetDist;

        children.push(
          new Asteroid(
            this.scene,
            spawnX,
            spawnY,
            newSize,
            Math.cos(angle) * speed + parentVelX,
            Math.sin(angle) * speed + parentVelY,
          ),
        );
      }
    }

    return children;
  }
}
