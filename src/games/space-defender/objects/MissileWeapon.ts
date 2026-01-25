import { Scene } from "phaser";
import { Weapon } from "./Weapon";
import { Ship } from "./Ship";
import { Missile } from "./Missile";

export class MissileWeapon implements Weapon {
  name = "MISSILE";
  cooldown = 800;
  unlockScore = 2000;
  textureKey = "missile_icon";

  private missiles: Phaser.Physics.Arcade.Group | null = null;
  private onAutoDetonate?: (missile: Missile) => void;

  setMissileGroup(group: Phaser.Physics.Arcade.Group): void {
    this.missiles = group;
  }

  setOnAutoDetonate(callback: (missile: Missile) => void): void {
    this.onAutoDetonate = callback;
  }

  fire(scene: Scene, ship: Ship, _targetX: number, _targetY: number): void {
    if (!this.missiles) return;

    const missile = new Missile(scene, ship.x, ship.y, ship.getAimAngle());
    if (this.onAutoDetonate) {
      missile.setOnAutoDetonate(this.onAutoDetonate);
    }
    this.missiles.add(missile);
    missile.fire();
  }
}
