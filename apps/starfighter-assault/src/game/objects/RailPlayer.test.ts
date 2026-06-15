import { describe, expect, it } from "vitest";
import { RailPlayer } from "./RailPlayer";

describe("RailPlayer", () => {
  it("clamps pointer targets to half the flight box width and height", () => {
    const player = new RailPlayer({ width: 620, height: 380 });

    player.setPointerTarget(9999, -9999);

    expect(player.target).toEqual({ x: 310, y: -190 });
  });

  it("eases position toward target without overshooting", () => {
    const player = new RailPlayer({ width: 620, height: 380 });
    player.setPointerTarget(100, -50);

    player.update(0.1);

    expect(player.position.x).toBeGreaterThan(0);
    expect(player.position.x).toBeLessThan(100);
    expect(player.position.y).toBeLessThan(0);
    expect(player.position.y).toBeGreaterThan(-50);

    player.update(1);

    expect(player.position).toEqual(player.target);
  });
});
