import { Display, Input, Math as PhaserMath, Physics, Scene } from "phaser";
import type { GameObjects, Tilemaps, Types } from "phaser";
import { Ship } from "../objects/Ship";
import { Asteroid } from "../objects/Asteroid";
import { Bullet } from "../objects/Bullet";
import { Missile } from "../objects/Missile";
import { WeaponManager } from "../objects/WeaponManager";
import { EventBus } from "../EventBus";
import { getFontFamily } from "../utils/font";

export class Game extends Scene {
  private ship!: Ship;
  private asteroids!: Physics.Arcade.Group;
  private bullets!: Physics.Arcade.Group;
  private particles!: GameObjects.Particles.ParticleEmitter;
  private missileExplosionParticles!: GameObjects.Particles.ParticleEmitter;
  private weaponManager!: WeaponManager;

  private score: number = 0;
  private lives: number = 3;
  private wave: number = 1;

  private scoreText!: GameObjects.Text;
  private livesContainer!: GameObjects.Container;
  private livesSprites: GameObjects.Image[] = [];
  private infinityText!: GameObjects.Text;
  private waveText!: GameObjects.Text;
  private weaponNameText!: GameObjects.Text;
  private weaponIcon!: GameObjects.Image;
  private cooldownCircle!: GameObjects.Graphics;
  private reloadText!: GameObjects.Text;

  private canShoot: boolean = true;
  private cooldownStartTime: number = 0;
  private cooldownDuration: number = 0;
  private cheatMode: boolean = false;

  constructor() {
    super("Game");
  }

  create(): void {
    // Reset state
    this.score = 0;
    this.lives = 3;
    this.wave = 1;
    this.canShoot = true;
    this.cheatMode = false;

    // Set background
    this.cameras.main.setBackgroundColor(0x000000);

    // Apply CRT shader effect
    // Color mode will be set automatically in onPreRender from registry
    this.cameras.main.setPostPipeline("VectorShader");

    // Generate starry background
    this.createStarField();

    // Create groups
    this.asteroids = this.physics.add.group({
      runChildUpdate: true,
    });

    this.bullets = this.physics.add.group({
      runChildUpdate: true,
    });

    // Create ship
    this.ship = new Ship(
      this,
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
    );
    this.ship.makeInvulnerable(3000);

    // Create particle emitter for explosions
    this.particles = this.add.particles(0, 0, "particle", {
      speed: { min: 50, max: 200 },
      lifespan: 500,
      scale: { start: 1, end: 0 },
      emitting: false,
    });

    // Create dedicated particle emitter for missile explosions (fire-like)
    this.missileExplosionParticles = this.add.particles(0, 0, "particle", {
      speed: { min: 100, max: 300 },
      lifespan: { min: 400, max: 700 },
      scale: { start: 1.5, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [
        0xffff00, // Yellow
        0xffaa00, // Orange-yellow
        0xff6600, // Orange
        0xff3300, // Red-orange
        0xff0000, // Red
      ],
      blendMode: "ADD",
      emitting: false,
    });

    // Setup collisions
    this.physics.add.overlap(
      this.bullets,
      this.asteroids,
      this.bulletHitAsteroid,
      undefined,
      this,
    );

    this.physics.add.overlap(
      this.ship,
      this.asteroids,
      this.shipHitAsteroid,
      undefined,
      this,
    );

    // Asteroid-asteroid collisions (bounce off each other)
    this.physics.add.collider(this.asteroids, this.asteroids);

    // Setup weapon manager
    this.weaponManager = new WeaponManager(this, this.bullets, this.asteroids);
    this.weaponManager.setOnWeaponUnlock((weapon) => {
      this.showWeaponUnlock(weapon.name);
    });
    this.weaponManager.setOnWeaponChange(() => {
      this.updateWeaponHUD();
    });
    this.weaponManager.setOnMissileAutoDetonate((missile) => {
      this.handleMissileAutoDetonate(missile);
    });

    // Missile-asteroid collisions
    this.physics.add.overlap(
      this.weaponManager.getMissileGroup(),
      this.asteroids,
      this.missileHitAsteroid,
      undefined,
      this,
    );

    // Setup input
    this.input.on("pointerdown", this.shoot, this);

    // Weapon switch with Q key
    this.input.keyboard?.addKey("Q").on("down", () => {
      this.weaponManager.cycleWeapon();
    });

    // Cheat mode toggle with C key
    this.input.keyboard?.addKey("C").on("down", () => {
      this.toggleCheatMode();
    });

    // Pause with ESC key - only handle pause, resume is handled by Pause scene
    const escKey = this.input.keyboard?.addKey(Input.Keyboard.KeyCodes.ESC);
    escKey?.on("down", () => {
      // Only pause if not already paused (Pause scene handles resume)
      if (!this.scene.isPaused("Game")) {
        // Remove shader before pausing to prevent double-shader effect
        // this.cameras.main.removePostPipeline("VectorShader");
        this.scene.pause("Game");
        this.scene.launch("Pause");
      }
    });

    // Listen for resume event to re-enable shader
    this.events.on("resume", () => {
      // this.cameras.main.setPostPipeline("VectorShader");
    });

    // Create HUD
    this.createHUD();

    // Spawn initial wave
    this.spawnWave();

    // Emit event for React bridge
    EventBus.emit("current-scene-ready", this);
  }

  private createHUD(): void {
    const font = getFontFamily(this);
    const margin = 30; // Move away from corners to avoid vignette
    const textStyle: Types.GameObjects.Text.TextStyle = {
      fontFamily: font,
      fontSize: "22px",
      color: "#ffffff",
    };

    // Score at top center
    this.scoreText = this.add.text(
      this.cameras.main.width / 2,
      margin,
      `SCORE: ${this.score}`,
      textStyle,
    );
    this.scoreText.setOrigin(0.5, 0);
    this.scoreText.setScrollFactor(0);

    // Lives as ship sprites (top left)
    this.livesContainer = this.add.container(margin, margin + 5);
    this.livesContainer.setScrollFactor(0);

    // Infinity symbol for cheat mode
    this.infinityText = this.add.text(margin, margin + 5, "∞", {
      fontFamily: font,
      fontSize: "32px",
      color: "#ffffff",
    });
    this.infinityText.setOrigin(0, 0.5);
    this.infinityText.setScrollFactor(0);
    this.infinityText.setVisible(false);

    this.updateLivesDisplay();

    // Wave text (top right)
    this.waveText = this.add.text(
      this.cameras.main.width - margin,
      margin,
      `WAVE: ${this.wave}`,
      textStyle,
    );
    this.waveText.setOrigin(1, 0);
    this.waveText.setScrollFactor(0);

    const controlsStyle: Types.GameObjects.Text.TextStyle = {
      fontFamily: font,
      fontSize: "14px",
      color: "#888888",
      lineSpacing: 2,
    };
    const controlsText = this.add.text(
      margin,
      this.cameras.main.height - margin,
      "WASD - Move\nMOUSE - Aim\nCLICK - Fire\nQ - Switch Weapon",
      controlsStyle,
    );
    controlsText.setOrigin(0, 1);
    controlsText.setScrollFactor(0);

    // Weapon HUD (bottom right) - horizontal row with sprite and text
    const weapon = this.weaponManager.getCurrentWeapon();
    const weaponY = this.cameras.main.height - margin;

    // Weapon icon sprite
    this.weaponIcon = this.add.image(
      this.cameras.main.width - margin,
      weaponY,
      weapon.textureKey,
    );
    this.weaponIcon.setScrollFactor(0);
    this.weaponIcon.setScale(1);
    this.weaponIcon.setOrigin(1, 0.5); // Right-aligned, vertically centered

    // Weapon name text
    this.weaponNameText = this.add.text(
      this.cameras.main.width - margin - 40, // Position to the left of icon
      weaponY,
      weapon.name,
      {
        fontFamily: font,
        fontSize: "16px",
        color: "#ffffff",
      },
    );
    this.weaponNameText.setOrigin(1, 0.5); // Right-aligned, vertically centered
    this.weaponNameText.setScrollFactor(0);

    // Cooldown circle indicator
    this.cooldownCircle = this.add.graphics();
    this.cooldownCircle.setScrollFactor(0);
    this.cooldownCircle.setDepth(100);

    // Reload text
    this.reloadText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height - 80,
      "RELOADING",
      {
        fontFamily: font,
        fontSize: "14px",
        color: "#ffffff",
      },
    );
    this.reloadText.setOrigin(0.5);
    this.reloadText.setScrollFactor(0);
    this.reloadText.setDepth(101);
    this.reloadText.setVisible(false);
  }

  private updateLivesDisplay(): void {
    if (this.cheatMode) {
      // Show infinity symbol in cheat mode
      this.infinityText.setVisible(true);
      // Hide ship sprites
      this.livesSprites.forEach((sprite) => sprite.destroy());
      this.livesSprites = [];
    } else {
      // Hide infinity symbol
      this.infinityText.setVisible(false);
      // Clear existing sprites
      this.livesSprites.forEach((sprite) => sprite.destroy());
      this.livesSprites = [];

      // Create ship sprites for each life
      const shipSpacing = 35;
      for (let i = 0; i < this.lives; i++) {
        const shipSprite = this.add.image(i * shipSpacing, 0, "ship");
        shipSprite.setScrollFactor(0);
        shipSprite.setScale(0.8);
        this.livesContainer.add(shipSprite);
        this.livesSprites.push(shipSprite);
      }
    }
  }

  private updateWeaponHUD(): void {
    const weapon = this.weaponManager.getCurrentWeapon();
    this.weaponNameText.setText(weapon.name);
    this.weaponIcon.setTexture(weapon.textureKey);
  }

  private showWeaponUnlock(weaponName: string): void {
    const font = getFontFamily(this);
    const unlockText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 32,
      `${weaponName} UNLOCKED!\nPress Q to switch`,
      {
        fontFamily: font,
        fontSize: "22px",
        color: "#ffffff",
        align: "center",
      },
    );
    unlockText.setOrigin(0.5);

    this.tweens.add({
      targets: unlockText,
      alpha: 0,
      y: unlockText.y - 32,
      duration: 3000,
      onComplete: () => {
        unlockText.destroy();
      },
    });
  }

  private createStarField(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const stars = this.add.graphics();

    // Layer 1: Distant dim stars (small, many)
    for (let i = 0; i < 150; i++) {
      const x = PhaserMath.Between(0, width);
      const y = PhaserMath.Between(0, height);
      const brightness = PhaserMath.Between(40, 80);
      const color = Display.Color.GetColor(brightness, brightness, brightness);
      stars.fillStyle(color, 0.6);
      stars.fillCircle(x, y, 0.5);
    }

    // Layer 2: Medium stars
    for (let i = 0; i < 80; i++) {
      const x = PhaserMath.Between(0, width);
      const y = PhaserMath.Between(0, height);
      const brightness = PhaserMath.Between(100, 160);
      const color = Display.Color.GetColor(brightness, brightness, brightness);
      stars.fillStyle(color, 0.8);
      stars.fillCircle(x, y, 1);
    }

    // Layer 3: Bright stars (larger, fewer)
    for (let i = 0; i < 30; i++) {
      const x = PhaserMath.Between(0, width);
      const y = PhaserMath.Between(0, height);
      const brightness = PhaserMath.Between(180, 255);
      // Slight color variation (blue/white/yellow tints)
      const tint = PhaserMath.Between(0, 2);
      const r = tint === 1 ? Math.min(255, brightness + 20) : brightness;
      const g = brightness;
      const b = tint === 0 ? Math.min(255, brightness + 30) : brightness;
      const color = Display.Color.GetColor(r, g, b);
      stars.fillStyle(color, 1);
      stars.fillCircle(x, y, PhaserMath.FloatBetween(1, 2));
    }

    // Layer 4: Rare extra bright stars with glow
    for (let i = 0; i < 8; i++) {
      const x = PhaserMath.Between(0, width);
      const y = PhaserMath.Between(0, height);
      // Glow
      stars.fillStyle(0xffffff, 0.1);
      stars.fillCircle(x, y, 4);
      stars.fillStyle(0xffffff, 0.3);
      stars.fillCircle(x, y, 2);
      // Core
      stars.fillStyle(0xffffff, 1);
      stars.fillCircle(x, y, 1);
    }

    // Send to back
    stars.setDepth(-1);
  }

  private updateHUD(): void {
    this.scoreText.setText(`SCORE: ${this.score}`);
    if (!this.cheatMode) {
      this.updateLivesDisplay();
    }
    this.waveText.setText(`WAVE: ${this.wave}`);
  }

  private toggleCheatMode(): void {
    this.cheatMode = !this.cheatMode;
    this.updateLivesDisplay();

    if (this.cheatMode) {
      // Unlock all weapons
      this.weaponManager.unlockAll();
    }

    this.updateHUD();
    this.updateWeaponHUD();
  }

  private shoot(): void {
    if (!this.canShoot || !this.ship.active) return;

    const pointer = this.input.activePointer;
    this.weaponManager.fire(
      this.ship,
      pointer.worldX,
      pointer.worldY,
      (asteroid, x, y) => {
        this.handleLaserHit(asteroid, x, y);
      },
    );

    this.canShoot = false;
    this.cooldownStartTime = this.time.now;
    this.cooldownDuration = this.weaponManager.getCooldown();

    this.time.delayedCall(this.cooldownDuration, () => {
      this.canShoot = true;
    });
  }

  private handleLaserHit(asteroid: Asteroid, x: number, y: number): void {
    if (!asteroid.active) return;

    // Explosion particles
    this.particles.explode(10, x, y);

    // Add score
    this.score += asteroid.points;
    this.updateHUD();
    this.weaponManager.checkUnlocks(this.score);

    // Split asteroid
    const aimAngle = this.ship.getAimAngle();
    const children = asteroid.split(aimAngle);
    children.forEach((child) => {
      this.asteroids.add(child);
      child.launch();
    });

    // Destroy asteroid
    asteroid.destroy();

    // Check for wave complete
    this.time.delayedCall(100, () => {
      if (this.asteroids.countActive() === 0) {
        this.nextWave();
      }
    });
  }

  private missileHitAsteroid(
    missile:
      | Physics.Arcade.Body
      | Physics.Arcade.StaticBody
      | Types.Physics.Arcade.GameObjectWithBody
      | Tilemaps.Tile,
    _asteroid:
      | Physics.Arcade.Body
      | Physics.Arcade.StaticBody
      | Types.Physics.Arcade.GameObjectWithBody
      | Tilemaps.Tile,
  ): void {
    const m = missile as unknown as Missile;

    // Trigger explosion
    const explosion = m.explode();
    if (!explosion) return;

    this.createMissileExplosion(explosion.x, explosion.y, explosion.radius);

    // Damage all asteroids in blast radius
    const asteroids = this.asteroids.getChildren() as Asteroid[];
    const asteroidsToDestroy: Asteroid[] = [];

    asteroids.forEach((asteroid) => {
      if (!asteroid.active) return;

      const dist = PhaserMath.Distance.Between(
        explosion.x,
        explosion.y,
        asteroid.x,
        asteroid.y,
      );
      const asteroidRadius = (asteroid.width * asteroid.scaleX) / 2;

      if (dist <= explosion.radius + asteroidRadius) {
        asteroidsToDestroy.push(asteroid);
      }
    });

    // Process all hit asteroids
    asteroidsToDestroy.forEach((asteroid) => {
      // Add score
      this.score += asteroid.points;

      // Explosion particles for each asteroid
      this.particles.explode(10, asteroid.x, asteroid.y);

      // Split asteroid (random angle since it's an explosion)
      const randomAngle = PhaserMath.FloatBetween(0, Math.PI * 2);
      const children = asteroid.split(randomAngle);
      children.forEach((child) => {
        this.asteroids.add(child);
        child.launch();
      });

      asteroid.destroy();
    });

    this.updateHUD();
    this.weaponManager.checkUnlocks(this.score);

    // Check for wave complete
    this.time.delayedCall(100, () => {
      if (this.asteroids.countActive() === 0) {
        this.nextWave();
      }
    });
  }

  private handleMissileAutoDetonate(missile: Missile): void {
    const explosion = missile.explode();
    if (!explosion) return;

    this.createMissileExplosion(explosion.x, explosion.y, explosion.radius);

    const asteroids = this.asteroids.getChildren() as Asteroid[];
    const asteroidsToDestroy: Asteroid[] = [];

    asteroids.forEach((asteroid) => {
      if (!asteroid.active) return;

      const dist = PhaserMath.Distance.Between(
        explosion.x,
        explosion.y,
        asteroid.x,
        asteroid.y,
      );
      const asteroidRadius = (asteroid.width * asteroid.scaleX) / 2;

      if (dist <= explosion.radius + asteroidRadius) {
        asteroidsToDestroy.push(asteroid);
      }
    });

    // Process all hit asteroids
    asteroidsToDestroy.forEach((asteroid) => {
      this.score += asteroid.points;
      this.particles.explode(10, asteroid.x, asteroid.y);

      const randomAngle = PhaserMath.FloatBetween(0, Math.PI * 2);
      const children = asteroid.split(randomAngle);
      children.forEach((child) => {
        this.asteroids.add(child);
        child.launch();
      });

      asteroid.destroy();
    });

    if (asteroidsToDestroy.length > 0) {
      this.updateHUD();
      this.weaponManager.checkUnlocks(this.score);

      this.time.delayedCall(100, () => {
        if (this.asteroids.countActive() === 0) {
          this.nextWave();
        }
      });
    }
  }

  private spawnWave(): void {
    const asteroidCount = 3 + this.wave;
    const margin = 50;
    const safeRadius = 200;

    for (let i = 0; i < asteroidCount; i++) {
      let x: number, y: number;
      let attempts = 0;

      // Spawn away from ship's current position
      do {
        x = PhaserMath.Between(margin, this.cameras.main.width - margin);
        y = PhaserMath.Between(margin, this.cameras.main.height - margin);
        attempts++;
      } while (
        PhaserMath.Distance.Between(x, y, this.ship.x, this.ship.y) <
          safeRadius &&
        attempts < 50
      );

      const asteroid = new Asteroid(this, x, y, "large");
      this.asteroids.add(asteroid);
      asteroid.launch();
    }
  }

  private bulletHitAsteroid(
    bullet:
      | Physics.Arcade.Body
      | Physics.Arcade.StaticBody
      | Types.Physics.Arcade.GameObjectWithBody
      | Tilemaps.Tile,
    asteroid:
      | Physics.Arcade.Body
      | Physics.Arcade.StaticBody
      | Types.Physics.Arcade.GameObjectWithBody
      | Tilemaps.Tile,
  ): void {
    const b = bullet as unknown as Bullet;
    const a = asteroid as unknown as Asteroid;

    // Calculate impact angle from bullet velocity
    const impactAngle = Math.atan2(
      b.body?.velocity.y ?? 0,
      b.body?.velocity.x ?? 0,
    );

    // Explosion particles
    this.particles.explode(10, a.x, a.y);

    // Add score
    this.score += a.points;
    this.updateHUD();
    this.weaponManager.checkUnlocks(this.score);

    // Split asteroid with impact direction
    const children = a.split(impactAngle);
    children.forEach((child) => {
      this.asteroids.add(child);
      child.launch();
    });

    // Destroy both
    b.destroy();
    a.destroy();

    // Check for wave complete
    this.time.delayedCall(100, () => {
      if (this.asteroids.countActive() === 0) {
        this.nextWave();
      }
    });
  }

  private shipHitAsteroid(
    ship:
      | Physics.Arcade.Body
      | Physics.Arcade.StaticBody
      | Types.Physics.Arcade.GameObjectWithBody
      | Tilemaps.Tile,
    _asteroid:
      | Physics.Arcade.Body
      | Physics.Arcade.StaticBody
      | Types.Physics.Arcade.GameObjectWithBody
      | Tilemaps.Tile,
  ): void {
    const s = ship as unknown as Ship;

    // Prevent multiple hits - check both invulnerability and active state
    if (s.getIsInvulnerable() || !s.active) return;

    // Immediately deactivate to prevent multiple collision triggers
    s.setActive(false);
    s.setVisible(false);
    s.stopThrust();

    // Explode any active missiles
    this.explodeAllMissiles();

    // Explosion
    this.particles.explode(20, s.x, s.y);

    if (!this.cheatMode) {
      this.lives--;
    }
    this.updateHUD();

    if (this.lives <= 0 && !this.cheatMode) {
      this.time.delayedCall(1500, () => {
        this.scene.start("GameOver", { score: this.score });
      });
    } else {
      this.time.delayedCall(1000, () => {
        s.respawn(this.cameras.main.width / 2, this.cameras.main.height / 2);
      });
    }
  }

  private explodeAllMissiles(): void {
    const missiles = this.weaponManager
      .getMissileGroup()
      .getChildren() as Missile[];

    missiles.forEach((missile) => {
      if (!missile.active) return;

      const explosion = missile.explode();
      if (explosion) {
        // Visual explosion only, no damage to asteroids
        this.createMissileExplosion(explosion.x, explosion.y, explosion.radius);
      }
    });
  }

  private nextWave(): void {
    this.wave++;
    this.updateHUD();

    const font = getFontFamily(this);
    const waveAnnounce = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 3,
      `WAVE ${this.wave}`,
      {
        fontFamily: font,
        fontSize: "50px",
        color: "#ffffff",
      },
    );
    waveAnnounce.setOrigin(0.5);

    this.tweens.add({
      targets: waveAnnounce,
      alpha: 0,
      duration: 2000,
      onComplete: () => {
        waveAnnounce.destroy();
      },
    });

    // Spawn next wave after delay
    this.time.delayedCall(1500, () => {
      this.spawnWave();
    });
  }

  private createMissileExplosion(x: number, y: number, radius: number): void {
    // Fire-like particle explosion
    this.missileExplosionParticles.setPosition(x, y);
    this.missileExplosionParticles.explode(50, x, y);

    // Create animated explosion radius circle
    const explosionGraphics = this.add.graphics();
    explosionGraphics.setDepth(5);

    // Animate from 0 to maximum radius
    const startRadius = 0;
    const endRadius = radius;

    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 150, // Short animation
      ease: "Power2",
      onUpdate: (tween) => {
        const progress = tween.getValue() ?? 0;
        const currentRadius =
          startRadius + (endRadius - startRadius) * progress;

        explosionGraphics.clear();

        // Outer glow (orange-red gradient)
        explosionGraphics.fillStyle(0xff3300, 0.2 * (1 - progress));
        explosionGraphics.fillCircle(x, y, currentRadius);

        // Middle glow (orange)
        explosionGraphics.fillStyle(0xff6600, 0.4 * (1 - progress));
        explosionGraphics.fillCircle(x, y, currentRadius * 0.7);

        // Inner glow (yellow-orange)
        explosionGraphics.fillStyle(0xffaa00, 0.6 * (1 - progress));
        explosionGraphics.fillCircle(x, y, currentRadius * 0.4);

        // Outer ring (orange-red)
        explosionGraphics.lineStyle(3, 0xff3300, 0.8 * (1 - progress));
        explosionGraphics.strokeCircle(x, y, currentRadius);

        // Middle ring (orange)
        explosionGraphics.lineStyle(2, 0xff6600, 1.0 * (1 - progress));
        explosionGraphics.strokeCircle(x, y, currentRadius * 0.7);

        // Inner ring (yellow)
        explosionGraphics.lineStyle(1, 0xffff00, 1.0 * (1 - progress));
        explosionGraphics.strokeCircle(x, y, currentRadius * 0.4);
      },
      onComplete: () => {
        explosionGraphics.destroy();
      },
    });
  }

  update(): void {
    if (this.ship.active) {
      this.ship.update();
    }

    this.updateCooldownCircle();
  }

  private updateCooldownCircle(): void {
    this.cooldownCircle.clear();

    if (this.canShoot) {
      this.reloadText.setVisible(false);
      return;
    }

    // Show reload text
    this.reloadText.setVisible(true);

    const elapsed = this.time.now - this.cooldownStartTime;
    const progress = Math.min(elapsed / this.cooldownDuration, 1);

    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height - 80;
    const radius = 35; // Increased from 20

    // Get current weapon color
    const weapon = this.weaponManager.getCurrentWeapon();
    let weaponColor = 0xffffff; // Default white
    if (weapon.name === "AUTOCANNON") {
      weaponColor = 0xffd700; // Gold
    } else if (weapon.name === "LASER") {
      weaponColor = 0xff0000; // Red
    } else if (weapon.name === "MISSILE") {
      weaponColor = 0xff6600; // Orange
    } else if (weapon.name === "RAY GUN") {
      weaponColor = 0x00ff00; // Green
    }

    // Background circle (dark)
    this.cooldownCircle.lineStyle(4, 0x333333, 0.8);
    this.cooldownCircle.strokeCircle(centerX, centerY, radius);

    // Progress arc with gradient (transparent to weapon color)
    // Draw arc from top (-90 degrees) clockwise
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + progress * Math.PI * 2;

    // Draw arc as segments with gradient opacity
    const segments = Math.max(20, Math.floor(progress * 40));
    for (let i = 0; i < segments; i++) {
      const segmentProgress = i / segments;
      const nextSegmentProgress = (i + 1) / segments;

      // Calculate opacity gradient: transparent at start, full at end
      const alpha = segmentProgress;
      const nextAlpha = nextSegmentProgress;

      // Only draw if alpha is positive
      if (alpha > 0 || nextAlpha > 0) {
        const segmentStartAngle =
          startAngle + segmentProgress * (endAngle - startAngle);
        const segmentEndAngle =
          startAngle + nextSegmentProgress * (endAngle - startAngle);

        // Use average alpha for this segment
        const segmentAlpha = (alpha + nextAlpha) / 2;

        this.cooldownCircle.lineStyle(4, weaponColor, segmentAlpha);
        this.cooldownCircle.beginPath();
        this.cooldownCircle.arc(
          centerX,
          centerY,
          radius,
          segmentStartAngle,
          segmentEndAngle,
          false,
        );
        this.cooldownCircle.strokePath();
      }
    }
  }
}
