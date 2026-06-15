import { describe, expect, it } from "vitest";
import { createWeaponsState, fireLaser, fireTorpedo } from "./Weapons";

describe("weapons", () => {
  it("starts with cool dual lasers and three torpedoes", () => {
    const state = createWeaponsState();

    expect(state.laserHeat).toBe(0);
    expect(state.laserDamage).toBe(10);
    expect(state.torpedoes).toBe(3);
    expect(state.torpedoCapacity).toBe(3);
  });

  it("fires left and right lasers without consuming ammo", () => {
    const state = createWeaponsState();
    const result = fireLaser(state, "fighter-1");

    expect(result.shots).toEqual([
      { cannon: "left-cannon", target: "fighter-1", damage: 10 },
      { cannon: "right-cannon", target: "fighter-1", damage: 10 },
    ]);
    expect(result.state.torpedoes).toBe(state.torpedoes);
    expect(result.state.torpedoCapacity).toBe(state.torpedoCapacity);
    expect(result.state.laserHeat).toBeGreaterThan(state.laserHeat);
  });

  it("caps laser heat at 100", () => {
    const state = { ...createWeaponsState(), laserHeat: 95 };
    const result = fireLaser(state, "turret-1");

    expect(result.state.laserHeat).toBe(100);
  });

  it("consumes torpedoes until inventory is empty", () => {
    const state = createWeaponsState();
    const first = fireTorpedo(state);
    const second = fireTorpedo(first.state);
    const third = fireTorpedo(second.state);
    const empty = fireTorpedo(third.state);

    expect(first).toMatchObject({ fired: true, damage: 90 });
    expect(third).toMatchObject({ fired: true, damage: 90 });
    expect(third.state.torpedoes).toBe(0);
    expect(empty).toMatchObject({ fired: false, damage: 0 });
    expect(empty.state.torpedoes).toBe(0);
  });
});
