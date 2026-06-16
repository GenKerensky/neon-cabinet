import { describe, expect, it } from "vitest";
import type { WireframeRenderer } from "../engine/WireframeRenderer";
import type { ThreatKind } from "../rail/SegmentTypes";
import { createThreatWave, damageThreat } from "./Threats";
import {
  getThreatWireframeModel,
  renderThreatWireframes,
} from "./ThreatWireframes";

const ALL_THREAT_KINDS: ThreatKind[] = [
  "fighter",
  "elite-fighter",
  "mine",
  "turret",
  "shield-node",
  "gun-emplacement",
  "debris",
];

describe("ThreatWireframes", () => {
  it("provides a drawable model for every threat kind", () => {
    for (const kind of ALL_THREAT_KINDS) {
      const model = getThreatWireframeModel(kind);

      expect(model.vertices.length).toBeGreaterThan(0);
      expect(model.edges.length).toBeGreaterThan(0);
    }
  });

  it("renders only alive threats through the wireframe renderer", () => {
    const [fighter, turret] = createThreatWave(["fighter", "turret"], 1);
    const destroyedFighter = damageThreat(fighter, fighter.health);
    const calls: Array<{ x: number; y: number; z: number; color?: number }> =
      [];
    let cleared = false;
    const renderer = {
      clear: () => {
        cleared = true;
      },
      render: (_model, position, _rotation, _width, _height, color) => {
        calls.push({ x: position.x, y: position.y, z: position.z, color });
      },
    } as WireframeRenderer;

    renderThreatWireframes(
      renderer,
      [destroyedFighter, turret],
      { x: 30, y: -20 },
      1280,
      720,
    );

    expect(cleared).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      x: turret.x - 30 * 0.35,
      y: turret.y + 20 * 0.18,
      z: turret.z,
    });
    expect(calls[0].color).toBe(getThreatWireframeModel("turret").color);
  });
});
