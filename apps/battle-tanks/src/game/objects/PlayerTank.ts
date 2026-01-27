import { Input } from "phaser";
import type { Scene, Types } from "phaser";
import { Vector3D } from "../engine/Vector3D";
import { Camera3D } from "../engine/Camera3D";
import {
  TankDamageState,
  TankSection,
  DamageLevel,
  createInitialDamageState,
} from "./TankHealth";
import { WeaponManager } from "./weapons/WeaponManager";
import { Weapon, FireResult, WeaponType } from "./weapons/Weapon";

/**
 * Player tank with first-person camera and WASD controls
 */
export class PlayerTank {
  position: Vector3D;
  rotation: number; // Y-axis facing direction (positive = right of +Z)
  private velocity: number;
  private targetVelocity: number;
  private rotationVelocity: number;

  private camera: Camera3D;
  private scene: Scene;

  // Movement settings
  private readonly maxSpeed = 150;
  private readonly maxReverseSpeed = 80;
  private readonly acceleration = 200;
  private readonly deceleration = 300;
  private readonly rotationSpeed = 1.5;
  private readonly eyeHeight = 50;

  // Damage state
  private damageState: TankDamageState;

  readonly collisionRadius = 40;

  // Weapon system
  private weaponManager: WeaponManager;

  // Score
  private score = 0;

  // Input keys
  private cursors!: Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Input.Keyboard.Key;
    A: Input.Keyboard.Key;
    S: Input.Keyboard.Key;
    D: Input.Keyboard.Key;
  };

  constructor(scene: Scene, camera: Camera3D) {
    this.scene = scene;
    this.camera = camera;
    this.position = new Vector3D(0, 0, 0);
    this.rotation = 0;
    this.velocity = 0;
    this.targetVelocity = 0;
    this.rotationVelocity = 0;

    this.damageState = createInitialDamageState();
    this.weaponManager = new WeaponManager();

    this.setupInput();
    this.updateCamera();
  }

  private setupInput(): void {
    if (!this.scene.input.keyboard) return;

    this.cursors = this.scene.input.keyboard.createCursorKeys();
    this.wasd = {
      W: this.scene.input.keyboard.addKey(Input.Keyboard.KeyCodes.W),
      A: this.scene.input.keyboard.addKey(Input.Keyboard.KeyCodes.A),
      S: this.scene.input.keyboard.addKey(Input.Keyboard.KeyCodes.S),
      D: this.scene.input.keyboard.addKey(Input.Keyboard.KeyCodes.D),
    };
  }

  update(delta: number): void {
    const dt = delta / 1000;

    this.handleInput();
    this.applyMovement(dt);
    this.updateCamera();
    this.weaponManager.updateAll(delta);
  }

  private handleInput(): void {
    this.targetVelocity = 0;
    this.rotationVelocity = 0;

    // Forward/backward
    if (this.cursors?.up?.isDown || this.wasd?.W?.isDown) {
      this.targetVelocity = this.maxSpeed;
    } else if (this.cursors?.down?.isDown || this.wasd?.S?.isDown) {
      this.targetVelocity = -this.maxReverseSpeed;
    }

    // Rotation: Left = turn left (negative), Right = turn right (positive)
    if (this.cursors?.left?.isDown || this.wasd?.A?.isDown) {
      this.rotationVelocity = -this.rotationSpeed;
    } else if (this.cursors?.right?.isDown || this.wasd?.D?.isDown) {
      this.rotationVelocity = this.rotationSpeed;
    }
  }

  private applyMovement(dt: number): void {
    // Smooth acceleration/deceleration
    if (this.targetVelocity !== 0) {
      if (this.velocity < this.targetVelocity) {
        this.velocity = Math.min(
          this.targetVelocity,
          this.velocity + this.acceleration * dt,
        );
      } else if (this.velocity > this.targetVelocity) {
        this.velocity = Math.max(
          this.targetVelocity,
          this.velocity - this.acceleration * dt,
        );
      }
    } else {
      if (this.velocity > 0) {
        this.velocity = Math.max(0, this.velocity - this.deceleration * dt);
      } else if (this.velocity < 0) {
        this.velocity = Math.min(0, this.velocity + this.deceleration * dt);
      }
    }

    // Apply rotation
    this.rotation += this.rotationVelocity * dt;

    // Normalize rotation to 0-2π
    while (this.rotation < 0) this.rotation += Math.PI * 2;
    while (this.rotation >= Math.PI * 2) this.rotation -= Math.PI * 2;

    // Apply movement in facing direction
    // Forward is +Z at rotation=0, rotates clockwise with positive rotation
    if (this.velocity !== 0) {
      const moveX = Math.sin(this.rotation) * this.velocity * dt;
      const moveZ = Math.cos(this.rotation) * this.velocity * dt;

      this.position.x += moveX;
      this.position.z += moveZ;
    }
  }

  private updateCamera(): void {
    this.camera.position.x = this.position.x;
    this.camera.position.y = this.eyeHeight;
    this.camera.position.z = this.position.z;
    this.camera.rotation = this.rotation;
  }

  getCamera(): Camera3D {
    return this.camera;
  }

  getPosition(): Vector3D {
    return this.position.clone();
  }

  getRotation(): number {
    return this.rotation;
  }

  getVelocity(): number {
    return this.velocity;
  }

  setPosition(x: number, z: number): void {
    this.position.x = x;
    this.position.z = z;
    this.velocity = 0;
    this.updateCamera();
  }

  setRotation(rotation: number): void {
    this.rotation = rotation;
    this.updateCamera();
  }

  // Damage methods
  takeDamage(section: TankSection): boolean {
    const current = this.damageState[section];
    if (current < DamageLevel.DESTROYED) {
      this.damageState[section] = current + 1;
    }
    return this.damageState[section] >= DamageLevel.DESTROYED;
  }

  /**
   * Take damage from a world position (determines which section is hit)
   */
  takeDamageFromPosition(projectilePos: Vector3D): TankSection {
    // Calculate angle from player to projectile
    const dx = projectilePos.x - this.position.x;
    const dz = projectilePos.z - this.position.z;
    const worldAngle = Math.atan2(dx, dz);

    // Convert to relative angle (0 = in front of player)
    let relativeAngle = worldAngle - this.rotation;

    // Normalize to -PI to PI
    while (relativeAngle > Math.PI) relativeAngle -= Math.PI * 2;
    while (relativeAngle < -Math.PI) relativeAngle += Math.PI * 2;

    // Determine section based on relative angle
    let section: TankSection;
    if (relativeAngle >= -Math.PI / 4 && relativeAngle < Math.PI / 4) {
      section = "front";
    } else if (
      relativeAngle >= Math.PI / 4 &&
      relativeAngle < (3 * Math.PI) / 4
    ) {
      section = "right";
    } else if (
      relativeAngle >= (-3 * Math.PI) / 4 &&
      relativeAngle < -Math.PI / 4
    ) {
      section = "left";
    } else {
      section = "rear";
    }

    this.takeDamage(section);
    return section;
  }

  getDamageState(): TankDamageState {
    return { ...this.damageState };
  }

  isDead(): boolean {
    return (
      this.damageState.front >= DamageLevel.DESTROYED ||
      this.damageState.rear >= DamageLevel.DESTROYED ||
      this.damageState.left >= DamageLevel.DESTROYED ||
      this.damageState.right >= DamageLevel.DESTROYED
    );
  }

  /**
   * Reset armor for new wave
   */
  resetArmor(): void {
    this.damageState = createInitialDamageState();
  }

  /**
   * Full reset for new game
   */
  reset(): void {
    this.score = 0;
    this.position = new Vector3D(0, 0, 0);
    this.rotation = 0;
    this.damageState = createInitialDamageState();
    this.weaponManager.resetAll();
    this.velocity = 0;
    this.targetVelocity = 0;
    this.updateCamera();
  }

  /**
   * Get collision center position
   */
  getCollisionCenter(): Vector3D {
    return new Vector3D(this.position.x, this.eyeHeight, this.position.z);
  }

  /**
   * Resolve collisions with enemies - push player out if overlapping
   */
  resolveCollisions(
    enemies: Array<{
      position: Vector3D;
      collisionRadius: number;
      isAlive(): boolean;
    }>,
  ): void {
    for (const enemy of enemies) {
      if (!enemy.isAlive()) continue;

      const dx = this.position.x - enemy.position.x;
      const dz = this.position.z - enemy.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      const minDist = this.collisionRadius + enemy.collisionRadius;

      if (dist < minDist && dist > 0) {
        // Push player out
        const overlap = minDist - dist;
        const nx = dx / dist;
        const nz = dz / dist;

        this.position.x += nx * overlap;
        this.position.z += nz * overlap;

        // Stop forward velocity if pushing into enemy
        if (this.velocity > 0) {
          // Check if moving toward enemy
          const moveAngle = this.rotation;
          const toEnemyAngle = Math.atan2(-dx, -dz);
          let angleDiff = moveAngle - toEnemyAngle;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

          if (Math.abs(angleDiff) < Math.PI / 2) {
            this.velocity *= 0.5; // Reduce velocity on collision
          }
        }

        // Update camera position
        this.updateCamera();
      }
    }
  }

  /**
   * Resolve collisions with terrain obstacles
   */
  resolveTerrainCollisions(
    checkCollision: (
      pos: Vector3D,
      radius: number,
    ) => { collides: boolean; pushX: number; pushZ: number },
  ): void {
    const collision = checkCollision(this.position, this.collisionRadius);
    if (collision.collides) {
      this.position.x += collision.pushX;
      this.position.z += collision.pushZ;

      // Reduce velocity when hitting obstacle
      if (this.velocity > 0) {
        this.velocity *= 0.5;
      }

      // Update camera position
      this.updateCamera();
    }
  }

  // Ammo methods (delegates to weapon manager)
  getAmmo(): { current: number; max: number } {
    const display = this.weaponManager.getAmmoDisplay();
    return { current: display.current, max: display.max };
  }

  // Reload methods
  startReload(): void {
    this.weaponManager.startReload();
  }

  getReloadState(): { isReloading: boolean; progress: number } {
    const display = this.weaponManager.getReloadDisplay();
    return { isReloading: display.isActive, progress: display.progress };
  }

  // Score methods
  getScore(): number {
    return this.score;
  }

  addScore(points: number): void {
    this.score += points;
  }

  // Weapon methods
  cycleWeaponNext(): void {
    this.weaponManager.cycleNext();
  }

  cycleWeaponPrev(): void {
    this.weaponManager.cyclePrev();
  }

  addWeapon(weapon: Weapon): void {
    this.weaponManager.addWeapon(weapon);
  }

  hasWeapon(type: WeaponType): boolean {
    return this.weaponManager.hasWeapon(type);
  }

  getWeaponManager(): WeaponManager {
    return this.weaponManager;
  }

  getCurrentWeaponType(): WeaponType {
    return this.weaponManager.getCurrentWeaponType();
  }

  /**
   * Get forward direction vector
   */
  getForwardDirection(): Vector3D {
    return new Vector3D(Math.sin(this.rotation), 0, Math.cos(this.rotation));
  }

  /**
   * Fire method - returns fire result or null if can't fire
   */
  fire(): FireResult | null {
    // Spawn projectile at cannon position (slightly in front and above tank)
    const spawnOffset = 30; // Distance in front of tank
    const spawnHeight = this.eyeHeight; // Same as camera height

    const spawnPos = new Vector3D(
      this.position.x + Math.sin(this.rotation) * spawnOffset,
      spawnHeight,
      this.position.z + Math.cos(this.rotation) * spawnOffset,
    );

    // Direction is forward based on rotation
    const direction = new Vector3D(
      Math.sin(this.rotation),
      0,
      Math.cos(this.rotation),
    );

    return this.weaponManager.fire(spawnPos, direction);
  }

  /**
   * Restore armor by amount (for pickups)
   */
  restoreArmor(amount: number = 1): boolean {
    let restored = false;
    for (const section of ["front", "rear", "left", "right"] as TankSection[]) {
      if (this.damageState[section] > 0) {
        this.damageState[section] = Math.max(
          0,
          this.damageState[section] - amount,
        );
        restored = true;
      }
    }
    return restored;
  }
}
