import Phaser from "phaser";
export type AsteroidSize = "large" | "medium" | "small";
export declare class Asteroid extends Phaser.Physics.Arcade.Sprite {
  asteroidSize: AsteroidSize;
  points: number;
  private storedVelocityX;
  private storedVelocityY;
  private storedAngularVelocity;
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    size?: AsteroidSize,
    velocityX?: number,
    velocityY?: number,
  );
  launch(): void;
  update(): void;
  split(impactAngle?: number): Asteroid[];
}
