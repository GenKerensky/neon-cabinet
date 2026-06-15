import { describe, expect, it } from "vitest";
import { projectThreatsToRadar } from "./RadarProjection";

describe("radar projection", () => {
  it("only includes threats in the forward combat view within radar range", () => {
    const dots = projectThreatsToRadar([
      { id: "forward", x: 0, y: 0, z: 900, threat: 0.5 },
      { id: "behind", x: 0, y: 0, z: -50, threat: 1 },
      { id: "too-far", x: 0, y: 0, z: 2_000, threat: 1 },
      { id: "edge", x: 0, y: 0, z: 1_800, threat: 0.2 },
    ]);

    expect(dots.map((dot) => dot.id)).toEqual(["forward", "edge"]);
  });

  it("makes close threats brighter and larger than distant threats", () => {
    const [close, distant] = projectThreatsToRadar([
      { id: "close", x: 0, y: 0, z: 200, threat: 0.7 },
      { id: "distant", x: 0, y: 0, z: 1_500, threat: 0.7 },
    ]);

    expect(close.radius).toBeGreaterThan(distant.radius);
    expect(close.alpha).toBeGreaterThan(distant.alpha);
    expect(close.color).toBe("#ff3b3b");
    expect(distant.color).toBe("#ff9a9a");
  });

  it("maps world x positions into normalized ovular radar coordinates", () => {
    const dots = projectThreatsToRadar([
      { id: "left", x: -350, y: 0, z: 800, threat: 0.5 },
      { id: "center", x: 0, y: 0, z: 800, threat: 0.5 },
      { id: "right", x: 350, y: 0, z: 800, threat: 0.5 },
      { id: "clamped", x: 1_400, y: 0, z: 800, threat: 0.5 },
    ]);

    expect(dots.find((dot) => dot.id === "left")?.x).toBeCloseTo(-0.5);
    expect(dots.find((dot) => dot.id === "center")?.x).toBe(0);
    expect(dots.find((dot) => dot.id === "right")?.x).toBeCloseTo(0.5);
    expect(dots.find((dot) => dot.id === "clamped")?.x).toBe(1);
    expect(dots.every((dot) => dot.y >= -1 && dot.y <= 1)).toBe(true);
  });
});
