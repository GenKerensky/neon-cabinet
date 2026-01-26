import { Vector3D } from "../engine/Vector3D";
import { Camera3D } from "../engine/Camera3D";
import { WireframeRenderer } from "../engine/WireframeRenderer";
import { PROJECTILE } from "../models";

/**
 * Cannon projectile that travels in 3D space
 */
export class Projectile {
  position: Vector3D;
  private velocity: Vector3D;
  private alive = true;
  private lifetime: number;
  private maxLifetime = 3000; // ms

  readonly radius = 10; // Collision radius
  readonly speed = 800; // Units per second

  constructor(position: Vector3D, direction: Vector3D) {
    this.position = position.clone();
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

    renderer.render(PROJECTILE, this.position, rotation, screenW, screenH);
  }

  isAlive(): boolean {
    return this.alive;
  }

  destroy(): void {
    this.alive = false;
  }

  /**
   * Check if projectile is within visible range of camera
   */
  isVisible(camera: Camera3D, maxDistance = 2000): boolean {
    const dx = this.position.x - camera.position.x;
    const dz = this.position.z - camera.position.z;
    return dx * dx + dz * dz < maxDistance * maxDistance;
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
