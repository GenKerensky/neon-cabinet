import { Vector3D } from "../engine/Vector3D";
import { WireframeRenderer } from "../engine/WireframeRenderer";
import { ENEMY_TANK } from "../models";
import { Obstacle } from "./Obstacle";

export type TankMode = "patrol" | "hunt";

export interface EnemyTankConfig {
  patrolSpeed?: number;
  huntSpeed?: number;
  fireRate?: number;
  detectionRange?: number;
  loseTargetRange?: number;
  projectileSpeed?: number;
  minEngageDistance?: number;
}

export interface ObstacleInfo {
  obstacles: Obstacle[];
  checkCollision: (
    pos: Vector3D,
    radius: number,
  ) => { collides: boolean; pushX: number; pushZ: number };
  hasLineOfSight: (from: Vector3D, to: Vector3D) => boolean;
}

/**
 * Enemy tank with patrol and hunt AI modes
 */
export class EnemyTank {
  position: Vector3D;
  rotation: number;
  private health = 2;
  private alive = true;

  // AI state
  private mode: TankMode = "patrol";
  private patrolRoute: Vector3D[] = [];
  private currentWaypointIndex = 0;

  // Movement
  private patrolSpeed: number;
  private huntSpeed: number;
  private rotationSpeed = 2.0; // radians per second

  // Combat
  private fireTimer = 0;
  private fireRate: number;
  private detectionRange: number;
  private loseTargetRange: number;
  private projectileSpeed: number;
  private minEngageDistance: number;

  readonly collisionRadius = 60;
  readonly points = 250;
  readonly type = "tank" as const;

  constructor(position: Vector3D, rotation = 0, config?: EnemyTankConfig) {
    this.position = position.clone();
    this.rotation = rotation;

    // Apply config with defaults
    this.patrolSpeed = config?.patrolSpeed ?? 50;
    this.huntSpeed = config?.huntSpeed ?? 100;
    this.fireRate = config?.fireRate ?? 3000;
    this.detectionRange = config?.detectionRange ?? 1000;
    this.loseTargetRange = config?.loseTargetRange ?? 1500;
    this.projectileSpeed = config?.projectileSpeed ?? 500;
    this.minEngageDistance = config?.minEngageDistance ?? 200;

    // Generate default patrol route (circle around spawn point)
    this.generatePatrolRoute();

    // Randomize fire timer
    this.fireTimer = Math.random() * this.fireRate;
  }

  /**
   * Generate a patrol route around the tank's spawn position
   */
  private generatePatrolRoute(): void {
    const patrolRadius = 300;
    const numWaypoints = 4;

    for (let i = 0; i < numWaypoints; i++) {
      const angle = (i / numWaypoints) * Math.PI * 2;
      this.patrolRoute.push(
        new Vector3D(
          this.position.x + Math.cos(angle) * patrolRadius,
          0,
          this.position.z + Math.sin(angle) * patrolRadius,
        ),
      );
    }
  }

  /**
   * Set a custom patrol route
   */
  setPatrolRoute(waypoints: Vector3D[]): void {
    this.patrolRoute = waypoints.map((w) => w.clone());
    this.currentWaypointIndex = 0;
  }

  /**
   * Update tank AI
   * Returns fire data if ready to shoot, null otherwise
   */
  update(
    delta: number,
    playerPos?: Vector3D,
    obstacleInfo?: ObstacleInfo,
  ): { position: Vector3D; direction: Vector3D; speed: number } | null {
    if (!this.alive) return null;

    const dt = delta / 1000;
    let fireData: {
      position: Vector3D;
      direction: Vector3D;
      speed: number;
    } | null = null;

    if (playerPos) {
      const dx = playerPos.x - this.position.x;
      const dz = playerPos.z - this.position.z;
      const distanceToPlayer = Math.sqrt(dx * dx + dz * dz);

      // Check for mode transitions
      if (this.mode === "patrol" && distanceToPlayer <= this.detectionRange) {
        this.mode = "hunt";
      } else if (
        this.mode === "hunt" &&
        distanceToPlayer > this.loseTargetRange
      ) {
        this.mode = "patrol";
      }

      if (this.mode === "hunt") {
        fireData = this.updateHuntMode(
          dt,
          playerPos,
          distanceToPlayer,
          obstacleInfo,
        );
      } else {
        this.updatePatrolMode(dt, obstacleInfo);
      }
    } else {
      this.updatePatrolMode(dt, obstacleInfo);
    }

    // Resolve obstacle collisions after movement
    if (obstacleInfo) {
      this.resolveObstacleCollisions(obstacleInfo);
    }

    return fireData;
  }

  private updatePatrolMode(dt: number, obstacleInfo?: ObstacleInfo): void {
    if (this.patrolRoute.length === 0) return;

    const waypoint = this.patrolRoute[this.currentWaypointIndex];
    const dx = waypoint.x - this.position.x;
    const dz = waypoint.z - this.position.z;
    const distToWaypoint = Math.sqrt(dx * dx + dz * dz);

    // Check if reached waypoint
    if (distToWaypoint < 30) {
      this.currentWaypointIndex =
        (this.currentWaypointIndex + 1) % this.patrolRoute.length;
      return;
    }

    // Get target rotation, possibly adjusted for obstacles
    let targetRotation = Math.atan2(dx, dz);
    targetRotation = this.adjustForObstacles(targetRotation, obstacleInfo);

    this.rotateToward(targetRotation, dt);

    // Move forward if roughly facing target direction
    const rotationDiff = this.getRotationDiff(targetRotation);
    if (Math.abs(rotationDiff) < 0.5) {
      this.moveForward(this.patrolSpeed * dt);
    }
  }

  private updateHuntMode(
    dt: number,
    playerPos: Vector3D,
    distanceToPlayer: number,
    obstacleInfo?: ObstacleInfo,
  ): { position: Vector3D; direction: Vector3D; speed: number } | null {
    const dx = playerPos.x - this.position.x;
    const dz = playerPos.z - this.position.z;
    const targetRotation = Math.atan2(dx, dz);

    // Adjust rotation for obstacles when moving
    const moveRotation = this.adjustForObstacles(targetRotation, obstacleInfo);

    // Move toward player if not too close
    if (distanceToPlayer > this.minEngageDistance) {
      // Rotate toward movement direction (may be avoiding obstacle)
      this.rotateToward(moveRotation, dt);

      const rotationDiff = this.getRotationDiff(moveRotation);
      if (Math.abs(rotationDiff) < 0.8) {
        this.moveForward(this.huntSpeed * dt);
      }
    } else {
      // When stationary/engaging, rotate directly toward player
      this.rotateToward(targetRotation, dt);
    }

    // Update fire timer
    this.fireTimer += dt * 1000;

    // Check if facing player and ready to fire (use direct angle to player)
    const aimDiff = this.getRotationDiff(targetRotation);
    const isFacingPlayer = Math.abs(aimDiff) < 0.2; // ~11 degrees

    // Only fire if we have line of sight
    const hasLOS =
      !obstacleInfo || obstacleInfo.hasLineOfSight(this.position, playerPos);

    if (isFacingPlayer && hasLOS && this.fireTimer >= this.fireRate) {
      this.fireTimer = 0;

      // Return fire data
      const spawnOffset = 85; // Distance in front of tank (past cannon)
      const spawnHeight = 45; // Cannon height

      const firePos = new Vector3D(
        this.position.x + Math.sin(this.rotation) * spawnOffset,
        spawnHeight,
        this.position.z + Math.cos(this.rotation) * spawnOffset,
      );

      const fireDir = new Vector3D(
        Math.sin(this.rotation),
        0,
        Math.cos(this.rotation),
      );

      return {
        position: firePos,
        direction: fireDir,
        speed: this.projectileSpeed,
      };
    }

    return null;
  }

  private rotateToward(targetRotation: number, dt: number): void {
    let rotationDiff = targetRotation - this.rotation;

    // Normalize to -PI to PI
    while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
    while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;

    // Apply rotation
    const maxRotation = this.rotationSpeed * dt;
    if (Math.abs(rotationDiff) <= maxRotation) {
      this.rotation = targetRotation;
    } else {
      this.rotation += Math.sign(rotationDiff) * maxRotation;
    }

    // Normalize rotation
    while (this.rotation < 0) this.rotation += Math.PI * 2;
    while (this.rotation >= Math.PI * 2) this.rotation -= Math.PI * 2;
  }

  private getRotationDiff(targetRotation: number): number {
    let diff = targetRotation - this.rotation;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return diff;
  }

  private moveForward(distance: number): void {
    this.position.x += Math.sin(this.rotation) * distance;
    this.position.z += Math.cos(this.rotation) * distance;
  }

  /**
   * Adjust target rotation to avoid obstacles ahead
   */
  private adjustForObstacles(
    targetRotation: number,
    obstacleInfo?: ObstacleInfo,
  ): number {
    if (!obstacleInfo) return targetRotation;

    const lookAhead = 150; // How far ahead to check
    const checkRadius = this.collisionRadius + 20;

    // Check position ahead in target direction
    const aheadX = this.position.x + Math.sin(targetRotation) * lookAhead;
    const aheadZ = this.position.z + Math.cos(targetRotation) * lookAhead;
    const aheadPos = new Vector3D(aheadX, 0, aheadZ);

    const collision = obstacleInfo.checkCollision(aheadPos, checkRadius);

    if (collision.collides) {
      // Try to go around - check left and right
      const leftRotation = targetRotation - Math.PI / 3; // 60 degrees left
      const rightRotation = targetRotation + Math.PI / 3; // 60 degrees right

      // Check which direction is clearer
      const leftAhead = new Vector3D(
        this.position.x + Math.sin(leftRotation) * lookAhead,
        0,
        this.position.z + Math.cos(leftRotation) * lookAhead,
      );
      const rightAhead = new Vector3D(
        this.position.x + Math.sin(rightRotation) * lookAhead,
        0,
        this.position.z + Math.cos(rightRotation) * lookAhead,
      );

      const leftClear = !obstacleInfo.checkCollision(leftAhead, checkRadius)
        .collides;
      const rightClear = !obstacleInfo.checkCollision(rightAhead, checkRadius)
        .collides;

      if (leftClear && !rightClear) {
        return leftRotation;
      } else if (rightClear && !leftClear) {
        return rightRotation;
      } else if (leftClear && rightClear) {
        // Both clear, pick the one closer to target direction
        const leftDiff = Math.abs(this.getRotationDiff(leftRotation));
        const rightDiff = Math.abs(this.getRotationDiff(rightRotation));
        return leftDiff < rightDiff ? leftRotation : rightRotation;
      } else {
        // Both blocked, try sharper turns
        const sharpLeft = targetRotation - Math.PI / 2;
        const sharpRight = targetRotation + Math.PI / 2;
        const sharpLeftAhead = new Vector3D(
          this.position.x + Math.sin(sharpLeft) * lookAhead,
          0,
          this.position.z + Math.cos(sharpLeft) * lookAhead,
        );
        if (
          !obstacleInfo.checkCollision(sharpLeftAhead, checkRadius).collides
        ) {
          return sharpLeft;
        }
        return sharpRight;
      }
    }

    return targetRotation;
  }

  /**
   * Push tank out of any obstacle collisions
   */
  private resolveObstacleCollisions(obstacleInfo: ObstacleInfo): void {
    const collision = obstacleInfo.checkCollision(
      this.position,
      this.collisionRadius,
    );
    if (collision.collides) {
      this.position.x += collision.pushX;
      this.position.z += collision.pushZ;
    }
  }

  render(renderer: WireframeRenderer, screenW: number, screenH: number): void {
    if (!this.alive) return;
    renderer.render(ENEMY_TANK, this.position, this.rotation, screenW, screenH);
  }

  takeDamage(amount = 1): void {
    this.health -= amount;
    if (this.health <= 0) {
      this.alive = false;
    }
  }

  isDead(): boolean {
    return !this.alive;
  }

  isAlive(): boolean {
    return this.alive;
  }

  getPosition(): Vector3D {
    return this.position.clone();
  }

  getHealth(): number {
    return this.health;
  }

  getMode(): TankMode {
    return this.mode;
  }

  /**
   * Get collision center (raised to mid-height for projectile hits)
   */
  getCollisionCenter(): Vector3D {
    return new Vector3D(this.position.x, 50, this.position.z);
  }
}
