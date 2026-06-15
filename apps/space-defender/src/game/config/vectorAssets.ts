import type { Scene } from "phaser";
import { SVGParser } from "@neon-cabinet/sprite-tools";
import type { SVGPuppetMetadata } from "@neon-cabinet/sprite-tools";

export const SPACE_DEFENDER_VECTOR_ASSETS = [
  {
    id: "ship",
    cacheKey: "space_defender_ship_svg",
    assetPath: "assets/vector/ship.svg",
  },
  {
    id: "bullet",
    cacheKey: "space_defender_bullet_svg",
    assetPath: "assets/vector/bullet.svg",
  },
  {
    id: "missile",
    cacheKey: "space_defender_missile_svg",
    assetPath: "assets/vector/missile.svg",
  },
  {
    id: "thrusterFlame",
    cacheKey: "space_defender_thruster_flame_svg",
    assetPath: "assets/vector/thruster-flame.svg",
  },
  {
    id: "muzzleFlash",
    cacheKey: "space_defender_muzzle_flash_svg",
    assetPath: "assets/vector/muzzle-flash.svg",
  },
  {
    id: "autocannonIcon",
    cacheKey: "space_defender_autocannon_icon_svg",
    assetPath: "assets/vector/autocannon-icon.svg",
  },
  {
    id: "laserIcon",
    cacheKey: "space_defender_laser_icon_svg",
    assetPath: "assets/vector/laser-icon.svg",
  },
  {
    id: "rayGunIcon",
    cacheKey: "space_defender_ray_gun_icon_svg",
    assetPath: "assets/vector/ray-gun-icon.svg",
  },
  {
    id: "missileIcon",
    cacheKey: "space_defender_missile_icon_svg",
    assetPath: "assets/vector/missile-icon.svg",
  },
  {
    id: "lifeIcon",
    cacheKey: "space_defender_life_icon_svg",
    assetPath: "assets/vector/life-icon.svg",
  },
] as const;

type SpaceDefenderVectorAsset = (typeof SPACE_DEFENDER_VECTOR_ASSETS)[number];

export type SpaceDefenderVectorAssetId = SpaceDefenderVectorAsset["id"];

const ASSET_BY_ID = Object.fromEntries(
  SPACE_DEFENDER_VECTOR_ASSETS.map((asset) => [asset.id, asset]),
) as Record<SpaceDefenderVectorAssetId, SpaceDefenderVectorAsset>;

export function getSpaceDefenderVectorAsset(
  id: SpaceDefenderVectorAssetId,
): SpaceDefenderVectorAsset {
  return ASSET_BY_ID[id];
}

export function getSpaceDefenderVectorMetadata(
  scene: Scene,
  id: SpaceDefenderVectorAssetId,
  fallback: SVGPuppetMetadata,
): SVGPuppetMetadata {
  const asset = getSpaceDefenderVectorAsset(id);
  const svgText = scene.cache.text.get(asset.cacheKey) ?? "";
  if (!svgText) return fallback;

  try {
    return new SVGParser().parse(svgText);
  } catch {
    return fallback;
  }
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
