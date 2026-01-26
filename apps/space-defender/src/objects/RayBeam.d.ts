import Phaser from "phaser";
import { Asteroid } from "./Asteroid";
export declare class RayBeam extends Phaser.Physics.Arcade.Sprite {
  private lifespan;
  private spawnTime;
  private aimAngle;
  private speed;
  private startX;
  private startY;
  private beamGraphics;
  private asteroidGroup;
  private onHitAsteroid?;
  private hitAsteroids;
  constructor(scene: Phaser.Scene, x: number, y: number, aimAngle: number);
  setAsteroidGroup(group: Phaser.Physics.Arcade.Group): void;
  setOnHitAsteroid(callback: (asteroid: Asteroid) => void): void;
  fire(): void;
  private drawEllipticalArc;
  private drawBeam;
  private checkCollisions;
  update(): void;
  destroy(fromScene?: boolean): void;
}
