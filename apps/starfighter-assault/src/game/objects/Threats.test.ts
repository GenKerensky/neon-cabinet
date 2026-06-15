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
});
