import { Physics, Tweens } from "phaser";
import type { GameObjects, Scene } from "phaser";
import { Weapon } from "./Weapon";
import { Ship } from "./Ship";
import { Asteroid } from "./Asteroid";

export class LaserWeapon implements Weapon {
  name = "LASER";
  cooldown = 500;
  unlockScore = 1000;
  textureKey = "laser_icon";

  private asteroidGroup: Physics.Arcade.Group | null = null;
  private beamGraphics: GameObjects.Graphics | null = null;
  private beamTween: Tweens.Tween | null = null;

  setAsteroidGroup(group: Physics.Arcade.Group): void {
    this.asteroidGroup = group;
  }

  fire(
    scene: Scene,
    ship: Ship,
    targetX: number,
    targetY: number,
    onHitAsteroid?: (x: number, y: number) => void,
  ): void {
    const startX = ship.x;
    const startY = ship.y;
    const endX = targetX;
    const endY = targetY;

    // Draw laser beam
    this.drawBeam(scene, startX, startY, endX, endY);

    // Check for asteroid hits
    if (this.asteroidGroup) {
      const asteroids = this.asteroidGroup.getChildren() as Asteroid[];
      asteroids.forEach((asteroid) => {
        if (!asteroid.active) return;

        const hit = this.lineIntersectsCircle(
          startX,
          startY,
          endX,
          endY,
          asteroid.x,
          asteroid.y,
          (asteroid.width * asteroid.scaleX) / 2,
        );

        if (hit) {
          onHitAsteroid?.(asteroid.x, asteroid.y);
        }
      });
    }
  }

  private drawBeam(
    scene: Scene,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ): void {
    // Clean up previous beam
    if (this.beamGraphics) {
      this.beamTween?.destroy();
      this.beamGraphics.destroy();
    }

    this.beamGraphics = scene.add.graphics();
    this.beamGraphics.setDepth(10);

    // Red laser beam with gradient
    this.beamGraphics.lineStyle(12, 0xff0000, 0.5); // Outer red
    this.beamGraphics.lineBetween(x1, y1, x2, y2);
    this.beamGraphics.lineStyle(10, 0xff4444, 0.3); // Red
    this.beamGraphics.lineBetween(x1, y1, x2, y2);
    this.beamGraphics.lineStyle(5, 0xff8888, 0.6); // Light red
    this.beamGraphics.lineBetween(x1, y1, x2, y2);
    this.beamGraphics.lineStyle(2.5, 0xffaaaa, 1); // Lighter red
    this.beamGraphics.lineBetween(x1, y1, x2, y2);
    this.beamGraphics.lineStyle(1.5, 0xffffff, 1); // White core
    this.beamGraphics.lineBetween(x1, y1, x2, y2);

    // Fade out animation
    this.beamTween = scene.tweens.add({
      targets: this.beamGraphics,
      alpha: 0,
      duration: 150,
      onComplete: () => {
        this.beamGraphics?.destroy();
        this.beamGraphics = null;
      },
    });
  }

  private lineIntersectsCircle(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    cx: number,
    cy: number,
    r: number,
  ): boolean {
    // Vector from line start to circle center
    const dx = x2 - x1;
    const dy = y2 - y1;
    const fx = x1 - cx;
    const fy = y1 - cy;

    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - r * r;

    let discriminant = b * b - 4 * a * c;

    if (discriminant < 0) {
      return false;
    }

    discriminant = Math.sqrt(discriminant);

    const t1 = (-b - discriminant) / (2 * a);
    const t2 = (-b + discriminant) / (2 * a);

    // Check if intersection is within line segment
    if ((t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1)) {
      return true;
    }

    // Check if circle contains line start or end
    const distStart = Math.sqrt(fx * fx + fy * fy);
    const distEnd = Math.sqrt((x2 - cx) * (x2 - cx) + (y2 - cy) * (y2 - cy));

    return distStart <= r || distEnd <= r;
  }
}
