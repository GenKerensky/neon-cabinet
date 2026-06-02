import { Vector3D } from "../engine/Vector3D";
import { circleAabbCollisionXZ } from "../engine/CollisionMath";
import { Obstacle } from "./Obstacle";

export interface SpawnPlannerConfig {
  minDistance: number;
  maxDistance: number;
  minSpacing: number;
  maxAttempts?: number;
  obstacles?: readonly Obstacle[];
}

export class SpawnPlanner {
  private readonly minDistance: number;
  private readonly maxDistance: number;
  private readonly minSpacing: number;
  private readonly maxAttempts: number;
  private readonly obstacles: readonly Obstacle[];

  constructor(config: SpawnPlannerConfig) {
    this.minDistance = config.minDistance;
    this.maxDistance = config.maxDistance;
    this.minSpacing = config.minSpacing;
    this.maxAttempts = config.maxAttempts ?? 50;
    this.obstacles = config.obstacles ?? [];
  }

  planEnemySpawn(
    playerPos: Vector3D,
    occupiedPositions: readonly Vector3D[],
  ): Vector3D {
    let fallback: Vector3D | null = null;

    for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
      const position = this.randomRingPosition(playerPos);
      fallback ??= position;

      if (this.isValid(position, playerPos, occupiedPositions)) {
        return position;
      }
    }

    return fallback ?? this.fallbackPosition(playerPos);
  }

  private randomRingPosition(playerPos: Vector3D): Vector3D {
    const angle = Math.random() * Math.PI * 2;
    const distance =
      this.minDistance + Math.random() * (this.maxDistance - this.minDistance);

    return new Vector3D(
      playerPos.x + Math.cos(angle) * distance,
      0,
      playerPos.z + Math.sin(angle) * distance,
    );
  }

  private fallbackPosition(playerPos: Vector3D): Vector3D {
    return new Vector3D(playerPos.x + this.minDistance, 0, playerPos.z);
  }

  private isValid(
    position: Vector3D,
    playerPos: Vector3D,
    occupiedPositions: readonly Vector3D[],
  ): boolean {
    if (!this.hasSpacing(position, playerPos, this.minDistance)) return false;

    for (const occupied of occupiedPositions) {
      if (!this.hasSpacing(position, occupied, this.minSpacing)) return false;
    }

    for (const obstacle of this.obstacles) {
      if (
        circleAabbCollisionXZ(position, this.minSpacing, obstacle.getBounds())
          .collides
      ) {
        return false;
      }

      if (obstacle.raycast(playerPos, position, 0)) {
        return false;
      }
    }

    return true;
  }

  private hasSpacing(a: Vector3D, b: Vector3D, minDistance: number): boolean {
    const dx = a.x - b.x;
    const dz = a.z - b.z;
    return dx * dx + dz * dz >= minDistance * minDistance;
  }
}
