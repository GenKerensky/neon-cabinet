export type BountyTargetKind =
  | "fighter"
  | "elite-fighter"
  | "turret"
  | "gun-emplacement"
  | "shield-node"
  | "capital-subsystem"
  | "bounty-cache";

export interface BountyState {
  total: number;
  streakMultiplier: number;
  lastAwardAt: number | null;
}

export interface BountyAwardResult {
  state: BountyState;
  awarded: number;
  multiplier: number;
}

const STREAK_WINDOW_MS = 2_500;
const STREAK_STEP = 0.1;
const MAX_STREAK_MULTIPLIER = 1.5;

const BOUNTY_REWARDS: Record<BountyTargetKind, number> = {
  fighter: 20,
  "elite-fighter": 45,
  turret: 40,
  "gun-emplacement": 50,
  "shield-node": 75,
  "capital-subsystem": 120,
  "bounty-cache": 100,
};

export function createBountyState(): BountyState {
  return {
    total: 0,
    streakMultiplier: 1,
    lastAwardAt: null,
  };
}

export function awardBounty(
  state: BountyState,
  targetKind: BountyTargetKind,
  awardedAt: number,
): BountyAwardResult {
  const awardDelta =
    state.lastAwardAt === null ? null : awardedAt - state.lastAwardAt;
  const isStreak =
    awardDelta !== null && awardDelta >= 0 && awardDelta <= STREAK_WINDOW_MS;
  const streakMultiplier = isStreak
    ? Math.min(MAX_STREAK_MULTIPLIER, state.streakMultiplier + STREAK_STEP)
    : 1;
  const awarded = Math.round(BOUNTY_REWARDS[targetKind] * streakMultiplier);

  return {
    state: {
      total: state.total + awarded,
      streakMultiplier,
      lastAwardAt:
        state.lastAwardAt === null
          ? awardedAt
          : Math.max(state.lastAwardAt, awardedAt),
    },
    awarded,
    multiplier: streakMultiplier,
  };
}
