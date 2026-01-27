import type { Scene } from "phaser";

export const SHAKE_PRESETS = {
  fire: { intensity: 0.002, duration: 50 },
  explosion: { intensity: 0.005, duration: 150 },
  hit: { intensity: 0.01, duration: 300 },
  death: { intensity: 0.02, duration: 500 },
};

/**
 * Screen shake utility
 */
export class ScreenShake {
  private scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  shake(intensity: number, duration: number): void {
    this.scene.cameras.main.shake(duration, intensity);
  }

  preset(name: keyof typeof SHAKE_PRESETS): void {
    const p = SHAKE_PRESETS[name];
    this.shake(p.intensity, p.duration);
  }

  fire(): void {
    this.preset("fire");
  }

  explosion(): void {
    this.preset("explosion");
  }

  hit(): void {
    this.preset("hit");
  }

  death(): void {
    this.preset("death");
  }

  stop(): void {
    this.scene.cameras.main.resetFX();
  }
}
