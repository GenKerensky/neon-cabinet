import Phaser from "phaser";
import { Asteroid } from "./Asteroid";

export class RayBeam extends Phaser.Physics.Arcade.Sprite {
  private lifespan: number = 1000;
  private spawnTime: number = 0;
  private aimAngle: number = 0;
  private speed: number = 500;
  private startX: number = 0;
  private startY: number = 0;
  private beamGraphics: Phaser.GameObjects.Graphics;
  private previousX: number = 0;
  private previousY: number = 0;
  private asteroidGroup: Phaser.Physics.Arcade.Group | null = null;
  private onHitAsteroid?: (asteroid: Asteroid) => void;
  private hitAsteroids: Set<Asteroid> = new Set();

  constructor(scene: Phaser.Scene, x: number, y: number, aimAngle: number) {
    super(scene, x, y, "bullet"); // Reuse bullet texture for physics

    this.aimAngle = aimAngle;
    this.startX = x;
    this.startY = y;
    this.previousX = x;
    this.previousY = y;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Create graphics for drawing the beam
    this.beamGraphics = scene.add.graphics();
    this.beamGraphics.setDepth(10);
  }

  setAsteroidGroup(group: Phaser.Physics.Arcade.Group): void {
    this.asteroidGroup = group;
  }

  setOnHitAsteroid(callback: (asteroid: Asteroid) => void): void {
    this.onHitAsteroid = callback;
  }

  fire(): void {
    this.spawnTime = this.scene.time.now;
    // Travel forward in the direction the ship is facing
    this.setVelocity(
      Math.cos(this.aimAngle) * this.speed,
      Math.sin(this.aimAngle) * this.speed,
    );
    this.setRotation(this.aimAngle);
    // Make sprite invisible since we're drawing with graphics
    this.setAlpha(0);
  }

  private drawEllipticalArc(
    centerX: number,
    centerY: number,
    radiusX: number,
    radiusY: number,
    startAngle: number,
    endAngle: number,
    width: number,
    color: number,
    alpha: number,
    rotationAngle: number,
  ): void {
    this.beamGraphics.lineStyle(width, color, alpha);
    this.beamGraphics.beginPath();

    // Draw elliptical arc by calculating points
    const segments = Math.max(
      20,
      Math.floor(Math.abs(endAngle - startAngle) * 10),
    );
    for (let i = 0; i <= segments; i++) {
      const t = startAngle + (endAngle - startAngle) * (i / segments);

      // Calculate point on ellipse (before rotation)
      const x = Math.cos(t) * radiusX;
      const y = Math.sin(t) * radiusY;

      // Rotate point by rotationAngle
      const cosRot = Math.cos(rotationAngle);
      const sinRot = Math.sin(rotationAngle);
      const rotatedX = x * cosRot - y * sinRot;
      const rotatedY = x * sinRot + y * cosRot;

      // Translate to center position
      const finalX = centerX + rotatedX;
      const finalY = centerY + rotatedY;

      if (i === 0) {
        this.beamGraphics.moveTo(finalX, finalY);
      } else {
        this.beamGraphics.lineTo(finalX, finalY);
      }
    }
    this.beamGraphics.strokePath();

    // Draw rounded caps at the ends
    const capRadius = width / 2;

    // Start point (left end)
    const startXLocal = Math.cos(startAngle) * radiusX;
    const startYLocal = Math.sin(startAngle) * radiusY;
    const startX =
      centerX +
      startXLocal * Math.cos(rotationAngle) -
      startYLocal * Math.sin(rotationAngle);
    const startY =
      centerY +
      startXLocal * Math.sin(rotationAngle) +
      startYLocal * Math.cos(rotationAngle);
    this.beamGraphics.fillStyle(color, alpha);
    this.beamGraphics.fillCircle(startX, startY, capRadius);

    // End point (right end)
    const endXLocal = Math.cos(endAngle) * radiusX;
    const endYLocal = Math.sin(endAngle) * radiusY;
    const endX =
      centerX +
      endXLocal * Math.cos(rotationAngle) -
      endYLocal * Math.sin(rotationAngle);
    const endY =
      centerY +
      endXLocal * Math.sin(rotationAngle) +
      endYLocal * Math.cos(rotationAngle);
    this.beamGraphics.fillCircle(endX, endY, capRadius);
  }

  private drawBeam(): void {
    this.beamGraphics.clear();

    const elapsed = this.scene.time.now - this.spawnTime;
    const progress = Math.min(elapsed / this.lifespan, 1);

    // Calculate distance traveled forward from ship
    const dx = this.x - this.startX;
    const dy = this.y - this.startY;
    const forwardDistance = Math.sqrt(dx * dx + dy * dy);

    // Avoid drawing if too close to start
    if (forwardDistance < 0.1) {
      return;
    }

    // Calculate elliptical radii that grow with distance
    // radiusX grows slower (in travel direction)
    // radiusY grows faster (perpendicular to travel direction)
    const baseRadius = 20;
    const maxRadiusX = 100; // Forward - grows slower
    const maxRadiusY = 200; // Perpendicular - grows faster

    const radiusX = baseRadius + progress * (maxRadiusX - baseRadius);
    const radiusY = baseRadius + progress * (maxRadiusY - baseRadius);

    // Calculate width that increases with distance (skinnier)
    const baseWidth = 2;
    const maxWidth = 12;
    const width = baseWidth + progress * (maxWidth - baseWidth);

    // Center of ellipse (current sprite position - moves forward from ship)
    const centerX = this.x;
    const centerY = this.y;

    // Calculate angles for arc (1/3 of ellipse) in the direction the ship is facing
    // Arc opens forward in the ship's facing direction
    // Start angle is 60 degrees to the left of ship's facing, end angle is 60 degrees to the right
    const startAngle = -Math.PI / 3; // -60 degrees (relative to ellipse orientation)
    const endAngle = Math.PI / 3; // +60 degrees (relative to ellipse orientation)

    // Rotation angle to align ellipse with ship's facing direction
    // The ellipse's "forward" (radiusY) should align with ship's aimAngle
    const rotationAngle = this.aimAngle;

    // Calculate fade factor - starts fading after halfway point
    let fadeFactor = 1.0;
    if (progress > 0.5) {
      // Fade from 1.0 at 0.5 to 0.0 at 1.0
      fadeFactor = 2.0 * (1.0 - progress);
    }

    // Draw multiple layers for glow effect
    // Outer glow (dark green, low opacity)
    this.drawEllipticalArc(
      centerX,
      centerY,
      radiusX,
      radiusY,
      startAngle,
      endAngle,
      width + 8,
      0x00aa00,
      0.2 * fadeFactor,
      rotationAngle,
    );

    // Middle glow (bright green, medium opacity)
    this.drawEllipticalArc(
      centerX,
      centerY,
      radiusX,
      radiusY,
      startAngle,
      endAngle,
      width + 4,
      0x44ff44,
      0.4 * fadeFactor,
      rotationAngle,
    );

    // Inner glow (light green, high opacity)
    this.drawEllipticalArc(
      centerX,
      centerY,
      radiusX,
      radiusY,
      startAngle,
      endAngle,
      width,
      0x88ff88,
      0.7 * fadeFactor,
      rotationAngle,
    );

    // Core (white, full opacity)
    this.drawEllipticalArc(
      centerX,
      centerY,
      radiusX,
      radiusY,
      startAngle,
      endAngle,
      width * 0.3,
      0xffffff,
      1.0 * fadeFactor,
      rotationAngle,
    );
  }

  private checkCollisions(): void {
    if (
      !this.active ||
      !this.scene ||
      !this.asteroidGroup ||
      !this.onHitAsteroid
    )
      return;

    const elapsed = this.scene.time.now - this.spawnTime;
    const progress = Math.min(elapsed / this.lifespan, 1);

    // Calculate elliptical radii (same as in drawBeam)
    const baseRadius = 20;
    const maxRadiusX = 100; // Forward - grows slower
    const maxRadiusY = 200; // Perpendicular - grows faster

    const radiusX = baseRadius + progress * (maxRadiusX - baseRadius);
    const radiusY = baseRadius + progress * (maxRadiusY - baseRadius);

    // Center of ellipse
    const centerX = this.x;
    const centerY = this.y;

    // Angles for arc (1/3 of ellipse) (relative to ellipse orientation)
    const startAngle = -Math.PI / 3;
    const endAngle = Math.PI / 3;
    const rotationAngle = this.aimAngle;

    const asteroids = this.asteroidGroup.getChildren() as Asteroid[];
    asteroids.forEach((asteroid) => {
      if (!asteroid.active || this.hitAsteroids.has(asteroid)) return;

      const asteroidRadius = (asteroid.width * asteroid.scaleX) / 2;

      // Transform asteroid position to ellipse's local coordinate system
      const dx = asteroid.x - centerX;
      const dy = asteroid.y - centerY;

      // Rotate point to ellipse's local coordinates
      const cosRot = Math.cos(-rotationAngle);
      const sinRot = Math.sin(-rotationAngle);
      const localX = dx * cosRot - dy * sinRot;
      const localY = dx * sinRot + dy * cosRot;

      // Check if asteroid is within ellipse bounds (with margin for asteroid radius)
      const ellipseValue =
        (localX * localX) /
          ((radiusX + asteroidRadius) * (radiusX + asteroidRadius)) +
        (localY * localY) /
          ((radiusY + asteroidRadius) * (radiusY + asteroidRadius));

      if (ellipseValue <= 1) {
        // Check if asteroid is within the angle range of the semicircle
        const angleToAsteroid = Math.atan2(localY, localX);

        // Calculate angle difference from start angle
        let angleDiff = angleToAsteroid - startAngle;
        // Normalize to [-π, π]
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        // Check if angle is within the arc range (2π/3 radians = 120 degrees = 1/3 of ellipse)
        const isInRange = angleDiff >= 0 && angleDiff <= endAngle - startAngle;

        if (isInRange) {
          this.hitAsteroids.add(asteroid);
          if (this.onHitAsteroid) {
            this.onHitAsteroid(asteroid);
            // Destroy beam after detecting hit
            // The handler will destroy the asteroid
            this.destroy();
            return; // Exit early since beam is destroyed
          }
        }
      }
    });
  }

  update(): void {
    // Safety check - ensure scene exists and object is active
    if (
      !this.active ||
      !this.scene ||
      !this.scene.cameras ||
      !this.scene.cameras.main
    ) {
      return;
    }

    // Check lifespan
    if (this.scene.time.now - this.spawnTime > this.lifespan) {
      this.destroy();
      return;
    }

    // Redraw beam with updated position and width
    this.drawBeam();

    // Check for collisions with asteroids
    this.checkCollisions();

    // Safety check again - object might have been destroyed in checkCollisions
    if (
      !this.active ||
      !this.scene ||
      !this.scene.cameras ||
      !this.scene.cameras.main
    ) {
      return;
    }

    // Screen wrap
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    let wrapped = false;
    if (this.x < 0) {
      this.x = width;
      this.startX += width;
      wrapped = true;
    } else if (this.x > width) {
      this.x = 0;
      this.startX -= width;
      wrapped = true;
    }

    if (this.y < 0) {
      this.y = height;
      this.startY += height;
      wrapped = true;
    } else if (this.y > height) {
      this.y = 0;
      this.startY -= height;
      wrapped = true;
    }

    // If wrapped, redraw beam
    if (wrapped) {
      this.drawBeam();
    }
  }

  destroy(fromScene?: boolean): void {
    this.beamGraphics.destroy();
    super.destroy(fromScene);
  }
}
