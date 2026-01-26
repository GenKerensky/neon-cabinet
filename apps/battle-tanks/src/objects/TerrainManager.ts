import { Vector3D } from "../engine/Vector3D";
import { WireframeRenderer } from "../engine/WireframeRenderer";
import { Obstacle, ObstacleType } from "./Obstacle";

export interface TerrainConfig {
  // Width/depth range (horizontal footprint)
  minWidth: number;
  maxWidth: number;
  // Height range
  minHeight: number;
  maxHeight: number;
  // Spawn distance from player
  minDistance: number;
  maxDistance: number;
  // Min distance between obstacles
  minSpacing: number;
}

const DEFAULT_CONFIG: TerrainConfig = {
  minWidth: 25, // At least as wide as a turret base
  maxWidth: 80, // Wide buildings
  minHeight: 40, // Short structures
  maxHeight: 180, // Tall towers
  minDistance: 300, // Not too close to player spawn
  maxDistance: 1500, // Within play area
  minSpacing: 150, // Minimum distance between obstacles
};

/**
 * Manages terrain obstacles - cubes and pyramids
 */
export class TerrainManager {
  private obstacles: Obstacle[] = [];
  private config: TerrainConfig;

  constructor(config?: Partial<TerrainConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate terrain for a wave
   */
  generateTerrain(
    count: number,
    playerPos: Vector3D,
    enemyPositions: Vector3D[],
  ): void {
    this.obstacles = [];

    const occupiedPositions = [
      playerPos,
      ...enemyPositions,
      ...this.obstacles.map((o) => o.position),
    ];

    for (let i = 0; i < count; i++) {
      const obstacle = this.trySpawnObstacle(occupiedPositions);
      if (obstacle) {
        this.obstacles.push(obstacle);
        occupiedPositions.push(obstacle.position);
      }
    }
  }

  private trySpawnObstacle(occupiedPositions: Vector3D[]): Obstacle | null {
    const maxAttempts = 50;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Random angle and distance
      const angle = Math.random() * Math.PI * 2;
      const distance =
        this.config.minDistance +
        Math.random() * (this.config.maxDistance - this.config.minDistance);

      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      const position = new Vector3D(x, 0, z);

      // Check minimum spacing from all occupied positions
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
        // Random type
        const type: ObstacleType = Math.random() < 0.5 ? "cube" : "pyramid";

        // Random dimensions - width and depth can vary independently
        const width =
          this.config.minWidth +
          Math.random() * (this.config.maxWidth - this.config.minWidth);
        const depth =
          this.config.minWidth +
          Math.random() * (this.config.maxWidth - this.config.minWidth);

        // Height varies more dramatically
        let height =
          this.config.minHeight +
          Math.random() * (this.config.maxHeight - this.config.minHeight);

        // Pyramids tend to be taller relative to base
        if (type === "pyramid") {
          height *= 1.2;
        }

        return new Obstacle(position, type, { width, depth, height });
      }
    }

    return null;
  }

  /**
   * Get all obstacles
   */
  getObstacles(): Obstacle[] {
    return this.obstacles;
  }

  /**
   * Check if a position collides with any obstacle
   */
  checkCollision(
    position: Vector3D,
    radius: number,
  ): { collides: boolean; pushX: number; pushZ: number } {
    let totalPushX = 0;
    let totalPushZ = 0;
    let anyCollision = false;

    for (const obstacle of this.obstacles) {
      const result = obstacle.checkCollision(position, radius);
      if (result.collides) {
        anyCollision = true;
        totalPushX += result.pushX;
        totalPushZ += result.pushZ;
      }
    }

    return { collides: anyCollision, pushX: totalPushX, pushZ: totalPushZ };
  }

  /**
   * Check if a projectile path hits any obstacle
   */
  checkProjectileCollision(start: Vector3D, end: Vector3D): Obstacle | null {
    for (const obstacle of this.obstacles) {
      if (obstacle.checkLineIntersection(start, end)) {
        return obstacle;
      }
    }
    return null;
  }

  /**
   * Check if a point-based projectile collides with any obstacle
   */
  checkPointCollision(point: Vector3D, radius: number): Obstacle | null {
    for (const obstacle of this.obstacles) {
      const dist = obstacle.distanceTo(point);
      if (dist < obstacle.collisionRadius + radius) {
        return obstacle;
      }
    }
    return null;
  }

  /**
   * Find the nearest obstacle to a position
   */
  findNearestObstacle(
    position: Vector3D,
  ): { obstacle: Obstacle; distance: number } | null {
    if (this.obstacles.length === 0) return null;

    let nearest: Obstacle | null = null;
    let nearestDist = Infinity;

    for (const obstacle of this.obstacles) {
      const dist = obstacle.distanceTo(position);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = obstacle;
      }
    }

    return nearest ? { obstacle: nearest, distance: nearestDist } : null;
  }

  /**
   * Get obstacles within a certain range
   */
  getObstaclesInRange(position: Vector3D, range: number): Obstacle[] {
    return this.obstacles.filter((o) => o.distanceTo(position) < range);
  }

  /**
   * Check if there's a clear line of sight between two points
   */
  hasLineOfSight(from: Vector3D, to: Vector3D): boolean {
    for (const obstacle of this.obstacles) {
      if (obstacle.checkLineIntersection(from, to)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get a direction to avoid the nearest obstacle
   */
  getAvoidanceDirection(
    position: Vector3D,
    currentDirection: Vector3D,
    lookAhead: number,
  ): Vector3D | null {
    // Check if moving in current direction would hit an obstacle
    const futurePos = new Vector3D(
      position.x + currentDirection.x * lookAhead,
      0,
      position.z + currentDirection.z * lookAhead,
    );

    const collision = this.checkCollision(futurePos, 60); // Approximate entity radius

    if (collision.collides) {
      // Return a direction perpendicular to the push direction
      // This makes entities go around obstacles
      const pushMag = Math.sqrt(
        collision.pushX * collision.pushX + collision.pushZ * collision.pushZ,
      );
      if (pushMag > 0) {
        // Choose perpendicular direction (rotate 90 degrees)
        return new Vector3D(
          -collision.pushZ / pushMag,
          0,
          collision.pushX / pushMag,
        );
      }
    }

    return null;
  }

  render(renderer: WireframeRenderer, screenW: number, screenH: number): void {
    for (const obstacle of this.obstacles) {
      obstacle.render(renderer, screenW, screenH);
    }
  }

  clear(): void {
    this.obstacles = [];
  }
}
