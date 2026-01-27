import type { Physics } from "phaser";

export function wrapObject(
  obj: Physics.Arcade.Sprite,
  width: number,
  height: number,
  padding: number = 20,
): void {
  if (obj.x < -padding) {
    obj.x = width + padding;
  } else if (obj.x > width + padding) {
    obj.x = -padding;
  }

  if (obj.y < -padding) {
    obj.y = height + padding;
  } else if (obj.y > height + padding) {
    obj.y = -padding;
  }
}
