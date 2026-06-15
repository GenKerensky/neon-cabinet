import { describe, expect, it } from "vitest";
import { awardBounty, createBountyState, getBaseBountyValue } from "./Bounties";

describe("bounties", () => {
  it("awards every target kind with capital subsystems above fighters", () => {
    const state = createBountyState();
    const fighter = awardBounty(state, "fighter", 1_000);
    const elite = awardBounty(state, "elite-fighter", 5_000);
    const turret = awardBounty(state, "turret", 10_000);
    const gun = awardBounty(state, "gun-emplacement", 15_000);
    const shield = awardBounty(state, "shield-node", 20_000);
    const subsystem = awardBounty(state, "capital-subsystem", 25_000);
    const cache = awardBounty(state, "bounty-cache", 30_000);

    expect(fighter.awarded).toBeGreaterThan(0);
    expect(elite.awarded).toBeGreaterThan(fighter.awarded);
    expect(turret.awarded).toBeGreaterThan(fighter.awarded);
    expect(gun.awarded).toBeGreaterThan(fighter.awarded);
    expect(shield.awarded).toBeGreaterThan(fighter.awarded);
    expect(subsystem.awarded).toBeGreaterThan(fighter.awarded);
    expect(cache.awarded).toBeGreaterThan(fighter.awarded);
  });

  it("exposes base bounty values without streak multipliers", () => {
    expect(getBaseBountyValue("fighter")).toBe(20);
    expect(getBaseBountyValue("elite-fighter")).toBe(45);
    expect(getBaseBountyValue("turret")).toBe(40);
  });

  it("increases streak multiplier for fast awards and caps at 1.5", () => {
    let state = createBountyState();

    for (let index = 0; index < 8; index += 1) {
      state = awardBounty(state, "fighter", 1_000 + index * 500).state;
    }

    expect(state.streakMultiplier).toBe(1.5);
  });

  it("resets streak multiplier when awards are too far apart", () => {
    const first = awardBounty(createBountyState(), "fighter", 1_000);
    const second = awardBounty(first.state, "fighter", 4_000);

    expect(first.state.streakMultiplier).toBe(1);
    expect(second.state.streakMultiplier).toBe(1);
  });

  it("does not increase streak multiplier for out-of-order timestamps", () => {
    const first = awardBounty(createBountyState(), "fighter", 4_000);
    const second = awardBounty(first.state, "fighter", 3_000);

    expect(first.state.streakMultiplier).toBe(1);
    expect(second.state.streakMultiplier).toBe(1);
  });

  it("keeps award timing monotonic after stale timestamps", () => {
    const first = awardBounty(createBountyState(), "fighter", 10_000);
    const stale = awardBounty(first.state, "fighter", 1_000);
    const laterStale = awardBounty(stale.state, "fighter", 3_000);

    expect(stale.state.lastAwardAt).toBe(10_000);
    expect(stale.state.streakMultiplier).toBe(1);
    expect(laterStale.state.lastAwardAt).toBe(10_000);
    expect(laterStale.state.streakMultiplier).toBe(1);
  });
});
