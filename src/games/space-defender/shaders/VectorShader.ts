import Phaser from "phaser";
import fragShaderSource from "./vector.frag?raw";
import { VectorMode } from "../utils/settings";

const fragShader = fragShaderSource;

export class VectorShader
  extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline
{
  constructor(game: Phaser.Game) {
    super({
      game,
      fragShader,
      name: "VectorShader",
    });
  }

  onBoot(): void {
    this.set1f("uTime", 0);
    this.set2f("uResolution", this.renderer.width, this.renderer.height);
    // Default to color mode
    const mode = this.game.registry.get("vectorMode") as VectorMode | undefined;
    this.set1f("uColorMode", mode ?? VectorMode.COLOR);
  }

  onPreRender(): void {
    this.set1f("uTime", this.game.loop.time / 1000);
    // Update color mode from registry
    const mode = this.game.registry.get("vectorMode") as VectorMode | undefined;
    this.set1f("uColorMode", mode ?? VectorMode.COLOR);
  }

  setColorMode(mode: VectorMode): void {
    // Only set if pipeline is ready (set1f is available)
    if (this.set1f) {
      this.set1f("uColorMode", mode);
    }
  }
}
