import { damageThreat, getAliveThreats, type Threat } from "../objects/Threats";
import type { ThreatKind } from "../rail/SegmentTypes";
import {
  finishSegment,
  getCurrentPhase,
  progressFinale,
  type RunState,
} from "./RunState";

export interface DestroyedThreat {
  id: string;
  kind: Threat["kind"];
  bountyValue: number;
}

export interface DamageThreatsResult {
  threats: Threat[];
  destroyed: DestroyedThreat[];
}

export type EncounterNextScene =
  | "continue"
  | "upgrade-shop"
  | "victory"
  | "game-over";

export interface ClearedEncounterResult {
  runState: RunState;
  phase: "segment" | "finale";
  nextScene: EncounterNextScene;
}

export function applyDamageToLeadThreat(
  threats: Threat[],
  damage: number,
): DamageThreatsResult {
  const target = getAliveThreats(threats)[0];
  if (target === undefined || damage <= 0 || !Number.isFinite(damage)) {
    return { threats, destroyed: [] };
  }

  const nextThreats = threats.map((threat) =>
    threat.id === target.id ? damageThreat(threat, damage) : threat,
  );
  const damagedTarget = nextThreats.find((threat) => threat.id === target.id);
  const wasDestroyed =
    target.health > 0 && damagedTarget !== undefined && damagedTarget.health <= 0;

  return {
    threats: nextThreats,
    destroyed: wasDestroyed
      ? [
          {
            id: target.id,
            kind: target.kind,
            bountyValue: target.bountyValue,
          },
        ]
      : [],
  };
}

export function getCombatThreatKinds(threatKinds: ThreatKind[]): ThreatKind[] {
  return threatKinds.filter((threatKind) => threatKind !== "debris");
}

export function resolveClearedEncounter(
  state: RunState,
): ClearedEncounterResult {
  if (state.status === "game-over") {
    return {
      runState: state,
      phase: getCurrentPhase(state),
      nextScene: "game-over",
    };
  }

  if (getCurrentPhase(state) === "segment") {
    const runState = finishSegment(state);
    return {
      runState,
      phase: getCurrentPhase(runState),
      nextScene: runState.status === "upgrade-shop" ? "upgrade-shop" : "continue",
    };
  }

  const runState = progressFinale(state);
  return {
    runState,
    phase: "finale",
    nextScene: runState.status === "victory" ? "victory" : "continue",
  };
}
