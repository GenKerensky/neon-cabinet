import { Vector3D } from "../engine/Vector3D";
import { WireframeModel } from "../engine/WireframeModel";
import { WireframeRenderer } from "../engine/WireframeRenderer";
import { COLORS, SHIELD_PICKUP, LASER_PICKUP } from "../models";
import { WeaponType } from "./weapons/Weapon";

export type PickupType = "armor" | "weapon";

/**
 * Base pickup class - items that can be collected by the player
 */
export class Pickup {
  position: Vector3D;
  readonly type: PickupType;
  readonly collisionRadius = 35;
  private rotation = 0;
  private rotationSpeed = 1.5; // radians per second
  private model: WireframeModel;
  private collected = false;

  // For weapon pickups
  readonly weaponType?: WeaponType;

  constructor(position: Vector3D, type: PickupType, weaponType?: WeaponType) {
    this.position = position.clone();
    this.type = type;
    this.weaponType = weaponType;

    // Select model based on type
    if (type === "armor") {
      this.model = SHIELD_PICKUP;
    } else if (weaponType === "laser") {
      this.model = LASER_PICKUP;
    } else {
      // Default to shield for unknown weapon types
      this.model = SHIELD_PICKUP;
    }

    // Random starting rotation for variety
    this.rotation = Math.random() * Math.PI * 2;
  }

  /**
   * Update pickup animation
   */
  update(delta: number): void {
    if (this.collected) return;

    // Slowly rotate for visibility
    this.rotation += this.rotationSpeed * (delta / 1000);
    while (this.rotation >= Math.PI * 2) {
      this.rotation -= Math.PI * 2;
    }
  }

  /**
   * Render the pickup
   */
  render(renderer: WireframeRenderer, screenW: number, screenH: number): void {
    if (this.collected) return;
    renderer.render(this.model, this.position, this.rotation, screenW, screenH);
  }

  /**
   * Get radar color for this pickup
   */
  getRadarColor(): number {
    return this.type === "armor" ? COLORS.pickup_armor : COLORS.pickup_weapon;
  }

  /**
   * Check if player is close enough to collect
   */
  checkCollection(playerPos: Vector3D, playerRadius: number): boolean {
    if (this.collected) return false;

    const dx = playerPos.x - this.position.x;
    const dz = playerPos.z - this.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    return dist < this.collisionRadius + playerRadius;
  }

  /**
   * Mark as collected
   */
  collect(): void {
    this.collected = true;
  }

  /**
   * Check if already collected
   */
  isCollected(): boolean {
    return this.collected;
  }

  /**
   * Get position for radar
   */
  getPosition(): Vector3D {
    return this.position.clone();
  }
}

/**
 * Factory function for armor pickup
 */
export function createArmorPickup(position: Vector3D): Pickup {
  return new Pickup(position, "armor");
}

/**
 * Factory function for weapon pickup
 */
export function createWeaponPickup(
  position: Vector3D,
  weaponType: WeaponType,
): Pickup {
  return new Pickup(position, "weapon", weaponType);
}
