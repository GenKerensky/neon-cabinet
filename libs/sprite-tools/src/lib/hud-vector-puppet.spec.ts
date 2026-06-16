import type * as Phaser from "phaser";
import { describe, expect, it } from "vitest";
import { HudVectorPuppet } from "./hud-vector-puppet.js";
import type { SVGPuppetMetadata } from "./types.js";
import { MockScene } from "./phaser-mocks.js";

describe("HudVectorPuppet", () => {
  const isPhaserScene = (scene: unknown): scene is Phaser.Scene =>
    typeof scene === "object" &&
    scene !== null &&
    "add" in scene &&
    "tweens" in scene;

  const createPuppet = (
    scene: unknown,
    metadata: SVGPuppetMetadata,
  ): HudVectorPuppet => {
    if (!isPhaserScene(scene)) {
      throw new Error("MockScene is not a Phaser.Scene");
    }

    return new HudVectorPuppet(scene, 0, 0, metadata);
  };

  it("resolves sockets by HUD role", () => {
    const scene = new MockScene();
    const puppet = createPuppet(scene, {
      viewBox: { x: 0, y: 0, width: 320, height: 180 },
      layers: [],
      sockets: [
        {
          id: "socket_radar_center",
          x: 160,
          y: 148,
          type: "hud",
          hud: { role: "radar-center", bind: "radar" },
        },
      ],
    });

    expect(puppet.getSocketByHudRole("radar-center")).toEqual({
      id: "socket_radar_center",
      x: 160,
      y: 148,
      type: "hud",
      hud: { role: "radar-center", bind: "radar" },
    });
  });

  it("applies a named HUD state style to an editable layer", () => {
    const scene = new MockScene();
    const puppet = createPuppet(scene, {
      viewBox: { x: 0, y: 0, width: 320, height: 180 },
      layers: [
        {
          id: "torpedo_meter",
          type: "rect",
          x: 10,
          y: 10,
          width: 24,
          height: 8,
          fill: "#020107",
          stroke: "#7be8ff",
          strokeWidth: 2,
          opacity: 0.9,
          animations: [],
          material: {},
          hud: {
            role: "ammo-indicator",
            bind: "torpedoes",
            stateStyles: {
              empty: {
                stroke: "#ff43d6",
                fill: "#220019",
                opacity: 0.45,
              },
            },
          },
        },
      ],
      sockets: [],
    });

    const layer = puppet.getHudLayerMetadata("torpedo_meter");
    expect(layer?.stroke).toBe("#7be8ff");

    puppet.applyHudState("torpedoes", "empty");

    expect(puppet.getHudLayerMetadata("torpedo_meter")).toMatchObject({
      stroke: "#ff43d6",
      fill: "#220019",
      opacity: 0.45,
    });
  });

  it("applies visibility and opacity HUD states to grouped layers", () => {
    const scene = new MockScene();
    const puppet = createPuppet(scene, {
      viewBox: { x: 0, y: 0, width: 320, height: 180 },
      layers: [
        {
          id: "warning_cluster",
          type: "group",
          opacity: 1,
          visible: true,
          animations: [],
          material: {},
          hud: {
            role: "warning-cluster",
            bind: "shields",
            stateStyles: {
              down: {
                opacity: 0.35,
                visible: false,
              },
            },
          },
          children: [
            {
              id: "warning_line",
              type: "line",
              x1: 10,
              y1: 10,
              x2: 24,
              y2: 10,
              stroke: "#7be8ff",
              strokeWidth: 2,
              animations: [],
              material: {},
            },
          ],
        },
      ],
      sockets: [],
    });

    const layer = puppet.getLayer("warning_cluster") as
      | { alpha: number; visible: boolean }
      | undefined;
    expect(layer).toMatchObject({ alpha: 1, visible: true });

    puppet.applyHudState("shields", "down");

    expect(layer).toMatchObject({ alpha: 0.35, visible: false });
  });
});
