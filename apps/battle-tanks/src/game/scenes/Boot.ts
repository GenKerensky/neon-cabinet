import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { VectorMode } from "../../../../../packages/shaders/src";

export class Boot extends Scene {
  constructor() {
    super("Boot");
  }

  preload(): void {
    this.createParticleTexture();
  }

  private createParticleTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffffff);
    g.lineStyle(1, 0xeeeeee, 1);
    g.fillCircle(2.5, 2.5, 2.5);
    g.strokeCircle(2.5, 2.5, 2.5);
    g.generateTexture("particle", 5, 5);
    g.destroy();
  }

  create(): void {
    const fontFamily = (this.game.config as { customFontFamily?: string })
      .customFontFamily;
    if (fontFamily) this.registry.set("fontFamily", fontFamily);

    if (this.registry.get("vectorMode") === undefined) {
      this.registry.set("vectorMode", VectorMode.COLOR);
    }

    EventBus.emit("current-scene-ready", this);
    this.scene.start("Title");
  }
}
