import type { GameObjects, Scene } from "phaser";
import {
  HudVectorPuppet,
  SVGParser,
  type SVGPuppetMetadata,
} from "@neon-cabinet/sprite-tools";
import { getFontFamily } from "../../utils/font";
import {
  createEmptyVectorMetadata,
  getStarfighterVectorAsset,
} from "../config/vectorAssets";
import type { RadarDot } from "../hud/RadarProjection";
import type { ThreatKind } from "../rail/SegmentTypes";
import type { FlightPoint } from "./RailPlayer";

const GLASS_CYAN = 0x7be8ff;
const LASER_PINK = 0xff2bd6;
const LASER_PURPLE = 0x8e44ff;

export interface CockpitHudStatus {
  label: string;
  contacts: number;
  bounties: number;
  torpedoes: number;
  isFinale: boolean;
  shieldsDown?: boolean;
}

export interface CockpitThreatMarker {
  id: string;
  kind: ThreatKind;
  x: number;
  y: number;
  z: number;
  threat: number;
}

export class CockpitHud {
  private readonly shell: HudVectorPuppet;
  private readonly graphics: GameObjects.Graphics;
  private readonly statusText: GameObjects.Text;
  private readonly shellViewBox: SVGPuppetMetadata["viewBox"];

  constructor(scene: Scene) {
    const shellMetadata = getCockpitHudMetadata(scene);
    this.shellViewBox = shellMetadata.viewBox;
    this.shell = new HudVectorPuppet(scene, 0, 0, shellMetadata);
    this.shell.setDepth(999);

    this.graphics = scene.add.graphics();
    this.graphics.setDepth(1000);
    this.statusText = scene.add
      .text(22, 18, "", {
        fontFamily: getFontFamily(scene),
        fontSize: "14px",
        color: "#7be8ff",
      })
      .setDepth(1001);
  }

  render(
    width: number,
    height: number,
    dots: RadarDot[],
    aimOffset: FlightPoint = { x: 0, y: 0 },
    status?: CockpitHudStatus,
    threats: CockpitThreatMarker[] = [],
  ): void {
    this.graphics.clear();
    this.renderShell(width, height, status);

    if (status?.isFinale) {
      this.drawCapitalShipSilhouette(width, height);
    }

    this.drawThreatMarkers(width, height, threats);
    this.drawReticle(width, height, aimOffset);
    this.drawRadar(width, height, dots);
    this.renderStatus(status);
  }

  destroy(): void {
    this.shell.destroy();
    this.graphics.destroy();
    this.statusText.destroy();
  }

  private renderShell(
    width: number,
    height: number,
    status?: CockpitHudStatus,
  ): void {
    this.shell.setPosition(width / 2, height / 2);
    this.shell.setScale(
      width / this.shellViewBox.width,
      height / this.shellViewBox.height,
    );
    this.shell.applyHudState(
      "torpedoes",
      status !== undefined && status.torpedoes <= 0 ? "empty" : "normal",
    );
    this.shell.applyHudState(
      "shields",
      status?.shieldsDown === true ? "down" : "normal",
    );
  }

  private renderStatus(status?: CockpitHudStatus): void {
    if (status === undefined) {
      this.statusText.setText("");
      return;
    }

    this.statusText.setText(
      `${status.label}  CONTACTS ${status.contacts}  BOUNTIES ${status.bounties}  TORP ${status.torpedoes}`,
    );
  }

  private drawCapitalShipSilhouette(width: number, height: number): void {
    const centerX = width / 2;
    const noseY = height * 0.14;
    const sternY = height * 0.46;
    const halfSternW = width * 0.28;

    this.graphics.fillStyle(LASER_PURPLE, 0.07);
    this.graphics.fillTriangle(
      centerX,
      noseY,
      centerX - halfSternW,
      sternY,
      centerX + halfSternW,
      sternY,
    );

    this.graphics.lineStyle(2, LASER_PURPLE, 0.62);
    this.strokePath([
      [centerX, noseY],
      [centerX - halfSternW, sternY],
      [centerX + halfSternW, sternY],
      [centerX, noseY],
    ]);

    this.graphics.lineStyle(1, GLASS_CYAN, 0.35);
    this.strokePath([
      [centerX, noseY + 18],
      [centerX - halfSternW * 0.18, sternY - 24],
      [centerX + halfSternW * 0.18, sternY - 24],
      [centerX, noseY + 18],
    ]);
    this.strokePath([
      [centerX - halfSternW * 0.58, sternY - 12],
      [centerX + halfSternW * 0.58, sternY - 12],
    ]);
  }

  private drawThreatMarkers(
    width: number,
    height: number,
    threats: CockpitThreatMarker[],
  ): void {
    for (const threat of threats) {
      const projection = projectThreatToViewport(width, height, threat);
      if (projection === null) continue;

      const color = threat.threat > 0.75 ? LASER_PINK : GLASS_CYAN;
      this.graphics.lineStyle(2, color, projection.alpha);
      this.graphics.strokeRect(
        projection.x - projection.size / 2,
        projection.y - projection.size / 2,
        projection.size,
        projection.size,
      );

      this.graphics.beginPath();
      this.graphics.moveTo(projection.x - projection.size * 0.8, projection.y);
      this.graphics.lineTo(projection.x - projection.size * 0.42, projection.y);
      this.graphics.moveTo(projection.x + projection.size * 0.42, projection.y);
      this.graphics.lineTo(projection.x + projection.size * 0.8, projection.y);
      this.graphics.moveTo(projection.x, projection.y - projection.size * 0.8);
      this.graphics.lineTo(projection.x, projection.y - projection.size * 0.42);
      this.graphics.moveTo(projection.x, projection.y + projection.size * 0.42);
      this.graphics.lineTo(projection.x, projection.y + projection.size * 0.8);
      this.graphics.strokePath();
    }
  }

  private drawReticle(
    width: number,
    height: number,
    aimOffset: FlightPoint,
  ): void {
    const boxWidth = width * 0.46;
    const boxHeight = height * 0.34;
    const normalizedX = clamp(aimOffset.x / 310, -1, 1);
    const normalizedY = clamp(aimOffset.y / 190, -1, 1);
    const centerX = width / 2 + normalizedX * boxWidth * 0.5;
    const centerY = height * 0.48 + normalizedY * boxHeight * 0.5;
    const radius = Math.min(width, height) * 0.045;

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

function getCockpitHudMetadata(scene: Scene): SVGPuppetMetadata {
  const fallback = createEmptyVectorMetadata(1000, 600);
  const asset = getStarfighterVectorAsset("cockpitHud");
  const svgText = scene.cache.text.get(asset.cacheKey) ?? "";
  if (!svgText) return fallback;

  try {
    return new SVGParser().parse(svgText);
  } catch {
    return fallback;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function projectThreatToViewport(
  width: number,
  height: number,
  threat: CockpitThreatMarker,
): { x: number; y: number; size: number; alpha: number } | null {
  if (threat.z <= 0) return null;

  const depthScale = clamp(900 / threat.z, 0.55, 1.6);
  const x = width / 2 + (threat.x / threat.z) * width * 0.95;
  const y = height * 0.46 + (threat.y / threat.z) * height * 0.9;
  const size = clamp(34 * depthScale, 18, 62);

  if (
    x < width * 0.08 ||
    x > width * 0.92 ||
    y < height * 0.14 ||
    y > height * 0.72
  ) {
    return null;
  }

  return {
    x,
    y,
    size,
    alpha: clamp(depthScale, 0.5, 0.95),
  };
}
