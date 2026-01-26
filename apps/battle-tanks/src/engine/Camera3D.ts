import { Vector3D } from "./Vector3D";

export interface ScreenPoint {
  x: number;
  y: number;
  z: number; // Depth for sorting/clipping
}

/**
 * First-person camera with perspective projection
 */
export class Camera3D {
  position: Vector3D;
  rotation: number; // Y-axis rotation (positive = facing right of +Z)
  focalLength: number;
  nearClip: number;
  farClip: number;

  constructor(focalLength = 400) {
    this.position = new Vector3D(0, 50, 0); // Default eye height
    this.rotation = 0;
    this.focalLength = focalLength;
    this.nearClip = 10;
    this.farClip = 5000;
  }

  /**
   * Transform world point to screen coordinates
   * Returns null if point is behind camera or outside far clip
   */
  worldToScreen(
    point: Vector3D,
    screenW: number,
    screenH: number,
  ): ScreenPoint | null {
    // Transform to camera space (translate then rotate)
    const relative = point.subtract(this.position).rotateY(-this.rotation);

    // Behind camera or too far? Don't render
    if (relative.z <= this.nearClip || relative.z > this.farClip) {
      return null;
    }

    // Perspective projection
    const screenX = (relative.x / relative.z) * this.focalLength + screenW / 2;
    const screenY = screenH / 2 - (relative.y / relative.z) * this.focalLength;

    return { x: screenX, y: screenY, z: relative.z };
  }

  /**
   * Transform world point to camera space (before projection)
   */
  worldToCameraSpace(point: Vector3D): Vector3D {
    return point.subtract(this.position).rotateY(-this.rotation);
  }

  /**
   * Check if a point is potentially in view (rough frustum check)
   */
  isInView(point: Vector3D): boolean {
    const camSpace = this.worldToCameraSpace(point);

    // Behind camera
    if (camSpace.z <= this.nearClip) return false;

    // Too far
    if (camSpace.z > this.farClip) return false;

    // Simple FOV check (approximate 90 degree FOV)
    const halfFov = camSpace.z;
    if (Math.abs(camSpace.x) > halfFov * 1.5) return false;
    if (Math.abs(camSpace.y) > halfFov * 1.5) return false;

    return true;
  }

  /**
   * Get the forward direction vector in world space
   */
  getForward(): Vector3D {
    // At rotation=0, forward is +Z
    // Positive rotation turns right, so forward rotates clockwise
    return new Vector3D(Math.sin(this.rotation), 0, Math.cos(this.rotation));
  }

  /**
   * Get the right direction vector in world space
   */
  getRight(): Vector3D {
    return new Vector3D(Math.cos(this.rotation), 0, -Math.sin(this.rotation));
  }
}
