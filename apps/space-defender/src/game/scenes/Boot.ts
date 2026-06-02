import { Math as PhaserMath, Scene } from "phaser";
import { VectorMode } from "@neon-cabinet/shaders";
import { EventBus } from "../EventBus";
import { SPACE_DEFENDER_VECTOR_ASSETS } from "../config/vectorAssets";

interface SpaceDefenderGameConfig {
  customAssetBaseUrl?: string;
  customFontFamily?: string;
}

const normalizeAssetBaseUrl = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().replace(/\/+$/, "");
  return trimmed.length > 0 ? trimmed : undefined;
};

const stripAssetPrefix = (path: string): string => {
  return path.replace(/^\/?assets\//, "");
};

const resolveAssetPath = (path: string, assetBaseUrl?: string): string => {
  if (!assetBaseUrl) return path;
  return `${assetBaseUrl}/${stripAssetPrefix(path)}`;
};

export class Boot extends Scene {
  constructor() {
    super("Boot");
  }

  preload(): void {
    const assetBaseUrl = normalizeAssetBaseUrl(
      this.registry.get("assetBaseUrl") ??
        (this.game.config as SpaceDefenderGameConfig).customAssetBaseUrl,
    );
    const assetPath = (path: string) => resolveAssetPath(path, assetBaseUrl);

    for (const asset of SPACE_DEFENDER_VECTOR_ASSETS) {
      this.load.text(asset.cacheKey, assetPath(asset.assetPath));
    }

    this.generateAsteroidTextures();
    this.generateParticleTexture();
  }

  private generateAsteroidTextures(): void {
    const asteroidColors = [0x7a7f82, 0x858b8f, 0x90979c, 0x9ba3a9, 0xa6afb6];

    for (let variant = 0; variant < 5; variant++) {
      const asteroidGraphics = this.make.graphics({ x: 0, y: 0 });
      asteroidGraphics.fillStyle(asteroidColors[variant]);
      asteroidGraphics.lineStyle(1, 0xffffff, 1);
      asteroidGraphics.beginPath();

      const points = PhaserMath.Between(7, 12);
      const baseRadius = 27;
      const center = 30;

      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const radius = baseRadius + PhaserMath.Between(-12, 10);
        const x = center + Math.cos(angle) * radius;
        const y = center + Math.sin(angle) * radius;
        if (i === 0) {
          asteroidGraphics.moveTo(x, y);
        } else {
          asteroidGraphics.lineTo(x, y);
        }
      }

      asteroidGraphics.closePath();
      asteroidGraphics.fillPath();
      asteroidGraphics.strokePath();
      asteroidGraphics.generateTexture(`asteroid_${variant}`, 60, 60);
      asteroidGraphics.destroy();
    }
  }

  private generateParticleTexture(): void {
    const particleGraphics = this.make.graphics({ x: 0, y: 0 });
    particleGraphics.fillStyle(0xffffff);
    particleGraphics.lineStyle(1, 0xeeeeee, 1);
    particleGraphics.fillCircle(2.5, 2.5, 2.5);
    particleGraphics.strokeCircle(2.5, 2.5, 2.5);
    particleGraphics.generateTexture("particle", 5, 5);
    particleGraphics.destroy();
  }

  create(): void {
    const config = this.game.config as SpaceDefenderGameConfig;
    const fontFamily =
      this.registry.get("fontFamily") ?? config.customFontFamily;
    if (fontFamily) this.registry.set("fontFamily", fontFamily);

    if (this.registry.get("vectorMode") === undefined) {
      this.registry.set("vectorMode", VectorMode.COLOR);
    }

    EventBus.emit("current-scene-ready", this);
    this.scene.start("Title");
  }
}
