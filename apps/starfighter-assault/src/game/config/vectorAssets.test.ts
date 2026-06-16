import { describe, expect, it } from "vitest";
import {
  createEmptyVectorMetadata,
  getStarfighterVectorAsset,
  resolveStarfighterAssetPath,
  STARFIGHTER_VECTOR_ASSETS,
} from "./vectorAssets";

describe("Starfighter vector assets", () => {
  it("registers the editable cockpit HUD SVG asset", () => {
    expect(STARFIGHTER_VECTOR_ASSETS).toContainEqual({
      id: "cockpitHud",
      cacheKey: "starfighter_cockpit_hud_svg",
      assetPath: "assets/vector/cockpit-hud.svg",
    });
    expect(getStarfighterVectorAsset("cockpitHud").cacheKey).toBe(
      "starfighter_cockpit_hud_svg",
    );
  });

  it("creates empty fallback metadata with the requested viewBox", () => {
    expect(createEmptyVectorMetadata(320, 180)).toEqual({
      viewBox: { x: 0, y: 0, width: 320, height: 180 },
      layers: [],
      sockets: [],
    });
  });

  it("resolves vector asset paths against an optional frontend asset base", () => {
    expect(resolveStarfighterAssetPath("assets/vector/cockpit-hud.svg")).toBe(
      "assets/vector/cockpit-hud.svg",
    );
    expect(
      resolveStarfighterAssetPath(
        "assets/vector/cockpit-hud.svg",
        "/starfighter-assault-assets/",
      ),
    ).toBe("/starfighter-assault-assets/vector/cockpit-hud.svg");
  });
});
