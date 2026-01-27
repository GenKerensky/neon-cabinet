import type { GameObjects, Scene } from "phaser";
import { Vector3D } from "../engine/Vector3D";
import { Camera3D } from "../engine/Camera3D";

export interface ParticleConfig {
  speed: { min: number; max: number };
  lifespan: { min: number; max: number };
  lineLength: { min: number; max: number };
  color: number;
  gravity?: number;
  fadeOut?: boolean;
}

interface VectorParticle {
  position: Vector3D;
  velocity: Vector3D;
  life: number;
  maxLife: number;
  lineLength: number;
  color: number;
  gravity: number;
  fadeOut: boolean;
}

export const PARTICLE_PRESETS = {
  explosion: {
    speed: { min: 100, max: 300 },
    lifespan: { min: 500, max: 1000 },
    lineLength: { min: 10, max: 30 },
    color: 0xffff00,
    gravity: 0,
    fadeOut: true,
  } as ParticleConfig,

  debris: {
    speed: { min: 50, max: 150 },
    lifespan: { min: 800, max: 1500 },
    lineLength: { min: 5, max: 15 },
    color: 0x00ff00,
    gravity: 200,
    fadeOut: true,
  } as ParticleConfig,

  sparks: {
    speed: { min: 200, max: 400 },
    lifespan: { min: 200, max: 400 },
    lineLength: { min: 5, max: 10 },
    color: 0xffffff,
    gravity: 0,
    fadeOut: true,
  } as ParticleConfig,

  dust: {
    speed: { min: 20, max: 50 },
    lifespan: { min: 500, max: 1000 },
    lineLength: { min: 3, max: 8 },
    color: 0x888888,
    gravity: -20,
    fadeOut: true,
  } as ParticleConfig,
};

/**
 * Line-based particle system for vector aesthetic
 */
export class VectorParticleSystem {
  private particles: VectorParticle[] = [];
  private graphics: GameObjects.Graphics;
  private camera!: Camera3D;
  private maxParticles: number;

  constructor(scene: Scene, maxParticles = 500) {
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(50);
    this.maxParticles = maxParticles;
  }

  setCamera(camera: Camera3D): void {
    this.camera = camera;
  }

  emit(origin: Vector3D, count: number, config: ParticleConfig): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) {
        this.particles.shift();
      }

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed =
        config.speed.min +
        Math.random() * (config.speed.max - config.speed.min);

      const velocity = new Vector3D(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed * 0.5,
        Math.cos(phi) * speed,
      );

      const lifespan =
        config.lifespan.min +
        Math.random() * (config.lifespan.max - config.lifespan.min);
      const lineLength =
        config.lineLength.min +
        Math.random() * (config.lineLength.max - config.lineLength.min);

      this.particles.push({
        position: origin.clone(),
        velocity,
        life: lifespan,
        maxLife: lifespan,
        lineLength,
        color: config.color,
        gravity: config.gravity ?? 0,
        fadeOut: config.fadeOut ?? true,
      });
    }
  }

  emitRing(
    origin: Vector3D,
    count: number,
    config: ParticleConfig,
    yOffset = 20,
  ): void {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) {
        this.particles.shift();
      }

      const angle = (i / count) * Math.PI * 2;
      const speed =
        config.speed.min +
        Math.random() * (config.speed.max - config.speed.min);

      const velocity = new Vector3D(
        Math.cos(angle) * speed,
        (Math.random() - 0.3) * speed * 0.3,
        Math.sin(angle) * speed,
      );

      const lifespan =
        config.lifespan.min +
        Math.random() * (config.lifespan.max - config.lifespan.min);
      const lineLength =
        config.lineLength.min +
        Math.random() * (config.lineLength.max - config.lineLength.min);

      this.particles.push({
        position: new Vector3D(origin.x, origin.y + yOffset, origin.z),
        velocity,
        life: lifespan,
        maxLife: lifespan,
        lineLength,
        color: config.color,
        gravity: config.gravity ?? 0,
        fadeOut: config.fadeOut ?? true,
      });
    }
  }

  update(delta: number): void {
    const dt = delta / 1000;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      p.life -= delta;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.velocity.y -= p.gravity * dt;

      p.position.x += p.velocity.x * dt;
      p.position.y += p.velocity.y * dt;
      p.position.z += p.velocity.z * dt;

      if (p.position.y < 1) {
        p.position.y = 1;
        p.velocity.y = Math.abs(p.velocity.y) * 0.3;
        p.velocity.x *= 0.8;
        p.velocity.z *= 0.8;
      }
    }
  }

  render(screenW: number, screenH: number): void {
    this.graphics.clear();

    if (!this.camera) return;

    for (const p of this.particles) {
      const screenPos = this.camera.worldToScreen(p.position, screenW, screenH);
      if (!screenPos) continue;

      const velocityNorm = p.velocity.normalize();
      const lineEnd = p.position.add(velocityNorm.scale(p.lineLength));
      const screenEnd = this.camera.worldToScreen(lineEnd, screenW, screenH);

      let alpha = 1;
      if (p.fadeOut) {
        alpha = p.life / p.maxLife;
      }

      this.graphics.lineStyle(2, p.color, alpha);
      this.graphics.beginPath();

      if (screenEnd) {
        this.graphics.moveTo(screenPos.x, screenPos.y);
        this.graphics.lineTo(screenEnd.x, screenEnd.y);
      } else {
        this.graphics.moveTo(screenPos.x - 1, screenPos.y);
        this.graphics.lineTo(screenPos.x + 1, screenPos.y);
      }

      this.graphics.strokePath();
    }
  }

  getParticleCount(): number {
    return this.particles.length;
  }

  clear(): void {
    this.particles = [];
    this.graphics.clear();
  }

  destroy(): void {
    this.graphics.destroy();
  }
}
