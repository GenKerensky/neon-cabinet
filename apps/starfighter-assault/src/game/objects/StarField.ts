import type { GameObjects, Scene } from "phaser";
import type { FlightPoint } from "./RailPlayer";

export type StarFieldLayer = "far" | "mid" | "near";

export interface StarFieldStar {
  x: number;
  y: number;
  layer: StarFieldLayer;
  radius: number;
  color: number;
  alpha: number;
}

export interface ProjectedStar {
  x: number;
  y: number;
  radius: number;
  color: number;
  alpha: number;
}

interface CreateStarFieldOptions {
  seed: number;
  count: number;
}

const LAYER_STRENGTH: Record<StarFieldLayer, number> = {
  far: 0.035,
  mid: 0.075,
  near: 0.14,
};

const STAR_COLORS = [0x7be8ff, 0x8e44ff, 0xff2bd6, 0xd7f7ff];

export class StarField {
  private readonly graphics: GameObjects.Graphics;
  private readonly stars: StarFieldStar[];

  constructor(
    scene: Scene,
    options: CreateStarFieldOptions = { seed: 1983, count: 96 },
  ) {
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(1);
    this.stars = createStarField(options);
  }

  render(width: number, height: number, playerPosition: FlightPoint): void {
    this.graphics.clear();

    for (const star of projectStarField(
      this.stars,
      width,
      height,
      playerPosition,
    )) {
      this.graphics.fillStyle(star.color, star.alpha);
      this.graphics.fillCircle(star.x, star.y, star.radius);
    }
  }

  destroy(): void {
    this.graphics.destroy();
  }
}

export function createStarField(
  options: CreateStarFieldOptions,
): StarFieldStar[] {
  const random = createSeededRandom(options.seed);
  const stars: StarFieldStar[] = [];

  for (let index = 0; index < options.count; index++) {
    const layer = pickLayer(random());
    const brightness = layer === "near" ? 0.72 : layer === "mid" ? 0.5 : 0.32;
    stars.push({
      x: random(),
      y: random() * 0.82 + 0.04,
      layer,
      radius: layer === "near" ? 1.45 : layer === "mid" ? 1.1 : 0.8,
      color: STAR_COLORS[Math.floor(random() * STAR_COLORS.length)],
      alpha: brightness + random() * 0.18,
    });
  }

  return stars;
}

export function projectStarField(
  stars: StarFieldStar[],
  width: number,
  height: number,
  playerPosition: FlightPoint,
): ProjectedStar[] {
  return stars.map((star) => projectStar(star, width, height, playerPosition));
}

export function projectStar(
  star: StarFieldStar,
  width: number,
  height: number,
  playerPosition: FlightPoint,
): ProjectedStar {
  const strength = LAYER_STRENGTH[star.layer];
  return {
    x: wrap(star.x * width - playerPosition.x * strength, width),
    y: wrap(star.y * height - playerPosition.y * strength, height),
    radius: star.radius,
    color: star.color,
    alpha: star.alpha,
  };
}

function pickLayer(value: number): StarFieldLayer {
  if (value > 0.84) return "near";
  if (value > 0.46) return "mid";
  return "far";
}

function createSeededRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

function wrap(value: number, limit: number): number {
  if (limit <= 0) return 0;
  return ((value % limit) + limit) % limit;
}
