import { describe, expect, it } from "vitest";
import { generateSortie } from "./RouteGenerator";

describe("route generator", () => {
  it("generates three combat segments and a fixed capital ship finale", () => {
    const sortie = generateSortie({ seed: 42, difficulty: 1 });
    expect(sortie.segments).toHaveLength(3);
    expect(sortie.finale.kind).toBe("capital-ship");
  });

  it("keeps every segment inside pressure and steering constraints", () => {
    const sortie = generateSortie({ seed: 99, difficulty: 3 });
    for (const segment of sortie.segments) {
      expect(segment.constraints.maxSimultaneousThreats).toBeLessThanOrEqual(8);
      expect(segment.constraints.routeCurvature).toBeLessThanOrEqual(
        segment.constraints.maxRouteCurvature,
      );
      expect(segment.constraints.guaranteedDodgeLanes).toBeGreaterThanOrEqual(1);
      expect(segment.pickups.every((pickup) => pickup.inForcedDamageLane)).toBe(
        false,
      );
      expect(segment.bountyOpportunities).toBeGreaterThanOrEqual(1);
    }
  });

  it("creates two branch choices after the first two segments", () => {
    const sortie = generateSortie({ seed: 7, difficulty: 2 });
    expect(sortie.branches).toHaveLength(2);
    expect(sortie.branches[0]).toHaveLength(2);
    expect(sortie.branches[1]).toHaveLength(2);
    expect(sortie.branches[0][0].label).toMatch(/:/);
  });
});
