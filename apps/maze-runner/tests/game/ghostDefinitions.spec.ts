import { describe, it, expect } from "vitest";
import {
  buildGhostGameOverCopy,
  buildGhostAiProfile,
  getActiveGhostDefinitionsForLevel,
  ghostDefinitions,
} from "../../src/game/config/ghostDefinitions";

describe("ghostDefinitions", () => {
  it("defines six unique ghost variants", () => {
    expect(ghostDefinitions).toHaveLength(6);

    const ids = ghostDefinitions.map((ghost) => ghost.id);
    const svgCacheKeys = ghostDefinitions.map((ghost) => ghost.svgCacheKey);
    const assetPaths = ghostDefinitions.map((ghost) => ghost.assetPath);

    expect(new Set(ids).size).toBe(ghostDefinitions.length);
    expect(new Set(svgCacheKeys).size).toBe(ghostDefinitions.length);
    expect(new Set(assetPaths).size).toBe(ghostDefinitions.length);
  });

  it("keeps each definition structurally complete", () => {
    for (const ghost of ghostDefinitions) {
      expect(ghost.id).toEqual(expect.any(String));
      expect(ghost.svgCacheKey).toEqual(expect.any(String));
      expect(ghost.assetPath).toMatch(/^assets\/vector\/ghosts\/.*\.svg$/);
      expect(ghost.displayName).toEqual(expect.any(String));
      expect(ghost.personality).toEqual(expect.any(String));
      expect(ghost.catchPhrase).toEqual(expect.any(String));
      expect(ghost.progressionOrder).toEqual(expect.any(Number));

      expect(ghost.spawnOffset).toEqual({
        x: expect.any(Number),
        y: expect.any(Number),
      });

      expect(ghost.scatterTarget.kind).toMatch(/^(corner|edge)$/);
      if (ghost.scatterTarget.kind === "corner") {
        expect(ghost.scatterTarget.corner).toMatch(
          /^(topLeft|topRight|bottomLeft|bottomRight)$/,
        );
      } else {
        expect(ghost.scatterTarget.edge).toMatch(/^(top|bottom|left|right)$/);
        expect(ghost.scatterTarget.anchor).toBe("center");
      }

      expect(ghost.archetype).toMatch(
        /^(chaser|ambusher|wanderer|timid|sentinel|trickster)$/,
      );

      expect(ghost.behavior.speedMultiplier).toEqual(expect.any(Number));
      expect(ghost.behavior.aggression).toEqual(expect.any(Number));
      expect(ghost.behavior.caution).toEqual(expect.any(Number));
      if (ghost.behavior.ambusherPredictionCells !== undefined) {
        expect(ghost.behavior.ambusherPredictionCells).toEqual(
          expect.any(Number),
        );
      }
      if (ghost.behavior.wandererVectorScale !== undefined) {
        expect(ghost.behavior.wandererVectorScale).toEqual(expect.any(Number));
      }
      if (ghost.behavior.timidDistanceThreshold !== undefined) {
        expect(ghost.behavior.timidDistanceThreshold).toEqual(
          expect.any(Number),
        );
      }
    }
  });

  it("activates ghosts by stage progression from docile to aggressive", () => {
    expect(getActiveGhostDefinitionsForLevel(1).map((g) => g.id)).toEqual([
      "timid",
      "wanderer",
      "trickster",
    ]);

    expect(getActiveGhostDefinitionsForLevel(3).map((g) => g.id)).toEqual([
      "timid",
      "wanderer",
      "trickster",
      "sentinel",
    ]);

    expect(getActiveGhostDefinitionsForLevel(5).map((g) => g.id)).toEqual([
      "timid",
      "wanderer",
      "trickster",
      "sentinel",
      "ambusher",
    ]);

    expect(getActiveGhostDefinitionsForLevel(7).map((g) => g.id)).toEqual([
      "timid",
      "wanderer",
      "trickster",
      "sentinel",
      "ambusher",
      "chaser",
    ]);
  });

  it("builds explicit ai profile values from optional knobs", () => {
    const ambusher = ghostDefinitions.find((ghost) => ghost.id === "ambusher");
    const timid = ghostDefinitions.find((ghost) => ghost.id === "timid");
    const chaser = ghostDefinitions.find((ghost) => ghost.id === "chaser");

    expect(ambusher).toBeDefined();
    expect(timid).toBeDefined();
    expect(chaser).toBeDefined();

    const ambusherProfile = buildGhostAiProfile(ambusher!);
    const timidProfile = buildGhostAiProfile(timid!);
    const chaserProfile = buildGhostAiProfile(chaser!);

    expect(ambusherProfile.ambusherPredictionCells).toBe(5);
    expect(timidProfile.timidDistanceThreshold).toBe(10);
    expect(chaserProfile.ambusherPredictionCells).toBeGreaterThanOrEqual(2);
    expect(chaserProfile.wandererVectorScale).toBeGreaterThanOrEqual(1);
  });

  it("builds ghost-specific game over copy from archetype + persona", () => {
    const ambusher = ghostDefinitions.find((ghost) => ghost.id === "ambusher");
    const chaser = ghostDefinitions.find((ghost) => ghost.id === "chaser");

    expect(ambusher).toBeDefined();
    expect(chaser).toBeDefined();

    const ambusherCopy = buildGhostGameOverCopy(ambusher!);
    const chaserCopy = buildGhostGameOverCopy(chaser!);

    expect(ambusherCopy.headline).toBe(`Jumped by ${ambusher!.displayName}!`);
    expect(chaserCopy.headline).toBe(`Caught by ${chaser!.displayName}!`);
    expect(ambusherCopy.subline).toContain(ambusher!.personality);
    expect(ambusherCopy.subline).toContain(ambusher!.catchPhrase);
  });
});
