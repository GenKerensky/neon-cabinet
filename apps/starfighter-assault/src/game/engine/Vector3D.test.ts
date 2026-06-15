import { describe, it, expect } from "vitest";
import { Vector3D } from "./Vector3D";

describe("Vector3D", () => {
  describe("constructor", () => {
    it("should create a vector with x, y, z components", () => {
      const v = new Vector3D(1, 2, 3);
      expect(v.x).toBe(1);
      expect(v.y).toBe(2);
      expect(v.z).toBe(3);
    });
  });

  describe("add", () => {
    it("should add two vectors", () => {
      const v1 = new Vector3D(1, 2, 3);
      const v2 = new Vector3D(4, 5, 6);
      const result = v1.add(v2);
      expect(result.x).toBe(5);
      expect(result.y).toBe(7);
      expect(result.z).toBe(9);
    });

    it("should not mutate the original vectors", () => {
      const v1 = new Vector3D(1, 2, 3);
      const v2 = new Vector3D(4, 5, 6);
      v1.add(v2);
      expect(v1.x).toBe(1);
      expect(v2.x).toBe(4);
    });
  });

  describe("subtract", () => {
    it("should subtract two vectors", () => {
      const v1 = new Vector3D(5, 7, 9);
      const v2 = new Vector3D(1, 2, 3);
      const result = v1.subtract(v2);
      expect(result.x).toBe(4);
      expect(result.y).toBe(5);
      expect(result.z).toBe(6);
    });
  });

  describe("scale", () => {
    it("should scale a vector by a scalar", () => {
      const v = new Vector3D(1, 2, 3);
      const result = v.scale(2);
      expect(result.x).toBe(2);
      expect(result.y).toBe(4);
      expect(result.z).toBe(6);
    });

    it("should handle negative scaling", () => {
      const v = new Vector3D(1, 2, 3);
      const result = v.scale(-1);
      expect(result.x).toBe(-1);
      expect(result.y).toBe(-2);
      expect(result.z).toBe(-3);
    });
  });

  describe("length", () => {
    it("should calculate the length of a vector", () => {
      const v = new Vector3D(3, 4, 0);
      expect(v.length()).toBe(5);
    });

    it("should return 0 for zero vector", () => {
      const v = new Vector3D(0, 0, 0);
      expect(v.length()).toBe(0);
    });
  });

  describe("normalize", () => {
    it("should normalize a vector", () => {
      const v = new Vector3D(3, 4, 0);
      const normalized = v.normalize();
      expect(normalized.length()).toBeCloseTo(1);
    });

    it("should return zero vector for zero vector", () => {
      const v = new Vector3D(0, 0, 0);
      const normalized = v.normalize();
      expect(normalized.x).toBe(0);
      expect(normalized.y).toBe(0);
      expect(normalized.z).toBe(0);
    });
  });

  describe("rotateY", () => {
    it("should rotate vector around Y axis", () => {
      const v = new Vector3D(1, 0, 0);
      const rotated = v.rotateY(Math.PI / 2);
      // Rotating (1,0,0) by 90° around Y should give (0,0,-1) based on the formula
      expect(rotated.x).toBeCloseTo(0);
      expect(rotated.z).toBeCloseTo(-1);
      expect(rotated.y).toBe(0);
    });

    it("should preserve Y component during rotation", () => {
      const v = new Vector3D(1, 5, 0);
      const rotated = v.rotateY(Math.PI / 2);
      expect(rotated.y).toBe(5);
    });
  });

  describe("dot", () => {
    it("should calculate dot product", () => {
      const v1 = new Vector3D(1, 2, 3);
      const v2 = new Vector3D(4, 5, 6);
      expect(v1.dot(v2)).toBe(32); // 1*4 + 2*5 + 3*6 = 4 + 10 + 18 = 32
    });
  });

  describe("cross", () => {
    it("should calculate cross product", () => {
      const v1 = new Vector3D(1, 0, 0);
      const v2 = new Vector3D(0, 1, 0);
      const result = v1.cross(v2);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
      expect(result.z).toBe(1);
    });
  });

  describe("clone", () => {
    it("should create a copy of the vector", () => {
      const v = new Vector3D(1, 2, 3);
      const clone = v.clone();
      expect(clone.x).toBe(v.x);
      expect(clone.y).toBe(v.y);
      expect(clone.z).toBe(v.z);
      expect(clone).not.toBe(v);
    });
  });

  describe("lerp", () => {
    it("should interpolate between two vectors", () => {
      const v1 = new Vector3D(0, 0, 0);
      const v2 = new Vector3D(10, 10, 10);
      const result = v1.lerp(v2, 0.5);
      expect(result.x).toBe(5);
      expect(result.y).toBe(5);
      expect(result.z).toBe(5);
    });
  });

  describe("static methods", () => {
    it("should create zero vector", () => {
      const v = Vector3D.zero();
      expect(v.x).toBe(0);
      expect(v.y).toBe(0);
      expect(v.z).toBe(0);
    });

    it("should create up vector", () => {
      const v = Vector3D.up();
      expect(v.x).toBe(0);
      expect(v.y).toBe(1);
      expect(v.z).toBe(0);
    });

    it("should create forward vector", () => {
      const v = Vector3D.forward();
      expect(v.x).toBe(0);
      expect(v.y).toBe(0);
      expect(v.z).toBe(1);
    });

    it("should create right vector", () => {
      const v = Vector3D.right();
      expect(v.x).toBe(1);
      expect(v.y).toBe(0);
      expect(v.z).toBe(0);
    });
  });
});
