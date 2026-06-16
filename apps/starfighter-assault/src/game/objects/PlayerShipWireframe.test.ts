import { describe, expect, it } from "vitest";
import type { WireframeRenderer } from "../engine/WireframeRenderer";
import {
  getPlayerShipWireframeModel,
  renderPlayerShipWireframe,
} from "./PlayerShipWireframe";

describe("PlayerShipWireframe", () => {
  it("uses an angular cockpit-view ship model with detailed dual cannons", () => {
    const model = getPlayerShipWireframeModel();
    const cannonEdges = model.edges.filter((edge) => edge.color === 0xff2bd6);

    expect(model.vertices.length).toBeGreaterThanOrEqual(24);
    expect(model.edges.length).toBeGreaterThanOrEqual(34);
    expect(cannonEdges.length).toBeGreaterThanOrEqual(12);
    expect(
      model.vertices.some((vertex) => vertex.x < -120 && vertex.z > 120),
    ).toBe(true);
    expect(
      model.vertices.some((vertex) => vertex.x > 120 && vertex.z > 120),
    ).toBe(true);
  });

  it("renders from the camera-inside-cockpit origin without consuming HUD geometry", () => {
    const calls: Array<{
      vertices: number;
      x: number;
      y: number;
      z: number;
      color?: number;
    }> = [];
    let cleared = false;
    const renderer = {
      clear: () => {
        cleared = true;
      },
      render: (model, position, _rotation, _width, _height, color) => {
        calls.push({
          vertices: model.vertices.length,
          x: position.x,
          y: position.y,
          z: position.z,
          color,
        });
      },
    } as WireframeRenderer;

    renderPlayerShipWireframe(renderer, 1280, 720);

    expect(cleared).toBe(true);
    expect(calls).toEqual([
      {
        vertices: getPlayerShipWireframeModel().vertices.length,
        x: 0,
        y: 0,
        z: 0,
        color: getPlayerShipWireframeModel().color,
      },
    ]);
  });
});
