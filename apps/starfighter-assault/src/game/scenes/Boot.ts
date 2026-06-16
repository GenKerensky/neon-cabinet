import { Scene } from "phaser";
import {
  normalizeStarfighterAssetBaseUrl,
  resolveStarfighterAssetPath,
  STARFIGHTER_VECTOR_ASSETS,
} from "../config/vectorAssets";

interface StarfighterGameConfig {
  customAssetBaseUrl?: string;
}

export class Boot extends Scene {
  constructor() {
    super("Boot");
  }

  preload(): void {
    const assetBaseUrl = normalizeStarfighterAssetBaseUrl(
      this.registry.get("assetBaseUrl") ??
        (this.game.config as StarfighterGameConfig).customAssetBaseUrl,
    );

    for (const asset of STARFIGHTER_VECTOR_ASSETS) {
      this.load.text(
        asset.cacheKey,
        resolveStarfighterAssetPath(asset.assetPath, assetBaseUrl),
      );
    }
  }

  create(): void {
    this.scene.start("Title");
  }
}
