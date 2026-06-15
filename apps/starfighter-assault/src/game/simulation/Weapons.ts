export interface WeaponsState {
  laserHeat: number;
  laserDamage: number;
  torpedoes: number;
  torpedoCapacity: number;
}

export type LaserCannon = "left-cannon" | "right-cannon";

export interface AimPoint {
  x: number;
  y: number;
}

export interface LaserShot {
  cannon: LaserCannon;
  target: AimPoint;
  damage: number;
}

export interface LaserFireResult {
  state: WeaponsState;
  shots: LaserShot[];
}

export interface TorpedoFireResult {
  state: WeaponsState;
  fired: boolean;
  damage: number;
}

const BASE_LASER_DAMAGE = 10;
const BASE_TORPEDOES = 3;
const LASER_HEAT_PER_VOLLEY = 10;
const MAX_LASER_HEAT = 100;
const TORPEDO_DAMAGE = 90;

export function createWeaponsState(): WeaponsState {
  return {
    laserHeat: 0,
    laserDamage: BASE_LASER_DAMAGE,
    torpedoes: BASE_TORPEDOES,
    torpedoCapacity: BASE_TORPEDOES,
  };
}

export function fireLaser(
  state: WeaponsState,
  target: AimPoint,
): LaserFireResult {
  return {
    state: {
      ...state,
      laserHeat: Math.min(
        MAX_LASER_HEAT,
        state.laserHeat + LASER_HEAT_PER_VOLLEY,
      ),
    },
    shots: [
      {
        cannon: "left-cannon",
        target: { ...target },
        damage: state.laserDamage,
      },
      {
        cannon: "right-cannon",
        target: { ...target },
        damage: state.laserDamage,
      },
    ],
  };
}

export function fireTorpedo(state: WeaponsState): TorpedoFireResult {
  if (state.torpedoes <= 0) {
    return {
      state: { ...state, torpedoes: 0 },
      fired: false,
      damage: 0,
    };
  }

  return {
    state: {
      ...state,
      torpedoes: state.torpedoes - 1,
    },
    fired: true,
    damage: TORPEDO_DAMAGE,
  };
}
