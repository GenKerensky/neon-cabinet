import { describe, expect, it, vi } from "vitest";
import { Vector3D } from "../engine/Vector3D";
import { EnemyManager } from "./EnemyManager";

describe("EnemyManager", () => {
  it("does not move enemy projectiles on the same frame they spawn", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const manager = new EnemyManager();
    manager.setDifficulty({
      detectionRange: 1000,
      fireRate: 0,
      projectileSpeed: 100,
    });
    manager.spawnTurret(new Vector3D(0, 0, 100), Math.PI);

    const events = manager.update(1000, Vector3D.zero(), {
      hasLineOfSight: () => true,
      getAvoidanceDirection: () => null,
    });
    vi.restoreAllMocks();

    const [projectile] = manager.getProjectiles();
    expect(events).toHaveLength(1);
    expect(projectile.position.x).toBeCloseTo(events[0].position.x);
    expect(projectile.position.z).toBeCloseTo(events[0].position.z);
    expect(projectile.previousPosition.x).toBeCloseTo(events[0].position.x);
    expect(projectile.previousPosition.z).toBeCloseTo(events[0].position.z);
  });

  it("does not expose mutable enemy internals through getters", () => {
    const manager = new EnemyManager();
    const turret = manager.spawnTurret(Vector3D.zero(), 0);

    (manager.getEnemies() as Array<typeof turret>).push(turret);

    expect(manager.getEnemyCount()).toBe(1);
  });
});
