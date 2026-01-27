import type { Scene } from "phaser";
import { VectorMode } from "../../../../../packages/shaders/src";

const VECTOR_MODE_KEY = "vectorMode";

export { VectorMode };

export function getVectorMode(scene: Scene): VectorMode {
  return (
    (scene.registry.get(VECTOR_MODE_KEY) as VectorMode) ?? VectorMode.COLOR
  );
}

export function setVectorMode(scene: Scene, mode: VectorMode): void {
  scene.registry.set(VECTOR_MODE_KEY, mode);
}

export function isColorMode(scene: Scene): boolean {
  return getVectorMode(scene) === VectorMode.COLOR;
}
