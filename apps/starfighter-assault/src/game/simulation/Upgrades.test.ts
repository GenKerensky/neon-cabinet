import { describe, expect, it } from "vitest";
import {
  createUpgradeState,
  getAvailableUpgrades,
  purchaseUpgrade,
} from "./Upgrades";

describe("upgrades", () => {
  it("starts with bounties and baseline upgrade bonuses", () => {
    const state = createUpgradeState(250);

    expect(state.bounties).toBe(250);
    expect(state.purchased).toEqual([]);
    expect(state.laserDamageMultiplier).toBe(1);
    expect(state.laserFireRateMultiplier).toBe(1);
    expect(state.torpedoCapacityBonus).toBe(0);
    expect(state.shieldMaxBonus).toBe(0);
    expect(state.radarClarity).toBe(1);
    expect(state.extraLives).toBe(0);
  });

  it("returns copies of the upgrade catalog", () => {
    const first = getAvailableUpgrades();
    const second = getAvailableUpgrades();

    first[0].cost = 1;

    expect(second.map((upgrade) => upgrade.id)).toEqual([
      "laser-damage-1",
      "laser-fire-rate-1",
      "torpedo-capacity-1",
      "shield-max-1",
      "radar-clarity-1",
      "extra-life",
    ]);
    expect(second[0].cost).not.toBe(1);
  });

  it("prevents unaffordable purchases", () => {
    const result = purchaseUpgrade(createUpgradeState(0), "laser-damage-1");

    expect(result.purchased).toBe(false);
    expect(result.state.purchased).toEqual([]);
    expect(result.state.bounties).toBe(0);
  });

  it("prevents duplicate purchases", () => {
    const first = purchaseUpgrade(createUpgradeState(1_000), "laser-damage-1");
    const second = purchaseUpgrade(first.state, "laser-damage-1");

    expect(first.purchased).toBe(true);
    expect(second.purchased).toBe(false);
    expect(second.state.purchased).toEqual(["laser-damage-1"]);
    expect(second.state.bounties).toBe(first.state.bounties);
    expect(second.state.laserDamageMultiplier).toBe(1.25);
  });

  it("spends bounties, records purchases, and applies effects", () => {
    let state = createUpgradeState(2_000);

    state = purchaseUpgrade(state, "laser-damage-1").state;
    state = purchaseUpgrade(state, "laser-fire-rate-1").state;
    state = purchaseUpgrade(state, "torpedo-capacity-1").state;
    state = purchaseUpgrade(state, "shield-max-1").state;
    state = purchaseUpgrade(state, "radar-clarity-1").state;

    expect(state.purchased).toEqual([
      "laser-damage-1",
      "laser-fire-rate-1",
      "torpedo-capacity-1",
      "shield-max-1",
      "radar-clarity-1",
    ]);
    expect(state.bounties).toBeLessThan(2_000);
    expect(state.laserDamageMultiplier).toBe(1.25);
    expect(state.laserFireRateMultiplier).toBe(1.15);
    expect(state.torpedoCapacityBonus).toBe(1);
    expect(state.shieldMaxBonus).toBe(25);
    expect(state.radarClarity).toBe(1.25);
  });

  it("makes extra life rare and expensive", () => {
    const extraLife = getAvailableUpgrades().find(
      (upgrade) => upgrade.id === "extra-life",
    );
    const state = createUpgradeState(extraLife?.cost ?? 0);
    const result = purchaseUpgrade(state, "extra-life");

    expect(extraLife?.cost).toBeGreaterThanOrEqual(500);
    expect(result.purchased).toBe(true);
    expect(result.state.extraLives).toBe(1);
    expect(result.state.purchased).toContain("extra-life");
  });
});
