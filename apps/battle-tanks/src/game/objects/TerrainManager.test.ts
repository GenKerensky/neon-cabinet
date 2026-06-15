import { describe, expect, it, vi } from "vitest";
import { Vector3D } from "../engine/Vector3D";
import { TerrainManager } from "./TerrainManager";

describe("TerrainManager", () => {
  it("raycasts against the nearest terrain footprint", () => {
    const terrain = new TerrainManager();
    terrain.setObstaclesForTest([
      {
        position: new Vector3D(100, 0, 0),
        type: "cube",
        dimensions: { width: 10, depth: 10, height: 20 },
      },
      {
        position: new Vector3D(50, 0, 0),
        type: "cube",
        dimensions: { width: 10, depth: 10, height: 20 },
      },
    ]);

    const hit = terrain.raycast(new Vector3D(0, 0, 0), new Vector3D(200, 0, 0));

    expect(hit).not.toBeNull();
    expect(hit?.distance).toBeCloseTo(40);
    expect(hit?.point.x).toBeCloseTo(40);
    expect(hit?.obstacle.position.x).toBeCloseTo(50);
  });

  it("generates terrain around the current player position", () => {
    const terrain = new TerrainManager({
      minDistance: 300,
      maxDistance: 300,
      minSpacing: 1,
      minWidth: 25,
      maxWidth: 25,
      minHeight: 40,
      maxHeight: 40,
    });
    const random = vi.spyOn(Math, "random").mockReturnValue(0);

    terrain.generateTerrain(1, new Vector3D(1000, 0, 500), []);
    random.mockRestore();

    const [obstacle] = terrain.getObstacles();
    expect(obstacle.position.x).toBeCloseTo(1300);
    expect(obstacle.position.z).toBeCloseTo(500);
  });
});
