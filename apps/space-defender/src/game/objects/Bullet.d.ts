import type { Physics, Scene } from "phaser";
export declare class Bullet extends Physics.Arcade.Sprite {
  private lifespan;
  private spawnTime;
  private aimAngle;
  private speed;
  private trailEmitter;
  private bloomGlow;
  constructor(scene: Scene, x: number, y: number, aimAngle: number);
  fire(): void;
  private updateBloomGlow;
  update(): void;
  destroy(fromScene?: boolean): void;
}
