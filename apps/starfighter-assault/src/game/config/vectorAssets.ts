import type { SVGPuppetMetadata } from "@neon-cabinet/sprite-tools";

export const STARFIGHTER_VECTOR_ASSETS = [
  {
    id: "cockpitHud",
    cacheKey: "starfighter_cockpit_hud_svg",
    assetPath: "assets/vector/cockpit-hud.svg",
  },
] as const;

type StarfighterVectorAsset = (typeof STARFIGHTER_VECTOR_ASSETS)[number];

export type StarfighterVectorAssetId = StarfighterVectorAsset["id"];

const ASSET_BY_ID = Object.fromEntries(
  STARFIGHTER_VECTOR_ASSETS.map((asset) => [asset.id, asset]),
) as Record<StarfighterVectorAssetId, StarfighterVectorAsset>;

export function getStarfighterVectorAsset(
  id: StarfighterVectorAssetId,
): StarfighterVectorAsset {
  return ASSET_BY_ID[id];
}

export function normalizeStarfighterAssetBaseUrl(
  value: unknown,
): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().replace(/\/+$/, "");
  return trimmed.length > 0 ? trimmed : undefined;
}

export function resolveStarfighterAssetPath(
  path: string,
  assetBaseUrl?: string,
): string {
  const normalizedBaseUrl = normalizeStarfighterAssetBaseUrl(assetBaseUrl);
  if (!normalizedBaseUrl) return path;

  return `${normalizedBaseUrl}/${path.replace(/^\/?assets\//, "")}`;
}

export function createEmptyVectorMetadata(
  width: number,
  height: number,
): SVGPuppetMetadata {
  return {
    viewBox: { x: 0, y: 0, width, height },
    layers: [],
    sockets: [],
  };
}
