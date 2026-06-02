import { Physics, Scene } from "phaser";
import { Weapon } from "./Weapon";
import { Ship } from "./Ship";
import { Bullet } from "./Bullet";
import { spawnMuzzleFlash } from "./VectorEffects";

export class AutocannonWeapon implements Weapon {
  name = "AUTOCANNON";
  cooldown = 120; // Slightly faster fire rate
  unlockScore = 0;
  textureKey = "autocannonIcon";

  private bullets: Physics.Arcade.Group | null = null;

  setBulletGroup(group: Physics.Arcade.Group): void {
    this.bullets = group;
  }

  fire(scene: Scene, ship: Ship, _targetX: number, _targetY: number): void {
    if (!this.bullets) return;

    const muzzle = ship.getMuzzleWorldPosition();
    spawnMuzzleFlash(scene, muzzle.x, muzzle.y, ship.getAimAngle());

    const bullet = new Bullet(scene, muzzle.x, muzzle.y, ship.getAimAngle());
    this.bullets.add(bullet);
    bullet.fire();
  }
}
