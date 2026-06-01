import { describe, expect, it } from "vitest";
import { Camera3D } from "./Camera3D";
import { Vector3D } from "./Vector3D";
import { createModel } from "./WireframeModel";
import { WireframeRenderer } from "./WireframeRenderer";

function createSceneStub() {
  const calls: string[] = [];
  const graphics = {
    setDepth: () => graphics,
    clear: () => calls.push("clear"),
    lineStyle: () => calls.push("lineStyle"),
    beginPath: () => calls.push("beginPath"),
    moveTo: () => calls.push("moveTo"),
    lineTo: () => calls.push("lineTo"),
    strokePath: () => calls.push("strokePath"),
    destroy: () => calls.push("destroy"),
  };

  return {
    calls,
    scene: { add: { graphics: () => graphics } },
  };
}

describe("WireframeRenderer", () => {
  it("does not draw edges fully outside the camera frustum", () => {
    const camera = new Camera3D(400);
    camera.position = new Vector3D(0, 0, 0);
    const { calls, scene } = createSceneStub();
    const renderer = new WireframeRenderer(scene as never, camera);
    const model = createModel(
      [new Vector3D(1000, 0, 100), new Vector3D(1100, 0, 100)],
      [[0, 1]],
    );

    renderer.render(model, Vector3D.zero(), 0, 800, 600);

    expect(calls).not.toContain("strokePath");
  });

  it("clips near-plane crossing edges and draws the visible segment", () => {
    const camera = new Camera3D(400);
    camera.position = new Vector3D(0, 0, 0);
    camera.nearClip = 10;
    const { calls, scene } = createSceneStub();
    const renderer = new WireframeRenderer(scene as never, camera);
    const model = createModel(
      [new Vector3D(0, 0, 5), new Vector3D(0, 0, 100)],
      [[0, 1]],
    );

    renderer.render(model, Vector3D.zero(), 0, 800, 600);

    expect(calls).toContain("strokePath");
  });
});
