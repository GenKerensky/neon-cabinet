import { describe, expect, it, vi } from "vitest";
import { Vector3D } from "../engine/Vector3D";
import { PickupManager } from "./PickupManager";

describe("PickupManager", () => {
  it("spawns between 2 and armorPickupsPerWave armor pickups inclusively", () => {
    const minRandom = vi.spyOn(Math, "random").mockReturnValue(0);
    const minManager = new PickupManager({
      armorPickupsPerWave: 4,
      minSpawnDistance: 100,
      maxSpawnDistance: 100,
      minSpacing: 0,
    });
    minManager.generatePickups(1, Vector3D.zero(), [], true);
    minRandom.mockRestore();

    const maxRandom = vi.spyOn(Math, "random").mockReturnValue(0.999);
    const maxManager = new PickupManager({
      armorPickupsPerWave: 4,
      minSpawnDistance: 100,
      maxSpawnDistance: 100,
      minSpacing: 0,
    });
    maxManager.generatePickups(1, Vector3D.zero(), [], true);
    maxRandom.mockRestore();

    expect(minManager.getPickupCount()).toBe(2);
    expect(maxManager.getPickupCount()).toBe(4);
  });
});
