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
      for (const pickup of segment.pickups) {
        expect(pickup.inForcedDamageLane).toBe(false);
      }
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

  it("keeps branch choices forward-looking through the sortie", () => {
    const sortie = generateSortie({ seed: 7, difficulty: 2 });
    const completedSegmentIds = new Set([sortie.segments[0].id]);
    for (const branch of sortie.branches[0]) {
      expect(completedSegmentIds.has(branch.segmentId)).toBe(false);
    }

    completedSegmentIds.add(sortie.segments[1].id);
    for (const branch of sortie.branches[1]) {
      expect(completedSegmentIds.has(branch.segmentId)).toBe(false);
      expect(branch.segmentId).toBe(sortie.segments[2].id);
    }
    expect(new Set(sortie.branches[1].map((branch) => branch.label)).size).toBe(
      2,
    );
  });

  it("normalizes non-finite difficulty to bounded constraints", () => {
    const sortie = generateSortie({ seed: 11, difficulty: Number.NaN });
    expect(sortie.difficulty).toBe(1);
    for (const segment of sortie.segments) {
      expect(Number.isFinite(segment.constraints.maxSimultaneousThreats)).toBe(
        true,
      );
      expect(segment.constraints.maxSimultaneousThreats).toBeGreaterThanOrEqual(
        3,
      );
      expect(segment.constraints.maxSimultaneousThreats).toBeLessThanOrEqual(8);
    }
  });

  it("does not share allowed threat arrays between generated sorties", () => {
    const sortie = generateSortie({ seed: 42, difficulty: 1 });
    sortie.segments[0].allowedThreats.push("turret");

    const regenerated = generateSortie({ seed: 42, difficulty: 1 });
    expect(regenerated.segments[0].allowedThreats).toEqual(["fighter", "mine"]);
  });
});
