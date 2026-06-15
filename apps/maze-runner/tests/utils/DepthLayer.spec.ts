import { describe, it, expect } from "vitest";
import { DepthLayer } from "../../src/game/utils/DepthLayer";

describe("DepthLayer", () => {
  it("exposes the expected numeric values", () => {
    expect(DepthLayer.FLOOR_GRID).toBe(0);
    expect(DepthLayer.SHADOWS).toBe(1);
    expect(DepthLayer.WALLS).toBe(2);
    expect(DepthLayer.COLLECTIBLES).toBe(5);
    expect(DepthLayer.CHARACTERS).toBe(10);
    expect(DepthLayer.PARTICLES).toBe(15);
    expect(DepthLayer.HUD).toBe(100);
    expect(DepthLayer.OVERLAY).toBe(999);
    expect(DepthLayer.SCREEN_FLASH).toBe(1000);
  });

  it("keeps the expected ordering", () => {
    expect(DepthLayer.FLOOR_GRID).toBeLessThan(DepthLayer.SHADOWS);
    expect(DepthLayer.SHADOWS).toBeLessThan(DepthLayer.WALLS);
    expect(DepthLayer.WALLS).toBeLessThan(DepthLayer.COLLECTIBLES);
    expect(DepthLayer.COLLECTIBLES).toBeLessThan(DepthLayer.CHARACTERS);
    expect(DepthLayer.CHARACTERS).toBeLessThan(DepthLayer.PARTICLES);
    expect(DepthLayer.PARTICLES).toBeLessThan(DepthLayer.HUD);
    expect(DepthLayer.HUD).toBeLessThan(DepthLayer.OVERLAY);
    expect(DepthLayer.OVERLAY).toBeLessThan(DepthLayer.SCREEN_FLASH);
  });
});
