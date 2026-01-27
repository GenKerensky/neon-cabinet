import { Vector3D } from "../../engine/Vector3D";
import {
  Weapon,
  WeaponType,
  FireResult,
  AmmoDisplay,
  ReloadDisplay,
} from "./Weapon";
import { AutocannonWeapon } from "./AutocannonWeapon";

export interface WeaponInfo {
  name: string;
  type: WeaponType;
  selected: boolean;
}

/**
 * Manages player weapon inventory and switching
 */
export class WeaponManager {
  private weapons: Weapon[] = [];
  private currentIndex = 0;

  constructor() {
    // Start with autocannon
    this.weapons.push(new AutocannonWeapon());
  }

  /**
   * Add a new weapon to inventory
   */
  addWeapon(weapon: Weapon): void {
    // Check if we already have this weapon type
    const exists = this.weapons.some((w) => w.type === weapon.type);
    if (!exists) {
      this.weapons.push(weapon);
    }
  }

  /**
   * Check if player has a specific weapon type
   */
  hasWeapon(type: WeaponType): boolean {
    return this.weapons.some((w) => w.type === type);
  }

  /**
   * Get the currently selected weapon
   */
  getCurrentWeapon(): Weapon {
    return this.weapons[this.currentIndex];
  }

  /**
   * Get current weapon type
   */
  getCurrentWeaponType(): WeaponType {
    return this.weapons[this.currentIndex].type;
  }

  /**
   * Cycle to next weapon (E key)
   */
  cycleNext(): void {
    if (this.weapons.length > 1) {
      this.currentIndex = (this.currentIndex + 1) % this.weapons.length;
    }
  }

  /**
   * Cycle to previous weapon (Q key)
   */
  cyclePrev(): void {
    if (this.weapons.length > 1) {
      this.currentIndex =
        (this.currentIndex - 1 + this.weapons.length) % this.weapons.length;
    }
  }

  /**
   * Update all weapons (handles reload/recharge for all)
   */
  updateAll(delta: number): void {
    for (const weapon of this.weapons) {
      weapon.update(delta);
    }
  }

  /**
   * Fire the current weapon
   */
  fire(position: Vector3D, direction: Vector3D): FireResult | null {
    return this.getCurrentWeapon().fire(position, direction);
  }

  /**
   * Check if current weapon can fire
   */
  canFire(): boolean {
    return this.getCurrentWeapon().canFire();
  }

  /**
   * Start reload on current weapon
   */
  startReload(): void {
    this.getCurrentWeapon().startReload();
  }

  /**
   * Get ammo display for current weapon
   */
  getAmmoDisplay(): AmmoDisplay {
    return this.getCurrentWeapon().getAmmoDisplay();
  }

  /**
   * Get reload display for current weapon
   */
  getReloadDisplay(): ReloadDisplay {
    return this.getCurrentWeapon().getReloadDisplay();
  }

  /**
   * Get list of weapons for HUD display
   */
  getWeaponList(): WeaponInfo[] {
    return this.weapons.map((weapon, index) => ({
      name: weapon.name,
      type: weapon.type,
      selected: index === this.currentIndex,
    }));
  }

  /**
   * Get weapon count
   */
  getWeaponCount(): number {
    return this.weapons.length;
  }

  /**
   * Reset all weapons to full state
   */
  resetAll(): void {
    for (const weapon of this.weapons) {
      weapon.reset();
    }
  }
}
