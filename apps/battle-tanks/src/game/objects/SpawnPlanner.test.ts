import { describe, expect, it, vi } from "vitest";
import { Vector3D } from "../engine/Vector3D";
import { Obstacle } from "./Obstacle";
import { SpawnPlanner } from "./SpawnPlanner";

describe("SpawnPlanner", () => {
  it("places ring spawns around the current player position", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const planner = new SpawnPlanner({
      minDistance: 800,
      maxDistance: 800,
      minSpacing: 100,
    });

    const position = planner.planEnemySpawn(new Vector3D(1000, 0, 500), []);
    vi.restoreAllMocks();

    expect(position.x).toBeCloseTo(1800);
    expect(position.z).toBeCloseTo(500);
  });

  it("rejects positions too close to occupied points", () => {
    const random = vi
      .spyOn(Math, "random")
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.25)
      .mockReturnValueOnce(0);
    const planner = new SpawnPlanner({
      minDistance: 800,
      maxDistance: 800,
      minSpacing: 100,
    });

    const position = planner.planEnemySpawn(Vector3D.zero(), [
      new Vector3D(800, 0, 0),
    ]);
    random.mockRestore();

    expect(position.x).toBeCloseTo(0);
    expect(position.z).toBeCloseTo(800);
  });

  it("rejects positions whose player interaction is blocked by terrain", () => {
    const random = vi
      .spyOn(Math, "random")
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.25)
      .mockReturnValueOnce(0);
    const obstacle = new Obstacle(new Vector3D(400, 0, 0), "cube", {
      width: 40,
      depth: 40,
      height: 80,
    });
    const planner = new SpawnPlanner({
      minDistance: 800,
      maxDistance: 800,
      minSpacing: 100,
      obstacles: [obstacle],
    });

    const position = planner.planEnemySpawn(Vector3D.zero(), []);
    random.mockRestore();

    expect(position.x).toBeCloseTo(0);
    expect(position.z).toBeCloseTo(800);
  });

  it("returns a bounded fallback when all attempts fail", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const planner = new SpawnPlanner({
      minDistance: 800,
      maxDistance: 800,
      minSpacing: 1000,
      maxAttempts: 2,
    });

    const position = planner.planEnemySpawn(Vector3D.zero(), [
      new Vector3D(800, 0, 0),
    ]);
    vi.restoreAllMocks();

    expect(position.x).toBeCloseTo(800);
    expect(position.z).toBeCloseTo(0);
  });
});
