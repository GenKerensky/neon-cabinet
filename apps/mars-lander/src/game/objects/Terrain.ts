import { Math as PhaserMath } from "phaser";
import type { GameObjects, Scene } from "phaser";

interface TerrainPoint {
  x: number;
  y: number;
}

interface LandingZone {
  startX: number;
  endX: number;
  y: number;
  multiplier: number; // Score multiplier based on difficulty
}

export class Terrain {
  private scene: Scene;
  private graphics: GameObjects.Graphics;
  private points: TerrainPoint[] = [];
  private landingZones: LandingZone[] = [];
  private multiplierTexts: GameObjects.Text[] = [];
  private width: number;
  private height: number;
  private baseHeight: number;
  private maxTerrainHeight: number; // Minimum Y value (screen coordinates) - terrain cannot go above this

  // Colors - Martian theme
  private terrainColor = 0xff6600; // Orange
  private terrainFillColor = 0x331100; // Dark red-brown
  private landingPadColor = 0x00ff00; // Green

  constructor(scene: Scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(2);

    this.width = scene.cameras.main.width;
    this.height = scene.cameras.main.height;
    this.baseHeight = this.height - 100; // Base terrain level
    this.maxTerrainHeight = this.height * 0.3; // Terrain cannot go above 30% from top
  }

  generate(difficulty: number = 1, avoidCenter: boolean = false): void {
    this.points = [];
    this.landingZones = [];

    // Clean up old multiplier texts
    this.multiplierTexts.forEach((text) => text.destroy());
    this.multiplierTexts = [];

    // Cap effective difficulty for terrain generation to prevent extreme values
    const effectiveDifficulty = Math.min(difficulty, 10);

    const segmentWidth = 40;
    const numSegments = Math.ceil(this.width / segmentWidth) + 1;

    // Determine number of landing zones based on difficulty
    // Level 1: 4, Level 2: 3, Level 3: 2, Level 4+: random 1-4
    let numLandingZones: number;
    if (difficulty <= 3) {
      numLandingZones = 5 - difficulty; // 4, 3, 2
    } else {
      numLandingZones = PhaserMath.Between(1, 4);
    }

    const landingZoneWidth = Math.max(80, 150 - effectiveDifficulty * 10);

    // Define center exclusion zone (where lander spawns)
    const screenCenter = this.width / 2;
    const centerExclusionRadius = landingZoneWidth;

    // Generate random landing zone positions
    const margin = landingZoneWidth; // Keep zones away from screen edges
    const usableWidth = this.width - margin * 2;

    for (let i = 0; i < numLandingZones; i++) {
      let centerX: number;
      let attempts = 0;
      const maxAttempts = 50;

      // Try to find a valid position that doesn't overlap existing zones
      do {
        centerX = margin + Math.random() * usableWidth;
        attempts++;

        // Check if too close to center (when avoiding center)
        if (avoidCenter) {
          const distFromCenter = Math.abs(centerX - screenCenter);
          if (distFromCenter < centerExclusionRadius) {
            continue;
          }
        }

        // Check if overlapping with existing zones
        const overlaps = this.landingZones.some((zone) => {
          const newStart = centerX - landingZoneWidth / 2;
          const newEnd = centerX + landingZoneWidth / 2;
          return newStart < zone.endX + 40 && newEnd > zone.startX - 40;
        });

        if (!overlaps) break;
      } while (attempts < maxAttempts);

      const startX = centerX - landingZoneWidth / 2;
      const endX = centerX + landingZoneWidth / 2;
      // Fewer zones = higher multiplier
      const multiplier = Math.max(1, 5 - numLandingZones);

      this.landingZones.push({
        startX,
        endX,
        y: this.baseHeight,
        multiplier,
      });
    }

    // Generate terrain points
    let x = 0;
    for (let i = 0; i <= numSegments; i++) {
      x = i * segmentWidth;

      // Check if this segment is part of a landing zone
      const inLandingZone = this.landingZones.some(
        (zone) => x >= zone.startX && x <= zone.endX,
      );

      let y: number;
      if (inLandingZone) {
        // Flat terrain for landing zone
        y = this.baseHeight;
      } else {
        // Jagged terrain with height variation (capped to reasonable range)
        const heightVariation = Math.min(200, 50 + effectiveDifficulty * 15);

        // Use a seeded random for this level (use level modulo to keep seed reasonable)
        const seed = (difficulty % 100) + 1;
        const noise = this.perlinNoise(x * 0.01, seed);
        y = this.baseHeight - Math.abs(noise) * heightVariation;

        // Add some random spikes (capped probability)
        const spikeChance = Math.min(0.3, 0.05 + effectiveDifficulty * 0.02);
        if (Math.random() < spikeChance) {
          y -= PhaserMath.Between(20, 50);
        }

        // Clamp to max terrain height (prevent terrain going off screen)
        y = Math.max(this.maxTerrainHeight, y);
      }

      this.points.push({ x, y });
    }

    this.draw();
  }

  private perlinNoise(x: number, seed: number): number {
    // Simplified noise function
    const n = Math.sin(x * 12.9898 + seed * 78.233) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1;
  }

  private draw(): void {
    this.graphics.clear();

    // Draw terrain fill
    this.graphics.fillStyle(this.terrainFillColor, 0.8);
    this.graphics.beginPath();
    this.graphics.moveTo(0, this.height);

    for (const point of this.points) {
      this.graphics.lineTo(point.x, point.y);
    }

    this.graphics.lineTo(this.width, this.height);
    this.graphics.closePath();
    this.graphics.fillPath();

    // Draw terrain outline
    this.graphics.lineStyle(3, this.terrainColor, 1);
    this.graphics.beginPath();
    this.graphics.moveTo(this.points[0].x, this.points[0].y);

    for (let i = 1; i < this.points.length; i++) {
      this.graphics.lineTo(this.points[i].x, this.points[i].y);
    }

    this.graphics.strokePath();

    // Draw landing zones
    for (const zone of this.landingZones) {
      this.drawLandingZone(zone);
    }
  }

  private drawLandingZone(zone: LandingZone): void {
    const padWidth = zone.endX - zone.startX;

    // Landing pad surface
    this.graphics.lineStyle(4, this.landingPadColor, 1);
    this.graphics.lineBetween(zone.startX, zone.y, zone.endX, zone.y);

    // End markers
    this.graphics.lineStyle(2, this.landingPadColor, 0.8);
    this.graphics.lineBetween(zone.startX, zone.y - 10, zone.startX, zone.y);
    this.graphics.lineBetween(zone.endX, zone.y - 10, zone.endX, zone.y);

    // Multiplier indicator (more lights = higher multiplier)
    const numLights = zone.multiplier;
    const lightSpacing = padWidth / (numLights + 1);
    for (let i = 0; i < numLights; i++) {
      const lightX = zone.startX + lightSpacing * (i + 1);
      this.graphics.fillStyle(0x00ffff, 1);
      this.graphics.fillCircle(lightX, zone.y - 5, 3);
    }

    // Multiplier text
    const font = this.scene.registry.get("fontFamily") || "Orbitron";
    const text = this.scene.add.text(
      zone.startX + padWidth / 2,
      zone.y + 15,
      `x${zone.multiplier}`,
      {
        fontFamily: font,
        fontSize: "14px",
        color: "#00ff00",
      },
    );
    text.setOrigin(0.5);
    text.setDepth(3);
    this.multiplierTexts.push(text);
  }

  checkCollision(
    x: number,
    y: number,
    _width: number,
    height: number,
  ): { collision: boolean; onLandingPad: boolean; multiplier: number } {
    // Get terrain height at lander position
    const terrainY = this.getTerrainHeightAt(x);

    // Check if lander bottom is at or below terrain
    const landerBottom = y + height / 2;

    if (landerBottom >= terrainY) {
      // Check if on landing pad
      for (const zone of this.landingZones) {
        if (x >= zone.startX && x <= zone.endX) {
          return {
            collision: true,
            onLandingPad: true,
            multiplier: zone.multiplier,
          };
        }
      }
      return { collision: true, onLandingPad: false, multiplier: 0 };
    }

    return { collision: false, onLandingPad: false, multiplier: 0 };
  }

  getTerrainHeightAt(x: number): number {
    // Find the two points that bracket this x position
    for (let i = 0; i < this.points.length - 1; i++) {
      const p1 = this.points[i];
      const p2 = this.points[i + 1];

      if (x >= p1.x && x <= p2.x) {
        // Linear interpolation between points
        const t = (x - p1.x) / (p2.x - p1.x);
        return p1.y + t * (p2.y - p1.y);
      }
    }

    return this.baseHeight;
  }

  getLandingZones(): LandingZone[] {
    return this.landingZones;
  }

  destroy(): void {
    this.graphics.destroy();
    this.multiplierTexts.forEach((text) => text.destroy());
    this.multiplierTexts = [];
  }
}
