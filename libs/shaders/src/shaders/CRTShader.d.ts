import type { Game, Renderer } from "phaser";
export declare class CRTShader extends Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game: Game);
  onBoot(): void;
  onPreRender(): void;
}
