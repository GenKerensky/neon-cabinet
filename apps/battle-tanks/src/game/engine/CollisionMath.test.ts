import { describe, expect, it } from "vitest";
import {
  circleAabbCollisionXZ,
  segmentAabbIntersectionXZ,
  segmentCircleIntersectionXZ,
} from "./CollisionMath";
import { Vector3D } from "./Vector3D";

describe("CollisionMath", () => {
  describe("segmentCircleIntersectionXZ", () => {
    it("returns the nearest entry hit and world distance", () => {
      const hit = segmentCircleIntersectionXZ(
        new Vector3D(0, 0, 0),
        new Vector3D(100, 0, 0),
        new Vector3D(50, 0, 0),
        10,
      );

      expect(hit).not.toBeNull();
      expect(hit?.distance).toBeCloseTo(40);
      expect(hit?.point.x).toBeCloseTo(40);
      expect(hit?.point.z).toBeCloseTo(0);
      expect(hit?.t).toBeCloseTo(0.4);
    });

    it("returns null when the circle is missed or outside the segment", () => {
      expect(
        segmentCircleIntersectionXZ(
          new Vector3D(0, 0, 0),
          new Vector3D(100, 0, 0),
          new Vector3D(50, 0, 20),
          5,
        ),
      ).toBeNull();

      expect(
        segmentCircleIntersectionXZ(
          new Vector3D(0, 0, 0),
          new Vector3D(100, 0, 0),
          new Vector3D(130, 0, 0),
          10,
        ),
      ).toBeNull();
    });
  });

  describe("segmentAabbIntersectionXZ", () => {
    it("returns the nearest entry hit for front, side, and diagonal hits", () => {
      const bounds = { minX: 40, maxX: 60, minZ: 40, maxZ: 60 };

      const frontHit = segmentAabbIntersectionXZ(
        new Vector3D(50, 0, 0),
        new Vector3D(50, 0, 100),
        bounds,
      );
      expect(frontHit?.distance).toBeCloseTo(40);
      expect(frontHit?.point.z).toBeCloseTo(40);

      const sideHit = segmentAabbIntersectionXZ(
        new Vector3D(0, 0, 50),
        new Vector3D(100, 0, 50),
        bounds,
      );
      expect(sideHit?.distance).toBeCloseTo(40);
      expect(sideHit?.point.x).toBeCloseTo(40);

      const diagonalHit = segmentAabbIntersectionXZ(
        new Vector3D(0, 0, 0),
        new Vector3D(100, 0, 100),
        bounds,
      );
      expect(diagonalHit?.distance).toBeCloseTo(Math.sqrt(40 ** 2 + 40 ** 2));
      expect(diagonalHit?.point.x).toBeCloseTo(40);
      expect(diagonalHit?.point.z).toBeCloseTo(40);
    });
  });

  describe("circleAabbCollisionXZ", () => {
    it("returns push vectors for side and corner overlaps", () => {
      const bounds = { minX: -20, maxX: 20, minZ: -10, maxZ: 10 };

      const side = circleAabbCollisionXZ(new Vector3D(25, 0, 0), 10, bounds);
      expect(side.collides).toBe(true);
      expect(side.pushX).toBeCloseTo(5);
      expect(side.pushZ).toBeCloseTo(0);

      const corner = circleAabbCollisionXZ(new Vector3D(25, 0, 15), 10, bounds);
      expect(corner.collides).toBe(true);
      expect(corner.pushX).toBeGreaterThan(0);
      expect(corner.pushZ).toBeGreaterThan(0);
    });

    it("returns no collision outside the expanded bounds", () => {
      const result = circleAabbCollisionXZ(new Vector3D(40, 0, 40), 5, {
        minX: -20,
        maxX: 20,
        minZ: -20,
        maxZ: 20,
      });

      expect(result).toEqual({ collides: false, pushX: 0, pushZ: 0 });
    });
  });
});
