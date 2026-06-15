import { describe, expect, it } from "vitest";
import { Camera3D } from "./Camera3D";
import { Vector3D } from "./Vector3D";

describe("Camera3D", () => {
  it("rejects points behind the near clip and beyond far clip", () => {
    const camera = new Camera3D(400);
    camera.position = new Vector3D(0, 0, 0);
    camera.nearClip = 10;
    camera.farClip = 100;

    expect(camera.worldToScreen(new Vector3D(0, 0, 5), 800, 600)).toBeNull();
    expect(camera.worldToScreen(new Vector3D(0, 0, 101), 800, 600)).toBeNull();
    expect(camera.worldToScreen(new Vector3D(0, 0, 50), 800, 600)).toEqual({
      x: 400,
      y: 300,
      z: 50,
    });
  });

  it("computes camera-space frustum bounds from viewport and focal length", () => {
    const camera = new Camera3D(400);

    const bounds = camera.getFrustumBounds(800, 600, 100);

    expect(bounds.minX).toBeCloseTo(-100);
    expect(bounds.maxX).toBeCloseTo(100);
    expect(bounds.minY).toBeCloseTo(-75);
    expect(bounds.maxY).toBeCloseTo(75);
  });
});
