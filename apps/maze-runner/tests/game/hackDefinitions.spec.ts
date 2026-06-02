import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SVGParser } from "@neon-cabinet/sprite-tools";
import {
  hackPickupDefinitions,
  hackPickupIds,
} from "../../src/game/config/hackDefinitions";

describe("hackDefinitions", () => {
  it("defines eight unique signal hacks with stable cache keys", () => {
    expect(hackPickupIds).toHaveLength(8);
    expect(new Set(hackPickupIds).size).toBe(8);
    expect(hackPickupDefinitions).toHaveLength(8);
    expect(
      new Set(hackPickupDefinitions.map((definition) => definition.id)).size,
    ).toBe(8);
    expect(
      new Set(hackPickupDefinitions.map((definition) => definition.svgCacheKey))
        .size,
    ).toBe(8);
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
