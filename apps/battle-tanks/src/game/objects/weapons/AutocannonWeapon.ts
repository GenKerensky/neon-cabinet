import { Vector3D } from "../../engine/Vector3D";
import {
  Weapon,
  WeaponType,
  FireResult,
  AmmoDisplay,
  ReloadDisplay,
} from "./Weapon";

/**
 * Autocannon weapon - the default tank weapon
 * Uses ammunition with manual/auto reload
 */
export class AutocannonWeapon implements Weapon {
  readonly name = "AUTOCANNON";
  readonly type: WeaponType = "autocannon";

  private readonly maxAmmo = 10;
  private currentAmmo: number;
  private isReloading = false;
  private reloadProgress = 0;
  private readonly reloadTime = 2000; // ms
  private reloadStartTime = 0;
  private currentTime = 0;

  constructor() {
    this.currentAmmo = this.maxAmmo;
  }

  canFire(): boolean {
    return this.currentAmmo > 0 && !this.isReloading;
  }

  fire(position: Vector3D, direction: Vector3D): FireResult | null {
    if (!this.canFire()) {
      return null;
    }

    this.currentAmmo--;

    // Auto-reload when empty
    if (this.currentAmmo === 0) {
      this.startReload();
    }

    return {
      type: "projectile",
      position: position.clone(),
      direction: direction.clone(),
    };
  }

  update(delta: number): void {
    this.currentTime += delta;

    if (this.isReloading) {
      const elapsed = this.currentTime - this.reloadStartTime;
      this.reloadProgress = Math.min(1, elapsed / this.reloadTime);

      if (this.reloadProgress >= 1) {
        this.isReloading = false;
        this.currentAmmo = this.maxAmmo;
        this.reloadProgress = 0;
      }
    }
  }

  startReload(): void {
    if (!this.isReloading && this.currentAmmo < this.maxAmmo) {
      this.isReloading = true;
      this.reloadProgress = 0;
      this.reloadStartTime = this.currentTime;
    }
  }

  getAmmoDisplay(): AmmoDisplay {
    return {
      current: this.currentAmmo,
      max: this.maxAmmo,
      label: "AMMO",
    };
  }

  getReloadDisplay(): ReloadDisplay {
    return {
      isActive: this.isReloading,
      progress: this.reloadProgress,
      label: "RELOADING",
    };
  }

  reset(): void {
    this.currentAmmo = this.maxAmmo;
    this.isReloading = false;
    this.reloadProgress = 0;
  }
}
