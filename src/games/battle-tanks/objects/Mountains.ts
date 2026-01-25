import Phaser from "phaser";
import { Vector3D } from "../engine/Vector3D";
import { Camera3D, ScreenPoint } from "../engine/Camera3D";
import { COLORS } from "../models/models";

interface MountainPeak {
  angle: number;
  height: number;
}

/**
 * Distant horizon mountains wrapping 360 degrees
 */
export class Mountains {
  private graphics: Phaser.GameObjects.Graphics;
  private peaks: MountainPeak[] = [];
  private mountainDistance: number;
  private baseHeight: number;
  private color: number;

  constructor(scene: Phaser.Scene, mountainDistance = 4000) {
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

      this.peaks.push({ angle, height });
    }

    this.peaks.sort((a, b) => a.angle - b.angle);
  }

  render(camera: Camera3D, screenW: number, screenH: number): void {
    this.graphics.clear();

    const visiblePeaks: { screenPoint: ScreenPoint; peak: MountainPeak }[] = [];

    for (const peak of this.peaks) {
      const worldX =
        camera.position.x + Math.sin(peak.angle) * this.mountainDistance;
      const worldZ =
        camera.position.z + Math.cos(peak.angle) * this.mountainDistance;
      const worldY = this.baseHeight + peak.height;

      const worldPos = new Vector3D(worldX, worldY, worldZ);
      const screenPoint = camera.worldToScreen(worldPos, screenW, screenH);

      if (screenPoint) {
        visiblePeaks.push({ screenPoint, peak });
      }
    }

    if (visiblePeaks.length < 2) return;

    visiblePeaks.sort((a, b) => a.screenPoint.x - b.screenPoint.x);

    // Draw mountain silhouette
    this.graphics.lineStyle(2, this.color, 0.8);
    this.graphics.beginPath();

    const first = visiblePeaks[0];
    this.graphics.moveTo(first.screenPoint.x, first.screenPoint.y);

    for (let i = 1; i < visiblePeaks.length; i++) {
      const current = visiblePeaks[i];
      this.graphics.lineTo(current.screenPoint.x, current.screenPoint.y);
    }

    this.graphics.strokePath();

    // Vertical lines from tall peaks
    const horizonY = screenH / 2;
    this.graphics.lineStyle(1, this.color, 0.4);

    for (const { screenPoint, peak } of visiblePeaks) {
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
    for (const { peak } of visiblePeaks) {
      const worldX =
        camera.position.x + Math.sin(peak.angle) * this.mountainDistance;
      const worldZ =
        camera.position.z + Math.cos(peak.angle) * this.mountainDistance;
      const groundPos = new Vector3D(worldX, this.baseHeight + 20, worldZ);
      const groundScreen = camera.worldToScreen(groundPos, screenW, screenH);

      if (groundScreen) {
        if (firstGround) {
          this.graphics.moveTo(groundScreen.x, groundScreen.y);
          firstGround = false;
        } else {
          this.graphics.lineTo(groundScreen.x, groundScreen.y);
        }
      }
    }

    this.graphics.strokePath();
  }

  destroy(): void {
    this.graphics.destroy();
  }
}
