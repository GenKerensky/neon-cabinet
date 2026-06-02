export function wrapObject(
  obj: { x: number; y: number },
  width: number,
  height: number,
  padding = 20,
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
