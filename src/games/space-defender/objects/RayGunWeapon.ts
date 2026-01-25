import { Scene } from "phaser";
import { Weapon } from "./Weapon";
import { Ship } from "./Ship";
import { RayBeam } from "./RayBeam";
import { Asteroid } from "./Asteroid";

export class RayGunWeapon implements Weapon {
  name = "RAY GUN";
  cooldown = 2000;
  unlockScore = 3000;
  textureKey = "ray_gun_icon";

  private bullets: Phaser.Physics.Arcade.Group | null = null;
  private asteroidGroup: Phaser.Physics.Arcade.Group | null = null;
  private onHitAsteroid?: (asteroid: Asteroid) => void;

  setBulletGroup(group: Phaser.Physics.Arcade.Group): void {
    this.bullets = group;
  }

  setAsteroidGroup(group: Phaser.Physics.Arcade.Group): void {
    this.asteroidGroup = group;
  }

  setOnHitAsteroid(callback: (asteroid: Asteroid) => void): void {
    this.onHitAsteroid = callback;
  }

  fire(
    scene: Scene,
    ship: Ship,
    _targetX: number,
    _targetY: number,
    onHitAsteroid?: (x: number, y: number) => void,
  ): void {
    if (!this.bullets) return;

    const beam = new RayBeam(scene, ship.x, ship.y, ship.getAimAngle());
    if (this.asteroidGroup) {
      beam.setAsteroidGroup(this.asteroidGroup);
    }
    if (onHitAsteroid) {
      beam.setOnHitAsteroid((asteroid) => {
        onHitAsteroid(asteroid.x, asteroid.y);
      });
    }
    this.bullets.add(beam);
    beam.fire();
  }
}
