import { describe, expect, it } from "vitest";
import { createThreatWave, damageThreat, getAliveThreats } from "./Threats";

describe("Threats", () => {
  it("creates threat waves from segment threat kinds", () => {
    const threats = createThreatWave(["fighter", "turret"], 2);

    expect(threats.map((threat) => threat.kind)).toEqual([
      "fighter",
      "turret",
    ]);
    expect(threats.every((threat) => threat.health > 0)).toBe(true);
  });

  it("excludes destroyed threats from alive threats", () => {
    const [fighter, turret] = createThreatWave(["fighter", "turret"], 2);

    const destroyedFighter = damageThreat(fighter, fighter.health);

    expect(destroyedFighter.health).toBe(0);
    expect(getAliveThreats([destroyedFighter, turret])).toEqual([turret]);
  });

  it("normalizes invalid difficulty before calculating health and bounty values", () => {
    const threats = [
      ...createThreatWave(["fighter", "turret"], Number.NaN),
      ...createThreatWave(["fighter", "turret"], Number.POSITIVE_INFINITY),
      ...createThreatWave(["fighter", "turret"], -4),
    ];

    expect(
      threats.every(
        (threat) =>
          Number.isFinite(threat.health) &&
          threat.health > 0 &&
          Number.isFinite(threat.bountyValue) &&
          threat.bountyValue >= 0,
      ),
    ).toBe(true);
  });

  it("ignores invalid damage without healing or corrupting health", () => {
    const [fighter] = createThreatWave(["fighter"], 2);

    expect(damageThreat(fighter, -10).health).toBe(fighter.health);
    expect(damageThreat(fighter, Number.NaN).health).toBe(fighter.health);
    expect(damageThreat(fighter, Number.POSITIVE_INFINITY).health).toBe(
      fighter.health,
    );
  });

  it("uses bounty economy values for compatible threat rewards", () => {
    const [fighter, eliteFighter, turret] = createThreatWave(
      ["fighter", "elite-fighter", "turret"],
      2,
    );

    expect(eliteFighter.bountyValue).toBeGreaterThan(fighter.bountyValue);
    expect(turret.bountyValue).toBeGreaterThan(fighter.bountyValue);
  });
});
