/**
 * 3D Vector class for Battle Tanks wireframe engine
 */
export class Vector3D {
  constructor(
    public x: number,
    public y: number,
    public z: number,
  ) {}

  add(v: Vector3D): Vector3D {
    return new Vector3D(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  subtract(v: Vector3D): Vector3D {
    return new Vector3D(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  scale(s: number): Vector3D {
    return new Vector3D(this.x * s, this.y * s, this.z * s);
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  normalize(): Vector3D {
    const len = this.length();
    if (len === 0) return new Vector3D(0, 0, 0);
    return this.scale(1 / len);
  }

  /**
   * Rotate around Y axis (primary rotation for tank game)
   * Positive angle = clockwise when viewed from above (turn right)
   */
  rotateY(angle: number): Vector3D {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vector3D(
      this.x * cos + this.z * sin,
      this.y,
      -this.x * sin + this.z * cos,
    );
  }

  /**
   * Rotate around X axis (for pitch effects)
   */
  rotateX(angle: number): Vector3D {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vector3D(
      this.x,
      this.y * cos - this.z * sin,
      this.y * sin + this.z * cos,
    );
  }

  dot(v: Vector3D): number {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  cross(v: Vector3D): Vector3D {
    return new Vector3D(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x,
    );
  }

  clone(): Vector3D {
    return new Vector3D(this.x, this.y, this.z);
  }

  /**
   * Linear interpolation between this vector and another
   */
  lerp(v: Vector3D, t: number): Vector3D {
    return new Vector3D(
      this.x + (v.x - this.x) * t,
      this.y + (v.y - this.y) * t,
      this.z + (v.z - this.z) * t,
    );
  }

  static zero(): Vector3D {
    return new Vector3D(0, 0, 0);
  }

  static up(): Vector3D {
    return new Vector3D(0, 1, 0);
  }

  static forward(): Vector3D {
    return new Vector3D(0, 0, 1);
  }

  static right(): Vector3D {
    return new Vector3D(1, 0, 0);
  }
}
