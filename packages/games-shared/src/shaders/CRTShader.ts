import Phaser from "phaser";
import fragShaderSource from "./crt.frag?raw";

const fragShader = fragShaderSource;

export class CRTShader extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game: Phaser.Game) {
    super({
      game,
      fragShader,
      name: "CRTShader",
    });
  }

  onBoot(): void {
    this.set1f("uTime", 0);
    this.set2f("uResolution", this.renderer.width, this.renderer.height);
  }

  onPreRender(): void {
    this.set1f("uTime", this.game.loop.time / 1000);
  }
}
