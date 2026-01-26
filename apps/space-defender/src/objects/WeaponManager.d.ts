import Phaser, { Scene } from "phaser";
import { Weapon } from "./Weapon";
import { Missile } from "./Missile";
import { Ship } from "./Ship";
import { Asteroid } from "./Asteroid";
export declare class WeaponManager {
  private weapons;
  private currentWeaponIndex;
  private unlockedWeapons;
  private scene;
  private onWeaponUnlock?;
  private onWeaponChange?;
  private missileGroup;
  private missileWeapon;
  constructor(
    scene: Scene,
    bulletGroup: Phaser.Physics.Arcade.Group,
    asteroidGroup: Phaser.Physics.Arcade.Group,
  );
  setOnMissileAutoDetonate(callback: (missile: Missile) => void): void;
  getMissileGroup(): Phaser.Physics.Arcade.Group;
  setOnWeaponUnlock(callback: (weapon: Weapon) => void): void;
  setOnWeaponChange(callback: (weapon: Weapon) => void): void;
  getCurrentWeapon(): Weapon;
  getCooldown(): number;
  checkUnlocks(score: number): void;
  cycleWeapon(): void;
  unlockAll(): void;
  fire(
    ship: Ship,
    targetX: number,
    targetY: number,
    onHitAsteroid?: (asteroid: Asteroid, x: number, y: number) => void,
  ): void;
  getUnlockedWeapons(): Weapon[];
  isWeaponUnlocked(index: number): boolean;
}
