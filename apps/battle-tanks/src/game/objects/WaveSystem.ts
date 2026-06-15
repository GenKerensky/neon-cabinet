import { Vector3D } from "../engine/Vector3D";
import { EnemyManager, DifficultyConfig } from "./EnemyManager";
import { Obstacle } from "./Obstacle";
import { SpawnPlanner } from "./SpawnPlanner";

export type WaveState = "active" | "complete" | "starting" | "transition";

// Player limits - enemies should never exceed these
const PLAYER_LIMITS = {
  maxSpeed: 150,
  projectileSpeed: 800,
  reloadTime: 2000, // minimum fire rate
};

/**
 * Manages wave-based enemy spawning with difficulty scaling
 */
export class WaveSystem {
  private waveNumber = 0;
  private state: WaveState = "starting";

  private readonly minSpawnDistance = 800;
  private readonly maxSpawnDistance = 1800;

  constructor(private enemyManager: EnemyManager) {}

  /**
   * Start a new wave immediately (called after transition completes)
   */
  startWave(
    playerPosition: Vector3D,
    obstacles: readonly Obstacle[] = [],
  ): void {
    this.waveNumber++;

    // Apply difficulty scaling
    this.applyDifficulty();

    // Spawn enemies
    this.spawnWaveEnemies(playerPosition, obstacles);
    this.state = "active";
  }

  /**
   * Set state to transition (used by WaveTransition)
   */
  setTransitioning(): void {
    this.state = "transition";
  }

  /**
   * Apply difficulty scaling based on wave number
   * All stats capped at player limits
   */
  private applyDifficulty(): void {
    const config = this.getDifficultyForWave(this.waveNumber);
    this.enemyManager.setDifficulty(config);
  }

  /**
   * Get difficulty configuration for a wave
   */
  private getDifficultyForWave(wave: number): DifficultyConfig {
    // Base values (Wave 1-3: Easy)
    let fireRate = 4000; // 4 seconds between shots
    let tankPatrolSpeed = 40;
    let tankHuntSpeed = 80;
    let projectileSpeed = 350;
    let detectionRange = 800;

    if (wave >= 4 && wave <= 6) {
      // Medium difficulty
      fireRate = 3000;
      tankPatrolSpeed = 60;
      tankHuntSpeed = 100;
      projectileSpeed = 500;
      detectionRange = 1000;
    } else if (wave >= 7) {
      // Hard difficulty - scale up but cap at player limits
      const hardWave = wave - 6;
      fireRate = Math.max(PLAYER_LIMITS.reloadTime, 3000 - hardWave * 100);
      tankPatrolSpeed = Math.min(
        PLAYER_LIMITS.maxSpeed * 0.6,
        60 + hardWave * 10,
      );
      tankHuntSpeed = Math.min(PLAYER_LIMITS.maxSpeed, 100 + hardWave * 10);
      projectileSpeed = Math.min(
        PLAYER_LIMITS.projectileSpeed,
        500 + hardWave * 50,
      );
      detectionRange = Math.min(1500, 1000 + hardWave * 50);
    }

    return {
      fireRate,
      tankPatrolSpeed,
      tankHuntSpeed,
      projectileSpeed,
      detectionRange,
    };
  }

  /**
   * Spawn enemies for the current wave
   */
  private spawnWaveEnemies(
    playerPos: Vector3D,
    obstacles: readonly Obstacle[],
  ): void {
    const { turrets, tanks } = this.getWaveConfig();
    const spawnPlanner = new SpawnPlanner({
      minDistance: this.minSpawnDistance,
      maxDistance: this.maxSpawnDistance,
      minSpacing: 180,
      obstacles,
    });
    const occupiedPositions: Vector3D[] = [];

    // Spawn turrets
    for (let i = 0; i < turrets; i++) {
      const pos = spawnPlanner.planEnemySpawn(playerPos, occupiedPositions);
      const rotation = Math.random() * Math.PI * 2;
      this.enemyManager.spawnTurret(pos, rotation);
      occupiedPositions.push(pos);
    }

    // Spawn tanks
    for (let i = 0; i < tanks; i++) {
      const pos = spawnPlanner.planEnemySpawn(playerPos, occupiedPositions);
      const rotation = Math.random() * Math.PI * 2;
      this.enemyManager.spawnTank(pos, rotation);
      occupiedPositions.push(pos);
    }
  }

  /**
   * Get enemy counts for current wave
   */
  private getWaveConfig(): { turrets: number; tanks: number } {
    switch (this.waveNumber) {
      case 1:
        return { turrets: 3, tanks: 0 };
      case 2:
        return { turrets: 2, tanks: 1 };
      case 3:
        return { turrets: 3, tanks: 2 };
      case 4:
        return { turrets: 4, tanks: 2 };
      case 5:
        return { turrets: 4, tanks: 3 };
      default: {
        // Scale up for later waves, but cap at reasonable numbers
        const baseTurrets = Math.min(
          8,
          4 + Math.floor((this.waveNumber - 5) * 0.5),
        );
        const baseTanks = Math.min(
          6,
          3 + Math.floor((this.waveNumber - 5) * 0.5),
        );
        return { turrets: baseTurrets, tanks: baseTanks };
      }
    }
  }

  /**
   * Update wave state - check if wave is complete
   */
  update(): void {
    if (this.state === "active" && this.enemyManager.allDead()) {
      this.state = "complete";
    }
  }

  /**
   * Check if current wave is complete
   */
  isWaveComplete(): boolean {
    return this.state === "complete";
  }

  /**
   * Check if wave is currently active (enemies spawned)
   */
  isWaveActive(): boolean {
    return this.state === "active";
  }

  /**
   * Check if wave is starting (countdown)
   */
  isWaveStarting(): boolean {
    return this.state === "starting";
  }

  /**
   * Get current wave number
   */
  getWaveNumber(): number {
    return this.waveNumber;
  }

  getNextWaveNumber(): number {
    return this.waveNumber + 1;
  }

  /**
   * Get wave state
   */
  getState(): WaveState {
    return this.state;
  }

  /**
   * Reset wave system
   */
  reset(): void {
    this.waveNumber = 0;
    this.state = "starting";
    this.enemyManager.clear();
  }
}
