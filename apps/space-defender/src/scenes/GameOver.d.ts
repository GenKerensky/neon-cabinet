import { Scene } from "phaser";
export declare class GameOver extends Scene {
  private score;
  private isNewHighScore;
  constructor();
  init(data: { score: number }): void;
  create(): void;
}
