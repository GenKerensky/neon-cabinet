import { Vector3D } from "../engine/Vector3D";
import { WireframeRenderer } from "../engine/WireframeRenderer";
import { Pickup, createArmorPickup, createWeaponPickup } from "./Pickup";

export interface PickupManagerConfig {
  minSpawnDistance: number;
  maxSpawnDistance: number;
  minSpacing: number;
  armorPickupsPerWave: number;
}

const DEFAULT_CONFIG: PickupManagerConfig = {
  minSpawnDistance: 400,
  maxSpawnDistance: 1200,
  minSpacing: 200,
  armorPickupsPerWave: 3,
};

/**
 * Manages pickup spawning and collection
 */
export class PickupManager {
  private pickups: Pickup[] = [];
  private config: PickupManagerConfig;

  constructor(config?: Partial<PickupManagerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate pickups for a wave
   */
  generatePickups(
    waveNumber: number,
    playerPos: Vector3D,
    occupiedPositions: Vector3D[],
    playerHasLaser: boolean,
  ): void {
    this.pickups = [];

    const allOccupied = [...occupiedPositions];

    // Spawn armor pickups (2-4 per wave)
    const armorCount =
      2 + Math.floor(Math.random() * (this.config.armorPickupsPerWave - 1));
    for (let i = 0; i < armorCount; i++) {
      const pos = this.findSpawnPosition(playerPos, allOccupied);
      if (pos) {
        this.pickups.push(createArmorPickup(pos));
        allOccupied.push(pos);
      }
    }

    // Spawn weapon pickup on wave 3+ if player doesn't have laser yet
    if (waveNumber >= 3 && !playerHasLaser) {
      const pos = this.findSpawnPosition(playerPos, allOccupied);
      if (pos) {
        this.pickups.push(createWeaponPickup(pos, "laser"));
        allOccupied.push(pos);
      }
    }
  }

  /**
   * Find a valid spawn position
   */
  private findSpawnPosition(
    playerPos: Vector3D,
    occupiedPositions: Vector3D[],
  ): Vector3D | null {
    const maxAttempts = 50;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const distance =
        this.config.minSpawnDistance +
        Math.random() *
          (this.config.maxSpawnDistance - this.config.minSpawnDistance);

      const x = playerPos.x + Math.cos(angle) * distance;
      const z = playerPos.z + Math.sin(angle) * distance;
      const position = new Vector3D(x, 0, z);

      // Check spacing from occupied positions
      let tooClose = false;
      for (const occupied of occupiedPositions) {
        const dx = position.x - occupied.x;
        const dz = position.z - occupied.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < this.config.minSpacing) {
          tooClose = true;
          break;
        }
      }

      if (!tooClose) {
        return position;
      }
    }

    return null;
  }

  /**
   * Update all pickups
   */
  update(delta: number): void {
    for (const pickup of this.pickups) {
      pickup.update(delta);
    }
    // Remove collected pickups
    this.pickups = this.pickups.filter((p) => !p.isCollected());
  }

  /**
   * Check for player collection
   * Returns collected pickup or null
   */
  checkCollection(playerPos: Vector3D, playerRadius: number): Pickup | null {
    for (const pickup of this.pickups) {
      if (pickup.checkCollection(playerPos, playerRadius)) {
        pickup.collect();
        return pickup;
      }
    }
    return null;
  }

  /**
   * Render all pickups
   */
  render(renderer: WireframeRenderer, screenW: number, screenH: number): void {
    for (const pickup of this.pickups) {
      pickup.render(renderer, screenW, screenH);
    }
  }

  /**
   * Get positions for radar display (armor pickups)
   */
  getArmorPickupPositions(): Vector3D[] {
    return this.pickups
      .filter((p) => p.type === "armor" && !p.isCollected())
      .map((p) => p.getPosition());
  }

  /**
   * Get positions for radar display (weapon pickups)
   */
  getWeaponPickupPositions(): Vector3D[] {
    return this.pickups
      .filter((p) => p.type === "weapon" && !p.isCollected())
      .map((p) => p.getPosition());
  }

  /**
   * Get all pickup positions with colors for radar
   */
  getPickupsForRadar(): { position: Vector3D; color: number }[] {
    return this.pickups
      .filter((p) => !p.isCollected())
      .map((p) => ({
        position: p.getPosition(),
        color: p.getRadarColor(),
      }));
  }

  /**
   * Clear all pickups
   */
  clear(): void {
    this.pickups = [];
  }

  /**
   * Get pickup count
   */
  getPickupCount(): number {
    return this.pickups.filter((p) => !p.isCollected()).length;
  }
}
