import { Vector3D } from "../engine/Vector3D";
import { WireframeRenderer } from "../engine/WireframeRenderer";
import { Turret } from "./Turret";
import { EnemyTank, EnemyTankConfig, ObstacleInfo } from "./EnemyTank";
import { EnemyProjectile } from "./EnemyProjectile";

export type Enemy = Turret | EnemyTank;

export interface DifficultyConfig {
  fireRate: number;
  tankPatrolSpeed: number;
  tankHuntSpeed: number;
  projectileSpeed: number;
  detectionRange: number;
}

/**
 * Manages all enemies and enemy projectiles in the game
 */
export class EnemyManager {
  private enemies: Enemy[] = [];
  private projectiles: EnemyProjectile[] = [];
  private difficultyConfig: DifficultyConfig = {
    fireRate: 4000,
    tankPatrolSpeed: 50,
    tankHuntSpeed: 100,
    projectileSpeed: 400,
    detectionRange: 1000,
  };

  /**
   * Set difficulty configuration for new enemies
   */
  setDifficulty(config: Partial<DifficultyConfig>): void {
    this.difficultyConfig = { ...this.difficultyConfig, ...config };
  }

  /**
   * Spawn a turret at the given position
   */
  spawnTurret(position: Vector3D, rotation = 0): Turret {
    const turret = new Turret(position, rotation, {
      fireRate: this.difficultyConfig.fireRate,
      detectionRange: this.difficultyConfig.detectionRange,
      projectileSpeed: this.difficultyConfig.projectileSpeed,
    });
    this.enemies.push(turret);
    return turret;
  }

  /**
   * Spawn an enemy tank at the given position
   */
  spawnTank(position: Vector3D, rotation = 0): EnemyTank {
    const config: EnemyTankConfig = {
      patrolSpeed: this.difficultyConfig.tankPatrolSpeed,
      huntSpeed: this.difficultyConfig.tankHuntSpeed,
      fireRate: this.difficultyConfig.fireRate,
      detectionRange: this.difficultyConfig.detectionRange,
      projectileSpeed: this.difficultyConfig.projectileSpeed,
    };
    const tank = new EnemyTank(position, rotation, config);
    this.enemies.push(tank);
    return tank;
  }

  /**
   * Update all enemies and projectiles
   * Pass playerPos so enemies can track/hunt the player
   * Pass obstacleInfo for AI pathfinding and line of sight checks
   */
  update(
    delta: number,
    playerPos?: Vector3D,
    obstacleInfo?: ObstacleInfo,
  ): void {
    // Update enemies and collect fire data
    for (const enemy of this.enemies) {
      let fireData: {
        position: Vector3D;
        direction: Vector3D;
        speed: number;
      } | null = null;

      if (enemy.type === "tank") {
        fireData = (enemy as EnemyTank).update(delta, playerPos, obstacleInfo);
      } else {
        // Turret - pass line of sight check function
        fireData = (enemy as Turret).update(
          delta,
          playerPos,
          obstacleInfo?.hasLineOfSight,
        );
      }

      // If enemy wants to fire, spawn a projectile
      if (fireData) {
        const projectile = new EnemyProjectile(
          fireData.position,
          fireData.direction,
          fireData.speed,
        );
        this.projectiles.push(projectile);
      }
    }

    // Remove dead enemies
    this.enemies = this.enemies.filter((e) => e.isAlive());

    // Update projectiles
    for (const projectile of this.projectiles) {
      projectile.update(delta);
    }

    // Remove dead projectiles
    this.projectiles = this.projectiles.filter((p) => p.isAlive());
  }

  /**
   * Render all enemies and projectiles
   */
  render(renderer: WireframeRenderer, screenW: number, screenH: number): void {
    for (const enemy of this.enemies) {
      enemy.render(renderer, screenW, screenH);
    }

    for (const projectile of this.projectiles) {
      projectile.render(renderer, screenW, screenH);
    }
  }

  /**
   * Get all enemies
   */
  getEnemies(): Enemy[] {
    return this.enemies;
  }

  /**
   * Get all enemy projectiles
   */
  getProjectiles(): EnemyProjectile[] {
    return this.projectiles;
  }

  /**
   * Get all enemy positions (for radar)
   */
  getEnemyPositions(): Vector3D[] {
    return this.enemies.map((e) => e.position.clone());
  }

  /**
   * Get count of living enemies
   */
  getEnemyCount(): number {
    return this.enemies.length;
  }

  /**
   * Check if all enemies are dead
   */
  allDead(): boolean {
    return this.enemies.length === 0;
  }

  /**
   * Clear all enemies and projectiles
   */
  clear(): void {
    this.enemies = [];
    this.projectiles = [];
  }

  /**
   * Remove a specific enemy
   */
  removeEnemy(enemy: Enemy): void {
    const index = this.enemies.indexOf(enemy);
    if (index !== -1) {
      this.enemies.splice(index, 1);
    }
  }
}
