import { Scene } from "phaser";
import { Weapon } from "./Weapon";
import { Ship } from "./Ship";
import { Bullet } from "./Bullet";

export class AutocannonWeapon implements Weapon {
  name = "AUTOCANNON";
  cooldown = 120; // Slightly faster fire rate
  unlockScore = 0;
  textureKey = "autocannon_icon";

  private bullets: Phaser.Physics.Arcade.Group | null = null;

  setBulletGroup(group: Phaser.Physics.Arcade.Group): void {
    this.bullets = group;
  }

  fire(scene: Scene, ship: Ship, _targetX: number, _targetY: number): void {
    if (!this.bullets) return;

    const bullet = new Bullet(scene, ship.x, ship.y, ship.getAimAngle());
    this.bullets.add(bullet);
    bullet.fire();
  }
}
