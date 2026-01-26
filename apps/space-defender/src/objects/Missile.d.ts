import Phaser from "phaser";
export declare class Missile extends Phaser.Physics.Arcade.Sprite {
  private lifespan;
  private spawnTime;
  private speed;
  private turnRate;
  private trailEmitter;
  private hasExploded;
  private onAutoDetonate?;
  private exhaustAngleDeg;
  constructor(scene: Phaser.Scene, x: number, y: number, aimAngle: number);
  fire(): void;
  setOnAutoDetonate(callback: (missile: Missile) => void): void;
  update(): void;
  explode(): {
    x: number;
    y: number;
    radius: number;
  } | null;
  destroy(fromScene?: boolean): void;
}
