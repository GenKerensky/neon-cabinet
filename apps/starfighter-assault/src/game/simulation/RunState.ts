export type RunStatus =
  | "playing"
  | "segment-checkpoint"
  | "upgrade-shop"
  | "victory"
  | "game-over";

export type FinaleStage =
  | "approach"
  | "surface-skim"
  | "weak-point-pass"
  | "escape"
  | "complete";

export interface RunState {
  seed: number;
  lives: number;
  currentSegmentIndex: number;
  status: RunStatus;
  bounties: number;
  shields: {
    current: number;
    max: number;
  };
  weapons: {
    torpedoes: number;
    torpedoCapacity: number;
  };
  finale: {
    stage: FinaleStage;
  };
}

const SEGMENTS_BEFORE_FINALE = 3;
const BASE_SHIELDS = 100;
const BASE_TORPEDOES = 3;

function isTerminalStatus(status: RunStatus): boolean {
  return status === "game-over" || status === "victory";
}

export function createInitialRunState(seed: number): RunState {
  return {
    seed,
    lives: 3,
    currentSegmentIndex: 0,
    status: "playing",
    bounties: 0,
    shields: {
      current: BASE_SHIELDS,
      max: BASE_SHIELDS,
    },
    weapons: {
      torpedoes: BASE_TORPEDOES,
      torpedoCapacity: BASE_TORPEDOES,
    },
    finale: {
      stage: "approach",
    },
  };
}

export function getCurrentPhase(state: RunState): "segment" | "finale" {
  return state.currentSegmentIndex >= SEGMENTS_BEFORE_FINALE
    ? "finale"
    : "segment";
}

export function damageShield(state: RunState, damage: number): RunState {
  if (isTerminalStatus(state.status)) {
    return state;
  }

  const damageAmount = Math.max(0, damage);
  const nextShield = state.shields.current - damageAmount;
  if (nextShield > 0) {
    return {
      ...state,
      shields: { ...state.shields, current: nextShield },
    };
  }

  const nextLives = Math.max(0, state.lives - 1);
  return {
    ...state,
    lives: nextLives,
    status: nextLives <= 0 ? "game-over" : "segment-checkpoint",
    shields: { ...state.shields, current: state.shields.max },
  };
}

export function finishSegment(state: RunState): RunState {
  if (getCurrentPhase(state) === "finale" || isTerminalStatus(state.status)) {
    return state;
  }

  const currentSegmentIndex = state.currentSegmentIndex + 1;
  return {
    ...state,
    currentSegmentIndex,
    status:
      currentSegmentIndex >= SEGMENTS_BEFORE_FINALE ? "playing" : "upgrade-shop",
  };
}

export function progressFinale(state: RunState): RunState {
  if (getCurrentPhase(state) !== "finale" || isTerminalStatus(state.status)) {
    return state;
  }

  const stageOrder: FinaleStage[] = [
    "approach",
    "surface-skim",
    "weak-point-pass",
    "escape",
    "complete",
  ];
  const currentIndex = stageOrder.indexOf(state.finale.stage);
  const nextStage = stageOrder[Math.min(currentIndex + 1, stageOrder.length - 1)];
  return {
    ...state,
    status: nextStage === "complete" ? "victory" : state.status,
    finale: { stage: nextStage },
  };
}
