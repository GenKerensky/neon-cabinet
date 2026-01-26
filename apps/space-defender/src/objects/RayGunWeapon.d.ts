import { Scene } from "phaser";
import { Weapon } from "./Weapon";
import { Ship } from "./Ship";
export declare class RayGunWeapon implements Weapon {
  name: string;
  cooldown: number;
  unlockScore: number;
  textureKey: string;
  private bullets;
  private asteroidGroup;
  setBulletGroup(group: Phaser.Physics.Arcade.Group): void;
  setAsteroidGroup(group: Phaser.Physics.Arcade.Group): void;
  fire(
    scene: Scene,
    ship: Ship,
    _targetX: number,
    _targetY: number,
    onHitAsteroid?: (x: number, y: number) => void,
  ): void;
}
