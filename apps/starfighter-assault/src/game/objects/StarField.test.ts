import { describe, expect, it } from "vitest";
import type { FlightPoint } from "./RailPlayer";
import {
  createStarField,
  projectStar,
  projectStarField,
  type StarFieldStar,
} from "./StarField";

describe("StarField", () => {
  it("generates the same backdrop from the same seed", () => {
    const first = createStarField({ seed: 1983, count: 24 });
    const second = createStarField({ seed: 1983, count: 24 });

    expect(second).toEqual(first);
    expect(first).toHaveLength(24);
    expect(first.every((star) => star.x >= 0 && star.x <= 1)).toBe(true);
    expect(first.every((star) => star.y >= 0 && star.y <= 1)).toBe(true);
  });

  it("keeps stars static when the player position is unchanged", () => {
    const stars = createStarField({ seed: 64, count: 12 });
    const player: FlightPoint = { x: 42, y: -18 };

    expect(projectStarField(stars, 1280, 720, player)).toEqual(
      projectStarField(stars, 1280, 720, player),
    );
  });

  it("parallaxes opposite player movement with nearby stars shifting more", () => {
    const farStar: StarFieldStar = {
      x: 0.5,
      y: 0.5,
      layer: "far",
      radius: 1,
      color: 0x7be8ff,
      alpha: 0.3,
    };
    const nearStar: StarFieldStar = {
      ...farStar,
      layer: "near",
      alpha: 0.85,
    };
    const origin: FlightPoint = { x: 0, y: 0 };
    const moved: FlightPoint = { x: 80, y: 40 };

    const farOrigin = projectStar(farStar, 1280, 720, origin);
    const farMoved = projectStar(farStar, 1280, 720, moved);
    const nearOrigin = projectStar(nearStar, 1280, 720, origin);
    const nearMoved = projectStar(nearStar, 1280, 720, moved);

    expect(farMoved.x).toBeLessThan(farOrigin.x);
    expect(farMoved.y).toBeLessThan(farOrigin.y);
    expect(nearMoved.x).toBeLessThan(nearOrigin.x);
    expect(nearMoved.y).toBeLessThan(nearOrigin.y);
    expect(nearOrigin.x - nearMoved.x).toBeGreaterThan(
      farOrigin.x - farMoved.x,
    );
    expect(nearOrigin.y - nearMoved.y).toBeGreaterThan(
      farOrigin.y - farMoved.y,
    );
  });
});
