import { describe, expect, it } from "vitest";
import type { WireframePreviewModel } from "../assets/wire-sidecar";
import {
  advanceAutoOrbit,
  computeModelBounds,
  createInitialPreviewState,
  zoomPreviewState,
} from "./wireframe-preview-state";

const MODEL: WireframePreviewModel = {
  vertices: [
    { x: -10, y: -5, z: -20 },
    { x: 20, y: 15, z: 30 },
  ],
  edges: [{ start: 0, end: 1 }],
  color: 0x7be8ff,
};

describe("wireframe preview state", () => {
  it("computes model bounds and framing distance from vertices", () => {
    const bounds = computeModelBounds(MODEL);

    expect(bounds.center).toEqual({ x: 5, y: 5, z: 5 });
    expect(bounds.size).toEqual({ x: 30, y: 20, z: 50 });
    expect(bounds.radius).toBeCloseTo(30.822, 3);
    expect(bounds.framingDistance).toBeGreaterThan(100);
  });

  it("clamps zoom changes around the model framing distance", () => {
    const state = createInitialPreviewState(MODEL);

    expect(zoomPreviewState(state, -999).zoomDistance).toBeCloseTo(
      state.minZoomDistance,
    );
    expect(zoomPreviewState(state, 999).zoomDistance).toBeCloseTo(
      state.maxZoomDistance,
    );
  });

  it("advances auto orbit unless the user is dragging", () => {
    const state = {
      ...createInitialPreviewState(MODEL),
      autoOrbit: true,
      yaw: 10,
    };

    expect(advanceAutoOrbit(state, 1000, false).yaw).toBeCloseTo(22);
    expect(advanceAutoOrbit(state, 1000, true).yaw).toBe(10);
    expect(
      advanceAutoOrbit({ ...state, autoOrbit: false }, 1000, false).yaw,
    ).toBe(10);
  });
});
