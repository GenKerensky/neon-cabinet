export enum DamageLevel {
  NONE = 0, // Green outline
  DAMAGED = 1, // Yellow outline
  CRITICAL = 2, // Red outline
  DESTROYED = 3, // Dead
}

export interface TankDamageState {
  front: DamageLevel;
  rear: DamageLevel;
  left: DamageLevel;
  right: DamageLevel;
}

export type TankSection = "front" | "rear" | "left" | "right";

export function createInitialDamageState(): TankDamageState {
  return {
    front: DamageLevel.NONE,
    rear: DamageLevel.NONE,
    left: DamageLevel.NONE,
    right: DamageLevel.NONE,
  };
}

export function getDamageColor(level: DamageLevel): number {
  switch (level) {
    case DamageLevel.NONE:
      return 0x00ff00; // Green
    case DamageLevel.DAMAGED:
      return 0xffff00; // Yellow
    case DamageLevel.CRITICAL:
      return 0xff0000; // Red
    case DamageLevel.DESTROYED:
      return 0x440000; // Dark red
    default:
      return 0x00ff00;
  }
}
