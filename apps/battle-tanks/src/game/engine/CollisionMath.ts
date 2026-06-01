import { Vector3D } from "./Vector3D";

export interface SegmentHit {
  point: Vector3D;
  distance: number;
  t: number;
}

export interface AabbXZ {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface CollisionPush {
  collides: boolean;
  pushX: number;
  pushZ: number;
}

export function segmentCircleIntersectionXZ(
  start: Vector3D,
  end: Vector3D,
  center: Vector3D,
  radius: number,
): SegmentHit | null {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const lengthSq = dx * dx + dz * dz;
  if (lengthSq === 0) {
    const distX = start.x - center.x;
    const distZ = start.z - center.z;
    if (distX * distX + distZ * distZ <= radius * radius) {
      return { point: start.clone(), distance: 0, t: 0 };
    }
    return null;
  }

  const fx = start.x - center.x;
  const fz = start.z - center.z;
  const a = lengthSq;
  const b = 2 * (fx * dx + fz * dz);
  const c = fx * fx + fz * fz - radius * radius;
  const discriminant = b * b - 4 * a * c;

  if (c <= 0) {
    return { point: start.clone(), distance: 0, t: 0 };
  }
  if (discriminant < 0) return null;

  const sqrtDisc = Math.sqrt(discriminant);
  const t1 = (-b - sqrtDisc) / (2 * a);
  const t2 = (-b + sqrtDisc) / (2 * a);
  const t = [t1, t2]
    .filter((value) => value >= 0 && value <= 1)
    .sort((a, b) => a - b)[0];
  if (t === undefined) return null;

  return createSegmentHit(start, dx, end.y - start.y, dz, t);
}

export function segmentAabbIntersectionXZ(
  start: Vector3D,
  end: Vector3D,
  bounds: AabbXZ,
): SegmentHit | null {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const dy = end.y - start.y;
  let tMin = 0;
  let tMax = 1;

  const clipAxis = (
    startValue: number,
    delta: number,
    min: number,
    max: number,
  ): boolean => {
    if (delta === 0) return startValue >= min && startValue <= max;

    const invDelta = 1 / delta;
    let near = (min - startValue) * invDelta;
    let far = (max - startValue) * invDelta;
    if (near > far) {
      const temp = near;
      near = far;
      far = temp;
    }

    tMin = Math.max(tMin, near);
    tMax = Math.min(tMax, far);
    return tMin <= tMax;
  };

  if (!clipAxis(start.x, dx, bounds.minX, bounds.maxX)) return null;
  if (!clipAxis(start.z, dz, bounds.minZ, bounds.maxZ)) return null;

  return createSegmentHit(start, dx, dy, dz, tMin);
}

export function circleAabbCollisionXZ(
  center: Vector3D,
  radius: number,
  bounds: AabbXZ,
): CollisionPush {
  const closestX = clamp(center.x, bounds.minX, bounds.maxX);
  const closestZ = clamp(center.z, bounds.minZ, bounds.maxZ);
  let dx = center.x - closestX;
  let dz = center.z - closestZ;
  let distSq = dx * dx + dz * dz;

  if (distSq > 0) {
    if (distSq >= radius * radius) {
      return { collides: false, pushX: 0, pushZ: 0 };
    }

    const dist = Math.sqrt(distSq);
    const overlap = radius - dist;
    return {
      collides: true,
      pushX: (dx / dist) * overlap,
      pushZ: (dz / dist) * overlap,
    };
  }

  if (
    center.x < bounds.minX ||
    center.x > bounds.maxX ||
    center.z < bounds.minZ ||
    center.z > bounds.maxZ
  ) {
    return { collides: false, pushX: 0, pushZ: 0 };
  }

  const toLeft = center.x - bounds.minX;
  const toRight = bounds.maxX - center.x;
  const toTop = center.z - bounds.minZ;
  const toBottom = bounds.maxZ - center.z;
  const minPenetration = Math.min(toLeft, toRight, toTop, toBottom);

  if (minPenetration === toLeft) {
    dx = -1;
    dz = 0;
    distSq = toLeft * toLeft;
  } else if (minPenetration === toRight) {
    dx = 1;
    dz = 0;
    distSq = toRight * toRight;
  } else if (minPenetration === toTop) {
    dx = 0;
    dz = -1;
    distSq = toTop * toTop;
  } else {
    dx = 0;
    dz = 1;
    distSq = toBottom * toBottom;
  }

  return {
    collides: true,
    pushX: dx * (Math.sqrt(distSq) + radius),
    pushZ: dz * (Math.sqrt(distSq) + radius),
  };
}

export function expandAabbXZ(bounds: AabbXZ, amount: number): AabbXZ {
  return {
    minX: bounds.minX - amount,
    maxX: bounds.maxX + amount,
    minZ: bounds.minZ - amount,
    maxZ: bounds.maxZ + amount,
  };
}

function createSegmentHit(
  start: Vector3D,
  dx: number,
  dy: number,
  dz: number,
  t: number,
): SegmentHit {
  const point = new Vector3D(
    start.x + dx * t,
    start.y + dy * t,
    start.z + dz * t,
  );
  return {
    point,
    distance: Math.sqrt(dx * dx + dz * dz) * t,
    t,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
