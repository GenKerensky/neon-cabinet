import Phaser from "phaser";
export declare class CRTShader
  extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline
{
  constructor(game: Phaser.Game);
  onBoot(): void;
  onPreRender(): void;
}
