import { Scene } from "phaser";
import { Ship } from "./Ship";

export interface Weapon {
  name: string;
  cooldown: number;
  unlockScore: number;
  textureKey: string;

  fire(
    scene: Scene,
    ship: Ship,
    targetX: number,
    targetY: number,
    onHitAsteroid?: (x: number, y: number) => void,
  ): void;

  update?(scene: Scene): void;
}
