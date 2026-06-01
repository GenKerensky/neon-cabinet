import { describe, expect, it } from "vitest";
import { Vector3D } from "../engine/Vector3D";
import { EnemyProjectile } from "./EnemyProjectile";
import { Projectile } from "./Projectile";

describe("projectiles", () => {
  it("tracks the previous position before player projectile movement", () => {
    const projectile = new Projectile(
      new Vector3D(0, 5, 0),
      new Vector3D(1, 0, 0),
    );

    projectile.update(100);

    expect(projectile.previousPosition.x).toBeCloseTo(0);
    expect(projectile.previousPosition.y).toBeCloseTo(5);
    expect(projectile.previousPosition.z).toBeCloseTo(0);
    expect(projectile.position.x).toBeCloseTo(80);
  });

  it("tracks the previous position before enemy projectile movement", () => {
    const projectile = new EnemyProjectile(
      new Vector3D(0, 5, 0),
      new Vector3D(0, 0, 1),
      400,
    );

    projectile.update(100);

    expect(projectile.previousPosition.x).toBeCloseTo(0);
    expect(projectile.previousPosition.y).toBeCloseTo(5);
    expect(projectile.previousPosition.z).toBeCloseTo(0);
    expect(projectile.position.z).toBeCloseTo(40);
  });
});
