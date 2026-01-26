import { Vector3D } from "../../engine/Vector3D";
import {
  Weapon,
  WeaponType,
  FireResult,
  AmmoDisplay,
  ReloadDisplay,
} from "./Weapon";

/**
 * Laser weapon - raycast-based with auto-recharge
 * No manual reload, charge regenerates automatically
 */
export class LaserWeapon implements Weapon {
  readonly name = "LASER";
  readonly type: WeaponType = "laser";

  private charge = 100; // 0-100
  private readonly maxCharge = 100;
  private readonly chargePerShot = 25;
  private readonly rechargeRate = 20; // per second
  private readonly maxRange = 2000;

  canFire(): boolean {
    return this.charge >= this.chargePerShot;
  }

  fire(position: Vector3D, direction: Vector3D): FireResult | null {
    if (!this.canFire()) {
      return null;
    }

    this.charge -= this.chargePerShot;

    // Raycast fires straight from crosshair center
    // Visual beam is rendered separately from upper right screen position
    return {
      type: "laser",
      position: position.clone(),
      direction: direction.clone(),
      maxRange: this.maxRange,
    };
  }

  update(delta: number): void {
    // Auto-recharge
    if (this.charge < this.maxCharge) {
      this.charge = Math.min(
        this.maxCharge,
        this.charge + (this.rechargeRate * delta) / 1000,
      );
    }
  }

  startReload(): void {
    // Laser doesn't have manual reload - does nothing
  }

  getAmmoDisplay(): AmmoDisplay {
    return {
      current: Math.floor(this.charge),
      max: this.maxCharge,
      label: "CHARGE",
    };
  }

  getReloadDisplay(): ReloadDisplay {
    const isRecharging = this.charge < this.maxCharge;
    return {
      isActive: isRecharging,
      progress: this.charge / this.maxCharge,
      label: "RECHARGING",
    };
  }

  reset(): void {
    this.charge = this.maxCharge;
  }

  /**
   * Get current charge percentage
   */
  getChargePercent(): number {
    return this.charge / this.maxCharge;
  }
}
