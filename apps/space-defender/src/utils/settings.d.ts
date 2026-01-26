import type { Scene } from "phaser";
import { VectorMode } from "@neon-cabinet/games-shared";
export { VectorMode };
export declare function getVectorMode(scene: Scene): VectorMode;
export declare function setVectorMode(scene: Scene, mode: VectorMode): void;
export declare function isColorMode(scene: Scene): boolean;
