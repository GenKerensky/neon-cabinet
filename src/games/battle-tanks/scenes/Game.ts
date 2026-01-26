import Phaser, { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { Camera3D } from "../engine/Camera3D";
import { Vector3D } from "../engine/Vector3D";
import { WireframeRenderer } from "../engine/WireframeRenderer";
import { PlayerTank } from "../objects/PlayerTank";
import { GroundGrid } from "../objects/GroundGrid";
import { Mountains } from "../objects/Mountains";
import { HUD } from "../objects/HUD";
import { Starfield } from "../effects/Starfield";
import { Atmosphere } from "../effects/Atmosphere";
import { ScreenShake } from "../effects/ScreenShake";
import {
  VectorParticleSystem,
  PARTICLE_PRESETS,
} from "../objects/VectorParticles";
import { Projectile } from "../objects/Projectile";
import { EnemyManager } from "../objects/EnemyManager";
import { WaveSystem } from "../objects/WaveSystem";
import { WaveTransition } from "../objects/WaveTransition";
import { TerrainManager } from "../objects/TerrainManager";
import { ObstacleInfo } from "../objects/EnemyTank";
import { PickupManager } from "../objects/PickupManager";
import { LaserBeam } from "../objects/LaserBeam";
import { LaserWeapon } from "../objects/weapons/LaserWeapon";

type GameState = "playing" | "wave_transition" | "player_death" | "game_over";

export class Game extends Scene {
  private camera3d!: Camera3D;
  private wireframeRenderer!: WireframeRenderer;
  private tank!: PlayerTank;

  private starfield!: Starfield;
  private atmosphere!: Atmosphere;
  private groundGrid!: GroundGrid;
  private mountains!: Mountains;

  private particles!: VectorParticleSystem;
  private screenShake!: ScreenShake;

  private hud!: HUD;

  // Combat systems
  private projectiles: Projectile[] = [];
  private laserBeams: LaserBeam[] = [];
  private enemyManager!: EnemyManager;
  private waveSystem!: WaveSystem;
  private waveTransition!: WaveTransition;
  private terrainManager!: TerrainManager;
  private pickupManager!: PickupManager;

  // Laser graphics (for beam rendering)
  private laserGraphics!: Phaser.GameObjects.Graphics;

  // Game state
  private gameState: GameState = "playing";
  private readonly deathDelay = 2000; // ms before game over screen
  private cheatMode = false;

  constructor() {
    super("Game");
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x000000);
    this.cameras.main.setPostPipeline("VectorShader");

    this.gameState = "playing";

    this.atmosphere = new Atmosphere();
    this.atmosphere.create(this, 0x004400);

    this.starfield = new Starfield();
    this.starfield.create(this);

    this.camera3d = new Camera3D(400);

    this.tank = new PlayerTank(this, this.camera3d);

    this.wireframeRenderer = new WireframeRenderer(this, this.camera3d);

    this.groundGrid = new GroundGrid(this, this.camera3d);
    this.mountains = new Mountains(this);

    this.particles = new VectorParticleSystem(this);
    this.particles.setCamera(this.camera3d);
    this.screenShake = new ScreenShake(this);

    this.hud = new HUD(this);
    this.hud.draw();

    // Initialize combat systems
    this.enemyManager = new EnemyManager();
    this.waveSystem = new WaveSystem(this.enemyManager);
    this.waveTransition = new WaveTransition(this);
    this.terrainManager = new TerrainManager();
    this.pickupManager = new PickupManager();

    // Laser graphics for beam rendering
    this.laserGraphics = this.add.graphics();
    this.laserGraphics.setDepth(90);

    // Start first wave with transition
    this.gameState = "wave_transition";
    this.waveTransition.startFirstWave(() => {
      this.waveSystem.startWave(this.tank.getPosition());
      this.generateTerrain();
      this.generatePickups();
      this.gameState = "playing";
    });

    this.input.keyboard
      ?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
      .on("down", () => {
        if (this.gameState === "playing" && !this.scene.isPaused("Game")) {
          this.scene.pause("Game");
          this.scene.launch("Pause");
        }
      });

    // Fire weapon on SPACE
    this.input.keyboard
      ?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
      .on("down", () => {
        if (this.gameState === "playing") {
          this.fireWeapon();
        }
      });

    // Manual reload on R
    this.input.keyboard
      ?.addKey(Phaser.Input.Keyboard.KeyCodes.R)
      .on("down", () => {
        if (this.gameState === "playing") {
          this.tank.startReload();
        }
      });

    // Weapon cycling with Q and E
    this.input.keyboard
      ?.addKey(Phaser.Input.Keyboard.KeyCodes.Q)
      .on("down", () => {
        if (this.gameState === "playing") {
          this.tank.cycleWeaponPrev();
        }
      });

    this.input.keyboard
      ?.addKey(Phaser.Input.Keyboard.KeyCodes.E)
      .on("down", () => {
        if (this.gameState === "playing") {
          this.tank.cycleWeaponNext();
        }
      });

    // Cheat mode on C key
    this.input.keyboard
      ?.addKey(Phaser.Input.Keyboard.KeyCodes.C)
      .on("down", () => {
        this.toggleCheatMode();
      });

    EventBus.emit("current-scene-ready", this);
  }

  private fireWeapon(): void {
    const fireResult = this.tank.fire();
    if (!fireResult) return;

    if (fireResult.type === "projectile") {
      // Autocannon - spawn projectile
      const projectile = new Projectile(
        fireResult.position,
        fireResult.direction,
      );
      this.projectiles.push(projectile);
    } else if (fireResult.type === "laser") {
      // Laser - do raycast hit detection
      this.fireLaser(
        fireResult.position,
        fireResult.direction,
        fireResult.maxRange,
      );
    }
  }

  /**
   * Fire laser weapon - raycast hit detection
   */
  private fireLaser(
    startPos: Vector3D,
    direction: Vector3D,
    maxRange: number,
  ): void {
    const enemies = this.enemyManager.getEnemies();

    // Calculate end position
    let endPos = new Vector3D(
      startPos.x + direction.x * maxRange,
      startPos.y + direction.y * maxRange,
      startPos.z + direction.z * maxRange,
    );

    let hitDistance = maxRange;
    let hitEnemy: (typeof enemies)[0] | null = null;

    // Check terrain first (find closest intersection)
    // Simple raycast - check collision at intervals
    const steps = 40;
    for (let i = 1; i <= steps; i++) {
      const t = (i / steps) * maxRange;
      const checkPos = new Vector3D(
        startPos.x + direction.x * t,
        startPos.y,
        startPos.z + direction.z * t,
      );

      const obstacle = this.terrainManager.checkPointCollision(checkPos, 5);
      if (obstacle) {
        hitDistance = t;
        endPos = checkPos;
        break;
      }
    }

    // Check enemies (within hit distance)
    for (const enemy of enemies) {
      if (!enemy.isAlive()) continue;

      const enemyPos = enemy.getCollisionCenter();

      // Calculate closest point on ray to enemy
      const dx = enemyPos.x - startPos.x;
      const dz = enemyPos.z - startPos.z;
      const t = Math.max(
        0,
        Math.min(hitDistance, dx * direction.x + dz * direction.z),
      );

      const closestX = startPos.x + direction.x * t;
      const closestZ = startPos.z + direction.z * t;

      const distToEnemy = Math.sqrt(
        (closestX - enemyPos.x) ** 2 + (closestZ - enemyPos.z) ** 2,
      );

      if (distToEnemy < enemy.collisionRadius && t < hitDistance) {
        hitDistance = t;
        hitEnemy = enemy;
        endPos = new Vector3D(closestX, startPos.y, closestZ);
      }
    }

    // Apply damage if hit enemy
    if (hitEnemy) {
      hitEnemy.takeDamage();
      this.particles.emit(endPos.clone(), 5, PARTICLE_PRESETS.sparks);

      if (hitEnemy.isDead()) {
        this.tank.addScore(hitEnemy.points);
        this.particles.emitRing(
          hitEnemy.position.clone(),
          15,
          PARTICLE_PRESETS.explosion,
        );
        this.particles.emit(
          hitEnemy.position.clone(),
          8,
          PARTICLE_PRESETS.debris,
        );
        this.screenShake.fire();
      }
    } else {
      // Hit terrain or max range - small spark
      this.particles.emit(endPos.clone(), 2, PARTICLE_PRESETS.sparks);
    }

    // Create visual beam
    this.laserBeams.push(new LaserBeam(startPos, endPos));
  }

  /**
   * Generate terrain obstacles for current wave
   */
  private generateTerrain(): void {
    const waveNum = this.waveSystem.getWaveNumber();
    // More obstacles in later waves, base 8 + 2 per wave, max 20
    const count = Math.min(8 + waveNum * 2, 20);
    const enemyPositions = this.enemyManager.getEnemyPositions();
    this.terrainManager.generateTerrain(
      count,
      this.tank.getPosition(),
      enemyPositions,
    );
  }

  /**
   * Generate pickups for current wave
   */
  private generatePickups(): void {
    const waveNum = this.waveSystem.getWaveNumber();
    const enemyPositions = this.enemyManager.getEnemyPositions();
    const obstaclePositions = this.terrainManager
      .getObstacles()
      .map((o) => o.position);
    const occupiedPositions = [...enemyPositions, ...obstaclePositions];

    this.pickupManager.generatePickups(
      waveNum,
      this.tank.getPosition(),
      occupiedPositions,
      this.tank.hasWeapon("laser"),
    );
  }

  /**
   * Check pickup collection
   */
  private checkPickupCollection(): void {
    const collected = this.pickupManager.checkCollection(
      this.tank.getPosition(),
      this.tank.collisionRadius,
    );

    if (collected) {
      if (collected.type === "armor") {
        // Restore armor
        if (this.tank.restoreArmor(1)) {
          // Visual feedback could go here
        }
      } else if (collected.type === "weapon" && collected.weaponType) {
        // Add weapon
        if (collected.weaponType === "laser") {
          this.tank.addWeapon(new LaserWeapon());
        }
      }
    }
  }

  /**
   * Get obstacle info for enemy AI
   */
  private getObstacleInfo(): ObstacleInfo {
    return {
      obstacles: this.terrainManager.getObstacles(),
      checkCollision: (pos, radius) =>
        this.terrainManager.checkCollision(pos, radius),
      hasLineOfSight: (from, to) =>
        this.terrainManager.hasLineOfSight(from, to),
    };
  }

  private checkPlayerProjectileCollisions(): void {
    const enemies = this.enemyManager.getEnemies();

    for (const projectile of this.projectiles) {
      if (!projectile.isAlive()) continue;

      // Check terrain collision first
      const hitObstacle = this.terrainManager.checkPointCollision(
        projectile.position,
        projectile.radius,
      );
      if (hitObstacle) {
        projectile.destroy();
        this.particles.emit(
          projectile.position.clone(),
          3,
          PARTICLE_PRESETS.sparks,
        );
        continue;
      }

      for (const enemy of enemies) {
        if (!enemy.isAlive()) continue;

        const dist = projectile.distanceTo(enemy.getCollisionCenter());
        if (dist < enemy.collisionRadius + projectile.radius) {
          enemy.takeDamage();
          projectile.destroy();

          this.particles.emit(
            enemy.position.clone(),
            5,
            PARTICLE_PRESETS.sparks,
          );

          if (enemy.isDead()) {
            this.tank.addScore(enemy.points);
            this.particles.emitRing(
              enemy.position.clone(),
              15,
              PARTICLE_PRESETS.explosion,
            );
            this.particles.emit(
              enemy.position.clone(),
              8,
              PARTICLE_PRESETS.debris,
            );
            this.screenShake.fire();
          }
          break;
        }
      }
    }
  }

  private checkEnemyProjectileCollisions(): void {
    const enemyProjectiles = this.enemyManager.getProjectiles();
    const playerPos = this.tank.getCollisionCenter();

    for (const projectile of enemyProjectiles) {
      if (!projectile.isAlive()) continue;

      // Check terrain collision first
      const hitObstacle = this.terrainManager.checkPointCollision(
        projectile.position,
        projectile.radius,
      );
      if (hitObstacle) {
        projectile.destroy();
        this.particles.emit(
          projectile.position.clone(),
          3,
          PARTICLE_PRESETS.sparks,
        );
        continue;
      }

      const dist = projectile.distanceTo(playerPos);
      if (dist < this.tank.collisionRadius + projectile.radius) {
        // Player hit!
        this.tank.takeDamageFromPosition(projectile.position);
        projectile.destroy();
        this.screenShake.hit();
        this.particles.emit(playerPos, 8, PARTICLE_PRESETS.sparks);

        // Check if armor section destroyed
        if (this.tank.isDead()) {
          this.handlePlayerDeath();
        }
        break;
      }
    }
  }

  private handlePlayerDeath(): void {
    // In cheat mode, reset armor instead of game over
    if (this.cheatMode) {
      this.tank.resetArmor();
      return;
    }

    // Game over - show cracked windshield
    this.gameState = "game_over";
    const { width, height } = this.cameras.main;
    this.hud.drawCrackedWindshield(width / 2, height / 2);
    this.screenShake.death();

    // Delay before game over screen
    this.time.delayedCall(this.deathDelay, () => {
      this.scene.start("GameOver", {
        score: this.tank.getScore(),
        wave: this.waveSystem.getWaveNumber(),
      });
    });
  }

  /**
   * Toggle cheat mode - enables armor reset on death and equips all weapons
   */
  private toggleCheatMode(): void {
    this.cheatMode = !this.cheatMode;

    if (this.cheatMode) {
      // Equip all weapons
      if (!this.tank.hasWeapon("laser")) {
        this.tank.addWeapon(new LaserWeapon());
      }
      // Reset armor to full
      this.tank.resetArmor();
    }
  }

  update(_time: number, delta: number): void {
    const { width, height } = this.cameras.main;

    // Update wave transition
    this.waveTransition.update(delta);

    // Skip game logic during transitions and death
    if (this.gameState === "game_over") {
      // Still render the scene but don't update game logic
      this.renderScene(width, height);
      return;
    }

    if (this.gameState === "wave_transition") {
      // Update visuals but not combat
      this.starfield.update(this.tank.getRotation());
      this.renderScene(width, height);
      this.updateHUD();
      return;
    }

    // Normal gameplay
    this.tank.update(delta);

    // Resolve player collisions
    this.tank.resolveCollisions(this.enemyManager.getEnemies());
    this.tank.resolveTerrainCollisions((pos, radius) =>
      this.terrainManager.checkCollision(pos, radius),
    );

    // Update player projectiles
    for (const projectile of this.projectiles) {
      projectile.update(delta);
    }
    this.projectiles = this.projectiles.filter((p) => p.isAlive());

    // Update laser beams
    for (const beam of this.laserBeams) {
      beam.update(delta);
    }
    this.laserBeams = this.laserBeams.filter((b) => b.isAlive());

    // Update pickups
    this.pickupManager.update(delta);

    // Check pickup collection
    this.checkPickupCollection();

    // Update enemies with player position and obstacle info for AI
    this.enemyManager.update(
      delta,
      this.tank.getPosition(),
      this.getObstacleInfo(),
    );

    // Check collisions
    this.checkPlayerProjectileCollisions();
    if (this.gameState === "playing") {
      this.checkEnemyProjectileCollisions();
    }

    // Update wave system
    this.waveSystem.update();
    if (this.waveSystem.isWaveComplete() && this.gameState === "playing") {
      // Wave bonus
      this.tank.addScore(this.waveSystem.getWaveNumber() * 100);

      // Start transition to next wave
      this.gameState = "wave_transition";
      this.waveTransition.startTransition(
        this.waveSystem.getWaveNumber(),
        () => {
          this.tank.resetArmor(); // Reset armor between waves
          this.waveSystem.startWave(this.tank.getPosition());
          this.generateTerrain(); // Regenerate terrain each wave
          this.generatePickups(); // Generate new pickups
          this.gameState = "playing";
        },
      );
    }

    this.particles.update(delta);

    this.renderScene(width, height);
    this.updateHUD();

    this.starfield.update(this.tank.getRotation());
  }

  private renderScene(width: number, height: number): void {
    this.wireframeRenderer.clear();

    this.groundGrid.render(width, height);
    this.mountains.render(this.camera3d, width, height);

    // Render terrain obstacles
    this.terrainManager.render(this.wireframeRenderer, width, height);

    // Render pickups
    this.pickupManager.render(this.wireframeRenderer, width, height);

    // Render enemies and their projectiles
    this.enemyManager.render(this.wireframeRenderer, width, height);

    // Render player projectiles
    for (const projectile of this.projectiles) {
      projectile.render(this.wireframeRenderer, width, height);
    }

    // Render laser beams
    this.laserGraphics.clear();
    for (const beam of this.laserBeams) {
      beam.render(this.laserGraphics, this.camera3d, width, height);
    }

    this.particles.render(width, height);
  }

  private updateHUD(): void {
    const pos = this.tank.getPosition();
    const enemyPositions = this.enemyManager.getEnemyPositions();
    const pickupsForRadar = this.pickupManager.getPickupsForRadar();
    const weaponManager = this.tank.getWeaponManager();

    // Get ammo display with label
    const ammoDisplay = weaponManager.getAmmoDisplay();
    const reloadDisplay = weaponManager.getReloadDisplay();

    this.hud.update(
      this.tank.getVelocity(),
      pos.x,
      pos.z,
      this.tank.getScore(),
      this.tank.getDamageState(),
      {
        current: ammoDisplay.current,
        max: ammoDisplay.max,
        label: ammoDisplay.label,
      },
      {
        isReloading: reloadDisplay.isActive,
        progress: reloadDisplay.progress,
        label: reloadDisplay.label,
      },
      enemyPositions,
      pos,
      this.tank.getRotation(),
      this.waveSystem.getWaveNumber(),
      pickupsForRadar,
      weaponManager.getWeaponList(),
    );
  }

  shutdown(): void {
    this.starfield?.destroy();
    this.atmosphere?.destroy();
    this.groundGrid?.destroy();
    this.mountains?.destroy();
    this.particles?.destroy();
    this.wireframeRenderer?.destroy();
    this.hud?.destroy();
    this.waveTransition?.destroy();
    this.laserGraphics?.destroy();
    this.pickupManager?.clear();
  }
}
