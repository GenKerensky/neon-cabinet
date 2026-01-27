import { Vector3D } from "../engine/Vector3D";
import { WireframeModel, createEdges } from "../engine/WireframeModel";
import { WireframeRenderer } from "../engine/WireframeRenderer";
import { COLORS } from "../models";

/**
 * Turret wireframe model - detailed stationary gun emplacement
 * Gun barrel at y=50 to match player crosshairs
 */
export const TURRET_MODEL: WireframeModel = {
  vertices: [
    // === BASE PLATFORM ===
    // Ground level base (0-3)
    new Vector3D(-22, 0, -22),
    new Vector3D(22, 0, -22),
    new Vector3D(22, 0, 22),
    new Vector3D(-22, 0, 22),

    // Base platform top (4-7)
    new Vector3D(-20, 12, -20),
    new Vector3D(20, 12, -20),
    new Vector3D(20, 12, 20),
    new Vector3D(-20, 12, 20),

    // === PEDESTAL / SUPPORT ===
    // Pedestal bottom (8-11)
    new Vector3D(-14, 12, -14),
    new Vector3D(14, 12, -14),
    new Vector3D(14, 12, 14),
    new Vector3D(-14, 12, 14),

    // Pedestal top (12-15)
    new Vector3D(-12, 35, -12),
    new Vector3D(12, 35, -12),
    new Vector3D(12, 35, 12),
    new Vector3D(-12, 35, 12),

    // === ROTATING HEAD ===
    // Head base (16-19)
    new Vector3D(-16, 35, -16),
    new Vector3D(16, 35, -16),
    new Vector3D(16, 35, 16),
    new Vector3D(-16, 35, 16),

    // Head top - sloped (20-23)
    new Vector3D(-14, 55, -14),
    new Vector3D(14, 55, -14),
    new Vector3D(14, 55, 10),
    new Vector3D(-14, 55, 10),

    // Gun mantlet (24-25)
    new Vector3D(-10, 48, 18),
    new Vector3D(10, 48, 18),

    // === GUN BARREL ===
    // Barrel base (26-29)
    new Vector3D(-4, 46, 18),
    new Vector3D(4, 46, 18),
    new Vector3D(4, 52, 18),
    new Vector3D(-4, 52, 18),

    // Barrel end (30-33)
    new Vector3D(-3, 47, 70),
    new Vector3D(3, 47, 70),
    new Vector3D(3, 51, 70),
    new Vector3D(-3, 51, 70),

    // === SENSOR DOME ===
    new Vector3D(-6, 55, -6),
    new Vector3D(6, 55, -6),
    new Vector3D(0, 55, 0),
    new Vector3D(0, 62, -3),
  ],
  edges: createEdges([
    // Base platform bottom
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    // Base platform top
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    // Base platform verticals
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
    // Pedestal bottom
    [8, 9],
    [9, 10],
    [10, 11],
    [11, 8],
    // Pedestal top
    [12, 13],
    [13, 14],
    [14, 15],
    [15, 12],
    // Pedestal verticals
    [8, 12],
    [9, 13],
    [10, 14],
    [11, 15],
    // Head base
    [16, 17],
    [17, 18],
    [18, 19],
    [19, 16],
    // Head top
    [20, 21],
    [21, 22],
    [22, 23],
    [23, 20],
    // Head verticals
    [16, 20],
    [17, 21],
    [18, 22],
    [19, 23],
    // Mantlet
    [23, 24],
    [22, 25],
    [24, 25],
    // Gun barrel base
    [26, 27],
    [27, 28],
    [28, 29],
    [29, 26],
    // Gun barrel end
    [30, 31],
    [31, 32],
    [32, 33],
    [33, 30],
    // Gun barrel sides
    [26, 30],
    [27, 31],
    [28, 32],
    [29, 33],
    // Sensor dome
    [34, 35],
    [35, 36],
    [36, 34],
    [34, 37],
    [35, 37],
    [36, 37],
  ]),
  color: COLORS.enemy,
};

/**
 * Stationary turret enemy - rotates to track player, fires when facing
 */
export class Turret {
  position: Vector3D;
  rotation: number;
  private health = 1;
  private alive = true;

  // AI properties
  private targetRotation = 0;
  private rotationSpeed = 1.5; // radians per second
  private fireTimer = 0;
  private fireRate: number; // ms between shots
  private detectionRange: number;
  private projectileSpeed: number;

  readonly collisionRadius = 35;
  readonly points = 100;
  readonly type = "turret" as const;

  constructor(
    position: Vector3D,
    rotation = 0,
    config?: {
      fireRate?: number;
      detectionRange?: number;
      projectileSpeed?: number;
    },
  ) {
    this.position = position.clone();
    this.rotation = rotation;
    this.fireRate = config?.fireRate ?? 4000; // Default 4 seconds
    this.detectionRange = config?.detectionRange ?? 1500;
    this.projectileSpeed = config?.projectileSpeed ?? 400;
    // Randomize initial fire timer so turrets don't all fire at once
    this.fireTimer = Math.random() * this.fireRate;
  }

  /**
   * Update turret AI - track player and prepare to fire
   * Returns fire data if ready to shoot, null otherwise
   */
  update(
    delta: number,
    playerPos?: Vector3D,
    hasLineOfSight?: (from: Vector3D, to: Vector3D) => boolean,
  ): { position: Vector3D; direction: Vector3D; speed: number } | null {
    if (!this.alive) return null;

    const dt = delta / 1000;

    if (playerPos) {
      const dx = playerPos.x - this.position.x;
      const dz = playerPos.z - this.position.z;
      const distanceToPlayer = Math.sqrt(dx * dx + dz * dz);

      // Only track if player is in range
      if (distanceToPlayer <= this.detectionRange) {
        // Calculate angle to player
        this.targetRotation = Math.atan2(dx, dz);

        // Smooth rotation toward player
        let rotationDiff = this.targetRotation - this.rotation;

        // Normalize to -PI to PI
        while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
        while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;

        // Apply rotation
        const maxRotation = this.rotationSpeed * dt;
        if (Math.abs(rotationDiff) <= maxRotation) {
          this.rotation = this.targetRotation;
        } else {
          this.rotation += Math.sign(rotationDiff) * maxRotation;
        }

        // Normalize rotation
        while (this.rotation < 0) this.rotation += Math.PI * 2;
        while (this.rotation >= Math.PI * 2) this.rotation -= Math.PI * 2;

        // Update fire timer
        this.fireTimer += delta;

        // Check line of sight
        const canSeePlayer =
          !hasLineOfSight || hasLineOfSight(this.position, playerPos);

        // Check if facing player (within ~15 degrees) and ready to fire
        const isFacingPlayer = Math.abs(rotationDiff) < 0.26; // ~15 degrees
        if (isFacingPlayer && canSeePlayer && this.fireTimer >= this.fireRate) {
          this.fireTimer = 0;

          // Return fire data
          const spawnOffset = 45; // Distance in front of turret
          const spawnHeight = 55; // Cannon height

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
      }
    }

    return null;
  }

  render(renderer: WireframeRenderer, screenW: number, screenH: number): void {
    if (!this.alive) return;
    renderer.render(
      TURRET_MODEL,
      this.position,
      this.rotation,
      screenW,
      screenH,
    );
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

  /**
   * Get collision center (raised to mid-height for projectile hits)
   */
  getCollisionCenter(): Vector3D {
    return new Vector3D(this.position.x, 50, this.position.z);
  }
}
