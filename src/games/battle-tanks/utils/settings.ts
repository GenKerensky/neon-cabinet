/**
 * Game settings and constants for Battle Tanks
 */
export const GAME_SETTINGS = {
  width: 1600,
  height: 1200,

  focalLength: 400,
  eyeHeight: 50,
  nearClip: 10,
  farClip: 5000,

  maxSpeed: 150,
  maxReverseSpeed: 80,
  acceleration: 200,
  deceleration: 300,
  rotationSpeed: 1.5,

  gridSize: 200,
  gridExtent: 4000,
  mountainDistance: 4000,

  colors: {
    player: 0x00ff00,
    enemy: 0xff0000,
    obstacle: 0x00ffff,
    terrain: 0x00aa00,
    projectile: 0xffff00,
    mountains: 0x006600,
    grid: 0x004400,
    hud: 0x00ff00,
    horizon: 0x004400,
  },
};
