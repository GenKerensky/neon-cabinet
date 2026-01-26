import { Scene } from "phaser";
import { Weapon } from "./Weapon";
import { Ship } from "./Ship";
import { Missile } from "./Missile";
export declare class MissileWeapon implements Weapon {
  name: string;
  cooldown: number;
  unlockScore: number;
  textureKey: string;
  private missiles;
  private onAutoDetonate?;
  setMissileGroup(group: Phaser.Physics.Arcade.Group): void;
  setOnAutoDetonate(callback: (missile: Missile) => void): void;
  fire(scene: Scene, ship: Ship, _targetX: number, _targetY: number): void;
}
