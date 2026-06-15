import type { GameObjects, Scene } from "phaser";
import { Camera3D, ScreenPoint } from "../engine/Camera3D";
import { COLORS } from "../models";

interface MountainPeak {
  angle: number;
  sin: number;
  cos: number;
  height: number;
}

interface VisibleMountainPeak {
  screenPoint: ScreenPoint;
  peak: MountainPeak;
}

/**
 * Distant horizon mountains wrapping 360 degrees
 */
export class Mountains {
  private graphics: GameObjects.Graphics;
  private peaks: MountainPeak[] = [];
  private mountainDistance: number;
  private baseHeight: number;
  private color: number;
  private visiblePeaks: VisibleMountainPeak[] = [];
  private visiblePeakPool: VisibleMountainPeak[] = [];
  private readonly groundScreen: ScreenPoint = { x: 0, y: 0, z: 0 };

  constructor(scene: Scene, mountainDistance = 4000) {
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(0);
    this.mountainDistance = mountainDistance;
    this.baseHeight = 0;
    this.color = COLORS.mountains;

    this.generateMountains();
  }

  private generateMountains(): void {
    this.peaks = [];

    const numPeaks = 24;
    const angleStep = (Math.PI * 2) / numPeaks;

    for (let i = 0; i < numPeaks; i++) {
      const baseAngle = i * angleStep;
      const angle = baseAngle + (Math.random() - 0.5) * angleStep * 0.5;

      let height: number;
      if (i === 6) {
        // Volcano
        height = 500 + Math.random() * 100;
      } else {
        height = 150 + Math.random() * 350;
      }

      this.peaks.push({
        angle,
        sin: Math.sin(angle),
        cos: Math.cos(angle),
        height,
      });
    }

    this.peaks.sort((a, b) => a.angle - b.angle);
  }

  render(camera: Camera3D, screenW: number, screenH: number): void {
    this.graphics.clear();

    this.visiblePeaks.length = 0;

    for (const peak of this.peaks) {
      const worldY = this.baseHeight + peak.height;
      const visiblePeak = this.nextVisiblePeak(peak);

      if (
        this.projectPeakInto(
          visiblePeak.screenPoint,
          camera,
          peak,
          worldY,
          screenW,
          screenH,
        )
      ) {
        this.visiblePeaks.push(visiblePeak);
      }
    }

    if (this.visiblePeaks.length < 2) return;

    this.visiblePeaks.sort((a, b) => a.screenPoint.x - b.screenPoint.x);

    const horizonY = screenH / 2;

    // Draw filled black mountain silhouette
    this.graphics.fillStyle(0x000000, 1);
    this.graphics.beginPath();

    const first = this.visiblePeaks[0];
    // Start at horizon on the left
    this.graphics.moveTo(first.screenPoint.x, horizonY);
    // Go up to first peak
    this.graphics.lineTo(first.screenPoint.x, first.screenPoint.y);

    // Draw along all peaks
    for (let i = 1; i < this.visiblePeaks.length; i++) {
      const current = this.visiblePeaks[i];
      this.graphics.lineTo(current.screenPoint.x, current.screenPoint.y);
    }

    // Go down to horizon on the right
    const last = this.visiblePeaks[this.visiblePeaks.length - 1];
    this.graphics.lineTo(last.screenPoint.x, horizonY);

    // Close the path along the horizon
    this.graphics.closePath();
    this.graphics.fillPath();

    // Draw mountain outline on top
    this.graphics.lineStyle(2, this.color, 0.8);
    this.graphics.beginPath();

    this.graphics.moveTo(first.screenPoint.x, first.screenPoint.y);

    for (let i = 1; i < this.visiblePeaks.length; i++) {
      const current = this.visiblePeaks[i];
      this.graphics.lineTo(current.screenPoint.x, current.screenPoint.y);
    }

    this.graphics.strokePath();

    // Vertical lines from tall peaks
    this.graphics.lineStyle(1, this.color, 0.4);

    for (const { screenPoint, peak } of this.visiblePeaks) {
      if (peak.height > 250) {
        this.graphics.beginPath();
        this.graphics.moveTo(screenPoint.x, screenPoint.y);
        this.graphics.lineTo(screenPoint.x, horizonY);
        this.graphics.strokePath();
      }
    }

    // Base line
    this.graphics.lineStyle(1, this.color, 0.5);
    this.graphics.beginPath();

    let firstGround = true;
    for (const { peak } of this.visiblePeaks) {
      if (
        this.projectPeakInto(
          this.groundScreen,
          camera,
          peak,
          this.baseHeight + 20,
          screenW,
          screenH,
        )
      ) {
        if (firstGround) {
          this.graphics.moveTo(this.groundScreen.x, this.groundScreen.y);
          firstGround = false;
        } else {
          this.graphics.lineTo(this.groundScreen.x, this.groundScreen.y);
        }
      }
    }

    this.graphics.strokePath();
  }

  destroy(): void {
    this.graphics.destroy();
  }

  private nextVisiblePeak(peak: MountainPeak): VisibleMountainPeak {
    const index = this.visiblePeaks.length;
    let visiblePeak = this.visiblePeakPool[index];
    if (!visiblePeak) {
      visiblePeak = {
        screenPoint: { x: 0, y: 0, z: 0 },
        peak,
      };
      this.visiblePeakPool[index] = visiblePeak;
    }
    visiblePeak.peak = peak;
    return visiblePeak;
  }

  private projectPeakInto(
    target: ScreenPoint,
    camera: Camera3D,
    peak: MountainPeak,
    worldY: number,
    screenW: number,
    screenH: number,
  ): boolean {
    const relX = peak.sin * this.mountainDistance;
    const relY = worldY - camera.position.y;
    const relZ = peak.cos * this.mountainDistance;
    const cosCamera = Math.cos(camera.rotation);
    const sinCamera = Math.sin(camera.rotation);
    const cameraX = relX * cosCamera - relZ * sinCamera;
    const cameraZ = relX * sinCamera + relZ * cosCamera;

    if (cameraZ <= camera.nearClip || cameraZ > camera.farClip) {
      return false;
    }

    target.x = (cameraX / cameraZ) * camera.focalLength + screenW / 2;
    target.y = screenH / 2 - (relY / cameraZ) * camera.focalLength;
    target.z = cameraZ;
    return true;
  }
}
