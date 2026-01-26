import { Vector3D } from "../engine/Vector3D";
import { WireframeModel, createEdges } from "../engine/WireframeModel";
import { WireframeRenderer } from "../engine/WireframeRenderer";
import { COLORS } from "../models";

export type ObstacleType = "cube" | "pyramid";

/**
 * Creates a cube/box model with independent dimensions
 */
function createCubeModel(
  width: number,
  depth: number,
  height: number,
): WireframeModel {
  const w = width;
  const d = depth;
  const h = height;
  return {
    vertices: [
      new Vector3D(-w, 0, -d),
      new Vector3D(w, 0, -d),
      new Vector3D(w, 0, d),
      new Vector3D(-w, 0, d),
      new Vector3D(-w, h, -d),
      new Vector3D(w, h, -d),
      new Vector3D(w, h, d),
      new Vector3D(-w, h, d),
    ],
    edges: createEdges([
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 4],
      [0, 4],
      [1, 5],
      [2, 6],
      [3, 7],
    ]),
    color: COLORS.obstacle,
  };
}

/**
 * Creates a pyramid model with independent dimensions
 */
function createPyramidModel(
  width: number,
  depth: number,
  height: number,
): WireframeModel {
  const w = width;
  const d = depth;
  const h = height;
  return {
    vertices: [
      new Vector3D(-w, 0, -d),
      new Vector3D(w, 0, -d),
      new Vector3D(w, 0, d),
      new Vector3D(-w, 0, d),
      new Vector3D(0, h, 0),
    ],
    edges: createEdges([
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [0, 4],
      [1, 4],
      [2, 4],
      [3, 4],
    ]),
    color: COLORS.obstacle,
  };
}

export interface ObstacleDimensions {
  width: number;
  depth: number;
  height: number;
}

/**
 * Terrain obstacle - blocks movement and projectiles
 */
export class Obstacle {
  position: Vector3D;
  readonly type: ObstacleType;
  readonly dimensions: ObstacleDimensions;
  readonly collisionRadius: number;
  private model: WireframeModel;

  constructor(
    position: Vector3D,
    type: ObstacleType,
    dimensions: ObstacleDimensions,
  ) {
    this.position = position.clone();
    this.type = type;
    this.dimensions = dimensions;

    // Collision radius based on largest horizontal dimension
    this.collisionRadius = Math.max(dimensions.width, dimensions.depth) * 1.2;

    // Generate model based on type
    if (type === "cube") {
      this.model = createCubeModel(
        dimensions.width,
        dimensions.depth,
        dimensions.height,
      );
    } else {
      this.model = createPyramidModel(
        dimensions.width,
        dimensions.depth,
        dimensions.height,
      );
    }
  }

  render(renderer: WireframeRenderer, screenW: number, screenH: number): void {
    renderer.render(this.model, this.position, 0, screenW, screenH);
  }

  /**
   * Get collision center (at ground level, obstacles are solid from ground up)
   */
  getCollisionCenter(): Vector3D {
    return new Vector3D(
      this.position.x,
      this.dimensions.height / 2, // Mid-height
      this.position.z,
    );
  }

  /**
   * Check if a point is inside this obstacle's collision area
   */
  containsPoint(point: Vector3D): boolean {
    const dx = point.x - this.position.x;
    const dz = point.z - this.position.z;
    return Math.sqrt(dx * dx + dz * dz) < this.collisionRadius;
  }

  /**
   * Get the distance from a point to this obstacle's center
   */
  distanceTo(point: Vector3D): number {
    const dx = point.x - this.position.x;
    const dz = point.z - this.position.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  /**
   * Check collision with a circular entity
   */
  checkCollision(
    entityPos: Vector3D,
    entityRadius: number,
  ): { collides: boolean; pushX: number; pushZ: number } {
    const dx = entityPos.x - this.position.x;
    const dz = entityPos.z - this.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const minDist = this.collisionRadius + entityRadius;

    if (dist < minDist && dist > 0) {
      // Calculate push direction (away from obstacle center)
      const overlap = minDist - dist;
      const nx = dx / dist;
      const nz = dz / dist;
      return {
        collides: true,
        pushX: nx * overlap,
        pushZ: nz * overlap,
      };
    }

    return { collides: false, pushX: 0, pushZ: 0 };
  }

  /**
   * Check if a line segment intersects this obstacle (for projectiles)
   */
  checkLineIntersection(start: Vector3D, end: Vector3D): boolean {
    // Simple circle-line intersection for 2D (XZ plane)
    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const fx = start.x - this.position.x;
    const fz = start.z - this.position.z;

    const a = dx * dx + dz * dz;
    const b = 2 * (fx * dx + fz * dz);
    const c = fx * fx + fz * fz - this.collisionRadius * this.collisionRadius;

    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return false;

    const sqrtDisc = Math.sqrt(discriminant);
    const t1 = (-b - sqrtDisc) / (2 * a);
    const t2 = (-b + sqrtDisc) / (2 * a);

    // Check if intersection is within segment
    return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
  }
}
