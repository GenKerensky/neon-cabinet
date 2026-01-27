import { Physics, Scene } from "phaser";
import { Weapon } from "./Weapon";
import { Ship } from "./Ship";
import { RayBeam } from "./RayBeam";

export class RayGunWeapon implements Weapon {
  name = "RAY GUN";
  cooldown = 2000;
  unlockScore = 3000;
  textureKey = "ray_gun_icon";

  private bullets: Physics.Arcade.Group | null = null;
  private asteroidGroup: Physics.Arcade.Group | null = null;

  setBulletGroup(group: Physics.Arcade.Group): void {
    this.bullets = group;
  }

  setAsteroidGroup(group: Physics.Arcade.Group): void {
    this.asteroidGroup = group;
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
