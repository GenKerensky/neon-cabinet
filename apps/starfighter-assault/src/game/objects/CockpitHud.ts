import type { GameObjects, Scene } from "phaser";
import type { RadarDot } from "../hud/RadarProjection";
import type { FlightPoint } from "./RailPlayer";

const FRAME_BLUE = 0x23d9ff;
const PANEL_BLUE = 0x0a5d8f;
const GLASS_CYAN = 0x7be8ff;
const LASER_PINK = 0xff2bd6;
const LASER_PURPLE = 0x8e44ff;
const SHADOW = 0x020107;

export class CockpitHud {
  private readonly graphics: GameObjects.Graphics;

  constructor(scene: Scene) {
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(1000);
  }

  render(
    width: number,
    height: number,
    dots: RadarDot[],
    aimOffset: FlightPoint = { x: 0, y: 0 },
  ): void {
    this.graphics.clear();

    this.drawCanopyFrame(width, height);
    this.drawSidePanels(width, height);
    this.drawNose(width, height);
    this.drawLaserCannons(width, height);
    this.drawReticle(width, height, aimOffset);
    this.drawRadar(width, height, dots);
  }

  destroy(): void {
    this.graphics.destroy();
  }

  private drawCanopyFrame(width: number, height: number): void {
    const centerX = width / 2;
    const centerY = height / 2;
    const lowerY = height * 0.82;
    const upperY = height * 0.18;

    this.graphics.lineStyle(12, FRAME_BLUE, 0.12);
    this.strokePath([
      [0, height * 0.62],
      [width * 0.18, lowerY],
      [centerX, height * 0.9],
      [width * 0.82, lowerY],
      [width, height * 0.62],
    ]);

    this.graphics.lineStyle(3, FRAME_BLUE, 0.9);
    this.strokePath([
      [0, height * 0.62],
      [width * 0.18, lowerY],
      [centerX, height * 0.9],
      [width * 0.82, lowerY],
      [width, height * 0.62],
    ]);

    this.graphics.lineStyle(2, GLASS_CYAN, 0.55);
    this.strokePath([
      [width * 0.08, height * 0.24],
      [width * 0.27, upperY],
      [centerX, height * 0.22],
      [width * 0.73, upperY],
      [width * 0.92, height * 0.24],
    ]);

    this.graphics.lineStyle(2, FRAME_BLUE, 0.75);
    this.strokePath([
      [width * 0.12, height * 0.62],
      [width * 0.28, centerY],
      [width * 0.36, upperY],
    ]);
    this.strokePath([
      [width * 0.88, height * 0.62],
      [width * 0.72, centerY],
      [width * 0.64, upperY],
    ]);
  }

  private drawSidePanels(width: number, height: number): void {
    const panelTop = height * 0.7;
    const panelBottom = height;
    const panelWidth = width * 0.28;

    this.graphics.fillStyle(SHADOW, 0.68);
    this.graphics.fillRect(0, panelTop, panelWidth, panelBottom - panelTop);
    this.graphics.fillRect(
      width - panelWidth,
      panelTop,
      panelWidth,
      panelBottom - panelTop,
    );

    this.graphics.lineStyle(2, PANEL_BLUE, 0.9);
    this.strokePath([
      [0, panelTop],
      [panelWidth, height * 0.78],
      [panelWidth * 0.86, height],
    ]);
    this.strokePath([
      [width, panelTop],
      [width - panelWidth, height * 0.78],
      [width - panelWidth * 0.86, height],
    ]);

    this.drawPanelDetails(width * 0.055, height * 0.78, 1);
    this.drawPanelDetails(width * 0.945, height * 0.78, -1);
  }

  private drawPanelDetails(x: number, y: number, direction: 1 | -1): void {
    const lineEnd = x + direction * 72;

    this.graphics.lineStyle(2, GLASS_CYAN, 0.6);
    for (let i = 0; i < 3; i++) {
      const rowY = y + i * 18;
      this.graphics.beginPath();
      this.graphics.moveTo(x, rowY);
      this.graphics.lineTo(lineEnd - direction * i * 10, rowY);
      this.graphics.strokePath();
    }

    this.graphics.fillStyle(LASER_PURPLE, 0.65);
    for (let i = 0; i < 3; i++) {
      this.graphics.fillCircle(x + direction * (16 + i * 18), y + 74, 3);
    }
  }

  private drawNose(width: number, height: number): void {
    const centerX = width / 2;
    const baseY = height;
    const tipY = height * 0.72;

    this.graphics.fillStyle(FRAME_BLUE, 0.06);
    this.graphics.fillTriangle(
      centerX - width * 0.08,
      baseY,
      centerX + width * 0.08,
      baseY,
      centerX,
      tipY,
    );
    this.graphics.lineStyle(2, FRAME_BLUE, 0.22);
    this.strokePath([
      [centerX - width * 0.08, baseY],
      [centerX, tipY],
      [centerX + width * 0.08, baseY],
    ]);
  }

  private drawLaserCannons(width: number, height: number): void {
    const leftBaseX = 0;
    const rightBaseX = width;
    const barrelY = height * 0.66;
    const barrelLength = width * 0.16;
    const barrelHeight = height * 0.055;

    this.drawCannon(leftBaseX, barrelY, barrelLength, barrelHeight, 1);
    this.drawCannon(rightBaseX, barrelY, barrelLength, barrelHeight, -1);
  }

  private drawCannon(
    x: number,
    y: number,
    length: number,
    height: number,
    direction: 1 | -1,
  ): void {
    const tipX = x + direction * length;
    const midY = y;

    this.graphics.fillStyle(LASER_PURPLE, 0.16);
    this.graphics.fillTriangle(x, midY - height, x, midY + height, tipX, midY);

    this.graphics.lineStyle(9, LASER_PINK, 0.12);
    this.strokePath([
      [x, midY - height],
      [tipX, midY],
      [x, midY + height],
    ]);

    this.graphics.lineStyle(3, LASER_PINK, 0.85);
    this.strokePath([
      [x, midY - height],
      [tipX, midY],
      [x, midY + height],
    ]);

    this.graphics.lineStyle(2, GLASS_CYAN, 0.8);
    this.graphics.beginPath();
    this.graphics.moveTo(x, midY);
    this.graphics.lineTo(tipX, midY);
    this.graphics.strokePath();
  }

  private drawReticle(
    width: number,
    height: number,
    aimOffset: FlightPoint,
  ): void {
    const boxWidth = width * 0.46;
    const boxHeight = height * 0.34;
    const boxX = (width - boxWidth) / 2;
    const boxY = height * 0.3;
    const normalizedX = clamp(aimOffset.x / 310, -1, 1);
    const normalizedY = clamp(aimOffset.y / 190, -1, 1);
    const centerX = width / 2 + normalizedX * boxWidth * 0.5;
    const centerY = height * 0.48 + normalizedY * boxHeight * 0.5;
    const radius = Math.min(width, height) * 0.045;

    this.graphics.lineStyle(1, PANEL_BLUE, 0.45);
    this.graphics.strokeRect(boxX, boxY, boxWidth, boxHeight);

    this.graphics.lineStyle(2, GLASS_CYAN, 0.82);
    this.graphics.strokeCircle(centerX, centerY, radius);
    this.graphics.strokeCircle(centerX, centerY, radius * 0.42);

    this.graphics.lineStyle(2, LASER_PINK, 0.85);
    this.graphics.beginPath();
    this.graphics.moveTo(centerX - radius * 1.7, centerY);
    this.graphics.lineTo(centerX - radius * 0.7, centerY);
    this.graphics.moveTo(centerX + radius * 0.7, centerY);
    this.graphics.lineTo(centerX + radius * 1.7, centerY);
    this.graphics.moveTo(centerX, centerY - radius * 1.7);
    this.graphics.lineTo(centerX, centerY - radius * 0.7);
    this.graphics.moveTo(centerX, centerY + radius * 0.7);
    this.graphics.lineTo(centerX, centerY + radius * 1.7);
    this.graphics.strokePath();

    this.graphics.fillStyle(GLASS_CYAN, 0.9);
    this.graphics.fillCircle(centerX, centerY, 2);
  }

  private drawRadar(width: number, height: number, dots: RadarDot[]): void {
    const radarX = width / 2;
    const radarY = height * 0.87;
    const radarW = Math.min(width * 0.34, 260);
    const radarH = Math.min(height * 0.15, 88);

    this.graphics.fillStyle(SHADOW, 0.74);
    this.graphics.fillEllipse(radarX, radarY, radarW, radarH);

    this.graphics.lineStyle(2, FRAME_BLUE, 0.9);
    this.graphics.strokeEllipse(radarX, radarY, radarW, radarH);
    this.graphics.lineStyle(1, PANEL_BLUE, 0.7);
    this.graphics.strokeEllipse(radarX, radarY, radarW * 0.62, radarH * 0.62);

    this.graphics.beginPath();
    this.graphics.moveTo(radarX - radarW * 0.42, radarY);
    this.graphics.lineTo(radarX + radarW * 0.42, radarY);
    this.graphics.moveTo(radarX, radarY - radarH * 0.34);
    this.graphics.lineTo(radarX, radarY + radarH * 0.34);
    this.graphics.strokePath();

    this.graphics.fillStyle(GLASS_CYAN, 0.95);
    this.graphics.fillTriangle(
      radarX,
      radarY - 7,
      radarX - 6,
      radarY + 7,
      radarX + 6,
      radarY + 7,
    );

    for (const dot of dots) {
      const dotX = radarX + dot.x * radarW * 0.42;
      const dotY = radarY + dot.y * radarH * 0.34;
      this.graphics.fillStyle(this.colorToNumber(dot.color), dot.alpha);
      this.graphics.fillCircle(dotX, dotY, dot.radius);
    }
  }

  private strokePath(points: [number, number][]): void {
    if (points.length === 0) return;

    const [firstX, firstY] = points[0];
    this.graphics.beginPath();
    this.graphics.moveTo(firstX, firstY);

    for (let i = 1; i < points.length; i++) {
      const [x, y] = points[i];
      this.graphics.lineTo(x, y);
    }

    this.graphics.strokePath();
  }

  private colorToNumber(color: string): number {
    return Number.parseInt(color.replace("#", ""), 16);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
