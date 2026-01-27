import { Vector3D } from "../../engine/Vector3D";

export type WeaponType = "autocannon" | "laser";

/**
 * Result of firing a projectile-based weapon
 */
export interface ProjectileFireResult {
  type: "projectile";
  position: Vector3D;
  direction: Vector3D;
}

/**
 * Result of firing a raycast-based weapon (laser)
 */
export interface LaserFireResult {
  type: "laser";
  position: Vector3D;
  direction: Vector3D;
  maxRange: number;
}

export type FireResult = ProjectileFireResult | LaserFireResult;

/**
 * Ammo display info for HUD
 */
export interface AmmoDisplay {
  current: number;
  max: number;
  label: string; // "AMMO" or "CHARGE"
}

/**
 * Reload/recharge display info for HUD
 */
export interface ReloadDisplay {
  isActive: boolean;
  progress: number; // 0-1
  label: string; // "RELOADING" or "RECHARGING"
}

/**
 * Base weapon interface
 */
export interface Weapon {
  readonly name: string;
  readonly type: WeaponType;

  /**
   * Check if weapon can fire
   */
  canFire(): boolean;

  /**
   * Attempt to fire the weapon
   * Returns fire result or null if cannot fire
   */
  fire(position: Vector3D, direction: Vector3D): FireResult | null;

  /**
   * Update weapon state (reload/recharge)
   */
  update(delta: number): void;

  /**
   * Manually trigger reload (for autocannon)
   */
  startReload(): void;

  /**
   * Get ammo display info for HUD
   */
  getAmmoDisplay(): AmmoDisplay;

  /**
   * Get reload/recharge display info for HUD
   */
  getReloadDisplay(): ReloadDisplay;

  /**
   * Reset weapon to full state
   */
  reset(): void;
}
