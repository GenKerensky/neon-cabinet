import Phaser from "phaser";
export declare enum VectorMode {
  MONOCHROME = 0,
  COLOR = 1,
}
export declare class VectorShader
  extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline
{
  constructor(game: Phaser.Game);
  onBoot(): void;
  onPreRender(): void;
  setColorMode(mode: VectorMode): void;
}
