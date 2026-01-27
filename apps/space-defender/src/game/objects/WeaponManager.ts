import { Math as PhaserMath, Physics } from "phaser";
import type { Scene } from "phaser";
import { Weapon } from "./Weapon";
import { AutocannonWeapon } from "./AutocannonWeapon";
import { RayGunWeapon } from "./RayGunWeapon";
import { LaserWeapon } from "./LaserWeapon";
import { MissileWeapon } from "./MissileWeapon";
import { Missile } from "./Missile";
import { Ship } from "./Ship";
import { Asteroid } from "./Asteroid";

export class WeaponManager {
  private weapons: Weapon[] = [];
  private currentWeaponIndex: number = 0;
  private unlockedWeapons: Set<number> = new Set([0]);
  private scene: Scene;
  private onWeaponUnlock?: (weapon: Weapon) => void;
  private onWeaponChange?: (weapon: Weapon) => void;
  private missileGroup: Physics.Arcade.Group;
  private missileWeapon: MissileWeapon;

  constructor(
    scene: Scene,
    bulletGroup: Physics.Arcade.Group,
    asteroidGroup: Physics.Arcade.Group,
  ) {
    this.scene = scene;

    // Create missile group
    this.missileGroup = scene.physics.add.group({
      runChildUpdate: true,
    });

    // Initialize weapons
    const autocannon = new AutocannonWeapon();
    autocannon.setBulletGroup(bulletGroup);

    const laser = new LaserWeapon();
    laser.setAsteroidGroup(asteroidGroup);

    this.missileWeapon = new MissileWeapon();
    this.missileWeapon.setMissileGroup(this.missileGroup);

    const rayGun = new RayGunWeapon();
    rayGun.setBulletGroup(bulletGroup);
    rayGun.setAsteroidGroup(asteroidGroup);

    this.weapons = [autocannon, laser, this.missileWeapon, rayGun];
  }

  setOnMissileAutoDetonate(callback: (missile: Missile) => void): void {
    this.missileWeapon.setOnAutoDetonate(callback);
  }

  getMissileGroup(): Physics.Arcade.Group {
    return this.missileGroup;
  }

  setOnWeaponUnlock(callback: (weapon: Weapon) => void): void {
    this.onWeaponUnlock = callback;
  }

  setOnWeaponChange(callback: (weapon: Weapon) => void): void {
    this.onWeaponChange = callback;
  }

  getCurrentWeapon(): Weapon {
    return this.weapons[this.currentWeaponIndex];
  }

  getCooldown(): number {
    return this.getCurrentWeapon().cooldown;
  }

  checkUnlocks(score: number): void {
    this.weapons.forEach((weapon, index) => {
      if (!this.unlockedWeapons.has(index) && score >= weapon.unlockScore) {
        this.unlockedWeapons.add(index);
        this.onWeaponUnlock?.(weapon);

        // Auto-switch to newly unlocked weapon
        this.currentWeaponIndex = index;
        this.onWeaponChange?.(weapon);
      }
    });
  }

  cycleWeapon(): void {
    const unlockedArray = Array.from(this.unlockedWeapons).sort(
      (a, b) => a - b,
    );
    const currentPos = unlockedArray.indexOf(this.currentWeaponIndex);
    const nextPos = (currentPos + 1) % unlockedArray.length;
    this.currentWeaponIndex = unlockedArray[nextPos];
    this.onWeaponChange?.(this.getCurrentWeapon());
  }

  unlockAll(): void {
    this.weapons.forEach((_, index) => {
      this.unlockedWeapons.add(index);
    });
  }

  fire(
    ship: Ship,
    targetX: number,
    targetY: number,
    onHitAsteroid?: (asteroid: Asteroid, x: number, y: number) => void,
  ): void {
    const weapon = this.getCurrentWeapon();

    if (weapon instanceof LaserWeapon) {
      // For laser, we need to handle hits differently
      const asteroidGroup = (weapon as LaserWeapon)["asteroidGroup"];
      weapon.fire(this.scene, ship, targetX, targetY, (x, y) => {
        // Find the asteroid at this position and trigger hit
        if (asteroidGroup) {
          const asteroids = asteroidGroup.getChildren() as Asteroid[];
          asteroids.forEach((asteroid) => {
            if (!asteroid.active) return;
            const dist = PhaserMath.Distance.Between(
              x,
              y,
              asteroid.x,
              asteroid.y,
            );
            if (dist < (asteroid.width * asteroid.scaleX) / 2 + 6) {
              onHitAsteroid?.(asteroid, asteroid.x, asteroid.y);
            }
          });
        }
      });
    } else if (weapon instanceof RayGunWeapon) {
      // For ray gun, handle hits through the beam's collision detection
      weapon.fire(this.scene, ship, targetX, targetY, (x, y) => {
        // This callback is called by the beam when it detects a hit
        // Find the asteroid and trigger the handler
        const asteroidGroup = (weapon as RayGunWeapon)["asteroidGroup"];
        if (asteroidGroup && onHitAsteroid) {
          const asteroids = asteroidGroup.getChildren() as Asteroid[];
          let closestAsteroid: Asteroid | null = null;
          let closestDist = Infinity;
          for (const asteroid of asteroids) {
            if (!asteroid.active) continue;
            const dist = PhaserMath.Distance.Between(
              x,
              y,
              asteroid.x,
              asteroid.y,
            );
            if (
              dist < closestDist &&
              dist < (asteroid.width * asteroid.scaleX) / 2 + 20
            ) {
              closestDist = dist;
              closestAsteroid = asteroid;
            }
          }
          if (closestAsteroid) {
            onHitAsteroid(
              closestAsteroid,
              closestAsteroid.x,
              closestAsteroid.y,
            );
          }
        }
      });
    } else {
      weapon.fire(this.scene, ship, targetX, targetY);
    }
  }

  getUnlockedWeapons(): Weapon[] {
    return Array.from(this.unlockedWeapons)
      .sort((a, b) => a - b)
      .map((i) => this.weapons[i]);
  }

  isWeaponUnlocked(index: number): boolean {
    return this.unlockedWeapons.has(index);
  }
}
