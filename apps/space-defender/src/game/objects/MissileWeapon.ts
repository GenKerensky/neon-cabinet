import { Physics, Scene } from "phaser";
import { Weapon } from "./Weapon";
import { Ship } from "./Ship";
import { Missile } from "./Missile";
import { spawnMuzzleFlash } from "./VectorEffects";

export class MissileWeapon implements Weapon {
  name = "MISSILE";
  cooldown = 800;
  unlockScore = 2000;
  textureKey = "missileIcon";

  private missiles: Physics.Arcade.Group | null = null;
  private onAutoDetonate?: (missile: Missile) => void;

  setMissileGroup(group: Physics.Arcade.Group): void {
    this.missiles = group;
  }

  setOnAutoDetonate(callback: (missile: Missile) => void): void {
    this.onAutoDetonate = callback;
  }

  fire(scene: Scene, ship: Ship, _targetX: number, _targetY: number): void {
    if (!this.missiles) return;

    const muzzle = ship.getMuzzleWorldPosition();
    spawnMuzzleFlash(scene, muzzle.x, muzzle.y, ship.getAimAngle());

    const missile = new Missile(scene, muzzle.x, muzzle.y, ship.getAimAngle());
    if (this.onAutoDetonate) {
      missile.setOnAutoDetonate(this.onAutoDetonate);
    }
    this.missiles.add(missile);
    missile.fire();
  }
}
