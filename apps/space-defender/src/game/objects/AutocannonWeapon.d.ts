import type { Physics, Scene } from "phaser";
import { Weapon } from "./Weapon";
import { Ship } from "./Ship";
export declare class AutocannonWeapon implements Weapon {
  name: string;
  cooldown: number;
  unlockScore: number;
  textureKey: string;
  private bullets;
  setBulletGroup(group: Physics.Arcade.Group): void;
  fire(scene: Scene, ship: Ship, _targetX: number, _targetY: number): void;
}
