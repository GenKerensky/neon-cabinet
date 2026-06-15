import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { VectorMode } from "@neon-cabinet/shaders";
import { MarsLanderAudio } from "../audio/MarsLanderAudio";

const VECTOR_ASSET_DIMENSIONS = {
  flame: { width: 24, height: 40 },
  particle: { width: 5, height: 5 },
  star: { width: 4, height: 4 },
  landing_pad: { width: 100, height: 10 },
} as const;

export class Boot extends Scene {
  constructor() {
    super("Boot");
  }

  preload(): void {
    this.load.text("lander_svg", this.assetPath("assets/vector/lander.svg"));
    this.load.svg("flame", this.assetPath("assets/vector/flame.svg"), {
      ...VECTOR_ASSET_DIMENSIONS.flame,
    });
    this.load.svg("particle", this.assetPath("assets/vector/particle.svg"), {
      ...VECTOR_ASSET_DIMENSIONS.particle,
    });
    this.load.svg("star", this.assetPath("assets/vector/star.svg"), {
      ...VECTOR_ASSET_DIMENSIONS.star,
    });
    this.load.svg(
      "landing_pad",
      this.assetPath("assets/vector/landing-pad.svg"),
      {
        ...VECTOR_ASSET_DIMENSIONS.landing_pad,
      },
    );
    MarsLanderAudio.preload(this, (path) => this.assetPath(path));
  }

  create(): void {
    const fontFamily = (this.game.config as { customFontFamily?: string })
      .customFontFamily;
    if (fontFamily) this.registry.set("fontFamily", fontFamily);

    // Initialize vector mode to COLOR (default)
    if (this.registry.get("vectorMode") === undefined) {
      this.registry.set("vectorMode", VectorMode.COLOR);
    }

    EventBus.emit("current-scene-ready", this);
    this.scene.start("Title");
  }

  private assetPath(path: string): string {
    const customAssetBaseUrl =
      this.registry.get("assetBaseUrl") ??
      (this.game.config as { customAssetBaseUrl?: string }).customAssetBaseUrl;
    if (!customAssetBaseUrl) return path;

    const normalizedBase = customAssetBaseUrl.endsWith("/")
      ? customAssetBaseUrl
      : `${customAssetBaseUrl}/`;
    const normalizedPath = path.startsWith("assets/")
      ? path.slice("assets/".length)
      : path;
    return `${normalizedBase}${normalizedPath}`;
  }
}
