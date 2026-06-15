import { describe, expect, it } from "vitest";
import { createTitleAttractState } from "./TitleAttract";

describe("TitleAttract", () => {
  it("animates the capital ship flyby and radar contacts in a stable loop", () => {
    const start = createTitleAttractState(0);
    const mid = createTitleAttractState(4000);
    const looped = createTitleAttractState(8000);

    expect(start.capitalShip.scale).toBeGreaterThanOrEqual(0.65);
    expect(start.capitalShip.scale).toBeLessThanOrEqual(1.15);
    expect(mid.capitalShip.scale).not.toBe(start.capitalShip.scale);
    expect(looped.capitalShip.scale).toBe(start.capitalShip.scale);
    expect(start.radarContacts).toHaveLength(5);
    expect(start.radarContacts.some((contact) => contact.alpha > 0.85)).toBe(true);
  });
});
