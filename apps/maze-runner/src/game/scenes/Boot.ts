import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { ghostDefinitions } from "../config/ghostDefinitions";
import { VectorMode } from "../utils/settings";

export class Boot extends Scene {
  constructor() {
    super("Boot");
  }

  preload(): void {
    this.load.text("player_svg", "assets/vector/player.svg");
    for (const definition of ghostDefinitions) {
      this.load.text(definition.svgCacheKey, definition.assetPath);
    }
    this.load.audio("maze_runner_move", "assets/audio/player-move.wav");
    this.load.audio("maze_runner_pellet", "assets/audio/pellet.wav");
    this.load.audio(
      "maze_runner_power_pellet",
      "assets/audio/power-pellet.wav",
    );
    this.load.audio("maze_runner_death", "assets/audio/player-death.wav");
    this.load.audio(
      "maze_runner_ghost_vulnerable",
      "assets/audio/ghost-vulnerable.wav",
    );
    this.load.audio("maze_runner_ghost_eaten", "assets/audio/ghost-eaten.wav");
    this.generateCollectibleTextures();
  }

  private generateCollectibleTextures(): void {
    const dotG = this.make.graphics({ x: 0, y: 0 });
    dotG.fillStyle(0xffffcc, 1);
    dotG.fillCircle(3, 3, 2);
    dotG.generateTexture("dot", 6, 6);
    dotG.destroy();

    const ppG = this.make.graphics({ x: 0, y: 0 });
    ppG.fillStyle(0xffffcc, 1);
    ppG.fillCircle(8, 8, 6);
    ppG.lineStyle(1, 0xffffff, 0.8);
    ppG.strokeCircle(8, 8, 6);
    ppG.generateTexture("power_pellet", 16, 16);
    ppG.destroy();

    const bonusG = this.make.graphics({ x: 0, y: 0 });
    const bSize = 32;
    const bCx = bSize / 2;
    const bCy = bSize / 2 + 2;

    bonusG.fillStyle(0x000000, 1);
    bonusG.fillCircle(bCx, bCy, 12);

    bonusG.fillStyle(0xff0000, 1);
    bonusG.fillCircle(bCx, bCy, 10);

    bonusG.lineStyle(2, 0x00ff00, 1);
    bonusG.lineBetween(bCx, bCy - 10, bCx + 2, bCy - 15);

    bonusG.fillStyle(0x00ff00, 1);
    bonusG.fillCircle(bCx + 4, bCy - 14, 3);

    bonusG.fillStyle(0xff8888, 1);
    bonusG.fillCircle(bCx - 3, bCy - 4, 3);

    bonusG.generateTexture("bonus_item", bSize, bSize);
    bonusG.destroy();

    const wallG = this.make.graphics({ x: 0, y: 0 });
    wallG.lineStyle(2, 0x0000ff, 1);
    wallG.lineBetween(0, 15, 30, 15);
    wallG.lineStyle(1, 0x4444ff, 0.5);
    wallG.lineBetween(0, 13, 30, 13);
    wallG.lineBetween(0, 17, 30, 17);
    wallG.generateTexture("wall_h", 30, 30);
    wallG.destroy();

    const wallVG = this.make.graphics({ x: 0, y: 0 });
    wallVG.lineStyle(2, 0x0000ff, 1);
    wallVG.lineBetween(15, 0, 15, 30);
    wallVG.lineStyle(1, 0x4444ff, 0.5);
    wallVG.lineBetween(13, 0, 13, 30);
    wallVG.lineBetween(17, 0, 17, 30);
    wallVG.generateTexture("wall_v", 30, 30);
    wallVG.destroy();
  }

  create(): void {
    this.cameras.main.setPostPipeline("VectorShader");
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
