import { describe, expect, it, vi } from "vitest";
import { Camera3D } from "../engine/Camera3D";
import { Mountains } from "./Mountains";

function createSceneStub() {
  const graphics = {
    setDepth: () => graphics,
    clear: () => undefined,
    fillStyle: () => graphics,
    beginPath: () => undefined,
    moveTo: () => undefined,
    lineTo: () => undefined,
    closePath: () => undefined,
    fillPath: () => undefined,
    lineStyle: () => graphics,
    strokePath: () => undefined,
    destroy: () => undefined,
  };

  return { add: { graphics: () => graphics } };
}

describe("Mountains", () => {
  it("projects peaks without using the allocating worldToScreen path", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const mountains = new Mountains(createSceneStub() as never);
    vi.restoreAllMocks();
    const camera = new Camera3D(400);
    camera.worldToScreen = vi.fn(camera.worldToScreen.bind(camera));

    mountains.render(camera, 800, 600);
    mountains.render(camera, 800, 600);

    expect(camera.worldToScreen).not.toHaveBeenCalled();
  });
});
