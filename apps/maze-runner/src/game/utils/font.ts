import type { Scene } from "phaser";

const FONT_KEY = "fontFamily";

export function getFontFamily(scene: Scene): string {
  return (scene.registry.get(FONT_KEY) as string) ?? "Orbitron";
}
