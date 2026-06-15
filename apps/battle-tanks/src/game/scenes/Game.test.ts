import { describe, expect, it, vi } from "vitest";
import { Vector3D } from "../engine/Vector3D";
import { Projectile } from "../objects/Projectile";
import { Game } from "./Game";

vi.mock("phaser", () => ({
  Scene: class {},
  GameObjects: {},
  Input: {
    Keyboard: {
      KeyCodes: {
        C: 67,
        D: 68,
        E: 69,
        ESC: 27,
        Q: 81,
        R: 82,
        SPACE: 32,
        W: 87,
        A: 65,
        S: 83,
      },
    },
  },
}));

type GameInternals = {
  projectiles: Projectile[];
  enemyManager: { getEnemies(): FakeEnemy[]; getProjectiles(): Projectile[] };
  terrainManager: {
    raycast(
      start: Vector3D,
      end: Vector3D,
      radius?: number,
    ): { point: Vector3D; distance: number } | null;
  };
  particles: {
    emit(point: Vector3D, count: number, preset: unknown): void;
    emitRing(point: Vector3D, count: number, preset: unknown): void;
  };
  tank: {
    collisionRadius: number;
    getCollisionCenter(): Vector3D;
    takeDamageFromPosition(point: Vector3D): void;
    isDead(): boolean;
    addScore(points: number): void;
  };
  screenShake: { fire(): void; hit(): void };
  laserBeams: unknown[];
  checkPlayerProjectileCollisions(): void;
  checkEnemyProjectileCollisions(): void;
  fireLaser(start: Vector3D, direction: Vector3D, range: number): void;
};

class FakeEnemy {
  readonly collisionRadius = 12;
  readonly points = 100;
  readonly position: Vector3D;
  damage = 0;

  constructor(x: number) {
    this.position = new Vector3D(x, 0, 0);
  }

  isAlive(): boolean {
    return true;
  }

  isDead(): boolean {
    return false;
  }

  takeDamage(): void {
    this.damage++;
  }

  getCollisionCenter(): Vector3D {
    return new Vector3D(this.position.x, 50, this.position.z);
  }
}

function createGameHarness(enemies: FakeEnemy[] = []): {
  game: GameInternals;
  emitted: Vector3D[];
} {
  const emitted: Vector3D[] = [];
  const game = Object.create(Game.prototype) as GameInternals;
  game.projectiles = [];
  game.enemyManager = {
    getEnemies: () => enemies,
    getProjectiles: () => [],
  };
  game.terrainManager = {
    raycast: () => null,
  };
  game.particles = {
    emit: (point) => emitted.push(point.clone()),
    emitRing: () => undefined,
  };
  game.tank = {
    collisionRadius: 40,
    getCollisionCenter: () => new Vector3D(50, 50, 0),
    takeDamageFromPosition: () => undefined,
    isDead: () => false,
    addScore: () => undefined,
  };
  game.screenShake = {
    fire: () => undefined,
    hit: () => undefined,
  };
  game.laserBeams = [];
  return { game, emitted };
}

describe("Game combat collision", () => {
  it("registers a fast player projectile crossing an enemy between frames", () => {
    const enemy = new FakeEnemy(40);
    const { game, emitted } = createGameHarness([enemy]);
    const projectile = new Projectile(
      new Vector3D(0, 50, 0),
      new Vector3D(1, 0, 0),
    );
    projectile.update(100);
    game.projectiles = [projectile];

    game.checkPlayerProjectileCollisions();

    expect(enemy.damage).toBe(1);
    expect(projectile.isAlive()).toBe(false);
    expect(emitted[0].x).toBeCloseTo(18);
  });

  it("lets terrain block a fast player projectile before a farther enemy", () => {
    const enemy = new FakeEnemy(100);
    const { game, emitted } = createGameHarness([enemy]);
    const projectile = new Projectile(
      new Vector3D(0, 50, 0),
      new Vector3D(1, 0, 0),
    );
    projectile.update(100);
    game.projectiles = [projectile];
    game.terrainManager.raycast = () => ({
      point: new Vector3D(30, 50, 0),
      distance: 30,
    });

    game.checkPlayerProjectileCollisions();

    expect(enemy.damage).toBe(0);
    expect(projectile.isAlive()).toBe(false);
    expect(emitted[0].x).toBeCloseTo(30);
  });

  it("lets laser terrain occlusion beat an enemy behind cover", () => {
    const enemy = new FakeEnemy(80);
    const { game } = createGameHarness([enemy]);
    game.terrainManager.raycast = () => ({
      point: new Vector3D(40, 50, 0),
      distance: 40,
    });

    game.fireLaser(new Vector3D(0, 50, 0), new Vector3D(1, 0, 0), 200);

    expect(enemy.damage).toBe(0);
    expect(game.laserBeams).toHaveLength(1);
  });

  it("damages the nearest laser enemy when terrain does not block the shot", () => {
    const farEnemy = new FakeEnemy(180);
    const nearEnemy = new FakeEnemy(90);
    const { game } = createGameHarness([farEnemy, nearEnemy]);

    game.fireLaser(new Vector3D(0, 50, 0), new Vector3D(1, 0, 0), 250);

    expect(nearEnemy.damage).toBe(1);
    expect(farEnemy.damage).toBe(0);
  });
});
