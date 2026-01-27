import type { Game, Renderer } from "phaser";
export declare enum VectorMode {
  MONOCHROME = 0,
  COLOR = 1,
}
export declare class VectorShader
  extends Renderer.WebGL.Pipelines.PostFXPipeline
{
  constructor(game: Game);
  onBoot(): void;
  onPreRender(): void;
  setColorMode(mode: VectorMode): void;
}
