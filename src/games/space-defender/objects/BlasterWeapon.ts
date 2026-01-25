import { Scene } from "phaser";
import { Weapon } from "./Weapon";
import { Ship } from "./Ship";
import { Bullet } from "./Bullet";

export class BlasterWeapon implements Weapon {
  name = "BLASTER";
  cooldown = 150;
  unlockScore = 0;
  textureKey = "blaster_icon";

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
