import type { Physics, Scene } from "phaser";
import { Weapon } from "./Weapon";
import { Ship } from "./Ship";
export declare class LaserWeapon implements Weapon {
  name: string;
  cooldown: number;
  unlockScore: number;
  textureKey: string;
  private asteroidGroup;
  private beamGraphics;
  private beamTween;
  setAsteroidGroup(group: Physics.Arcade.Group): void;
  fire(
    scene: Scene,
    ship: Ship,
    targetX: number,
    targetY: number,
    onHitAsteroid?: (x: number, y: number) => void,
  ): void;
  private drawBeam;
  private lineIntersectsCircle;
}
