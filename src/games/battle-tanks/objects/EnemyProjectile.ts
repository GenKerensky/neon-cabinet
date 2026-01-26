import { Vector3D } from "../engine/Vector3D";
import { WireframeRenderer } from "../engine/WireframeRenderer";
import { ENEMY_PROJECTILE } from "../models";

/**
 * Enemy projectile - red, slower than player shots
 */
export class EnemyProjectile {
  position: Vector3D;
  private velocity: Vector3D;
  private alive = true;
  private lifetime: number;
  private maxLifetime = 4000; // ms - longer than player projectiles

  readonly radius = 10; // Collision radius
  readonly speed: number;

  constructor(position: Vector3D, direction: Vector3D, speed = 400) {
    this.position = position.clone();
    this.speed = speed;
    this.velocity = direction.normalize().scale(this.speed);
    this.lifetime = 0;
  }

  update(delta: number): void {
    if (!this.alive) return;

    const dt = delta / 1000;

    // Move projectile
    this.position = this.position.add(this.velocity.scale(dt));

    // Update lifetime
    this.lifetime += delta;
    if (this.lifetime >= this.maxLifetime) {
      this.alive = false;
    }
  }

  render(renderer: WireframeRenderer, screenW: number, screenH: number): void {
    if (!this.alive) return;

    // Calculate rotation to face direction of travel
    const rotation = Math.atan2(this.velocity.x, this.velocity.z);

    renderer.render(
      ENEMY_PROJECTILE,
      this.position,
      rotation,
      screenW,
      screenH,
    );
  }

  isAlive(): boolean {
    return this.alive;
  }

  destroy(): void {
    this.alive = false;
  }

  /**
   * Get distance to a point
   */
  distanceTo(point: Vector3D): number {
    const dx = this.position.x - point.x;
    const dy = this.position.y - point.y;
    const dz = this.position.z - point.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}
