import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SVGParser } from "@neon-cabinet/sprite-tools";
import {
  hackPickupDefinitions,
  hackPickupIds,
} from "../../src/game/config/hackDefinitions";

describe("hackDefinitions", () => {
  it("defines nine unique signal hacks with slots, HUD copy, and stable cache keys", () => {
    expect(hackPickupIds).toHaveLength(9);
    expect(new Set(hackPickupIds).size).toBe(9);
    expect(hackPickupDefinitions).toHaveLength(9);
    expect(
      new Set(hackPickupDefinitions.map((definition) => definition.id)).size,
    ).toBe(9);
    expect(
      new Set(hackPickupDefinitions.map((definition) => definition.svgCacheKey))
        .size,
    ).toBe(9);
    expect(
      hackPickupDefinitions.every(
        (definition) => definition.slot === "def" || definition.slot === "atk",
      ),
    ).toBe(true);
    expect(
      hackPickupDefinitions.every(
        (definition) => definition.hudDescription.length > 0,
      ),
    ).toBe(true);
  });

  it("classifies Null Lance as a late-game ATK hack", () => {
    const nullLance = hackPickupDefinitions.find(
      (definition) => definition.id === "null-lance",
    );

    expect(nullLance).toMatchObject({
      id: "null-lance",
      displayName: "Null Lance",
      shortName: "NULL",
      slot: "atk",
      assetPath: "assets/vector/hacks/null-lance.svg",
      hudDescription: "Beam the first ghost in your line.",
    });
  });

  it("ships parseable 32x32 SVG puppet assets for every hack", () => {
    const parser = new SVGParser();

    for (const definition of hackPickupDefinitions) {
      const svgPath = join(
        process.cwd(),
        "public",
        definition.assetPath.replace(/^assets\//, "assets/"),
      );
      const svg = readFileSync(svgPath, "utf8");
      const metadata = parser.parse(svg);

      expect(metadata.viewBox).toEqual({ x: 0, y: 0, width: 32, height: 32 });
      expect(metadata.layers.some((layer) => layer.id === "body")).toBe(true);
      expect(metadata.layers.length).toBeGreaterThanOrEqual(2);
    }
  });
});
