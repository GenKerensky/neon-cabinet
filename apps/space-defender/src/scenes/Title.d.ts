import Phaser from "phaser";
export declare class Title extends Phaser.Scene {
  private stars;
  private titleText;
  private subtitleText;
  private startText;
  private floatingAsteroids;
  private shipPreview;
  private particles;
  constructor();
  create(): void;
  private createStarField;
  private createFloatingAsteroids;
  private createAmbientParticles;
  update(_time: number, delta: number): void;
}
