import type { ThreatKind } from "../rail/SegmentTypes";
import {
  getBaseBountyValue,
  type BountyTargetKind,
} from "../simulation/Bounties";

export interface Threat {
  id: string;
  kind: ThreatKind;
  health: number;
  bountyValue: number;
  x: number;
  y: number;
  z: number;
  threat: number;
}

const HEALTH_BY_KIND: Record<ThreatKind, number> = {
  fighter: 20,
  "elite-fighter": 45,
  mine: 10,
  turret: 35,
  "shield-node": 60,
  "gun-emplacement": 50,
  debris: 999,
};

const BOUNTY_TARGET_BY_KIND: Partial<Record<ThreatKind, BountyTargetKind>> = {
  fighter: "fighter",
  "elite-fighter": "elite-fighter",
  turret: "turret",
  "shield-node": "shield-node",
  "gun-emplacement": "gun-emplacement",
};

export function createThreatWave(
  kinds: ThreatKind[],
  difficulty: number,
): Threat[] {
  const normalizedDifficulty = normalizeDifficulty(difficulty);
  const centerOffset = (kinds.length - 1) / 2;

  return kinds.map((kind, index) => ({
    id: `${kind}-${index + 1}`,
    kind,
    health: HEALTH_BY_KIND[kind] + normalizedDifficulty * 5,
    bountyValue: getThreatBountyValue(kind),
    x: (index - centerOffset) * 180,
    y: 0,
    z: 900 + index * 220,
    threat: kind === "elite-fighter" || kind === "gun-emplacement" ? 0.9 : 0.5,
  }));
}

export function damageThreat(threat: Threat, damage: number): Threat {
  const normalizedDamage =
    Number.isFinite(damage) && damage > 0 ? damage : 0;

  return {
    ...threat,
    health: Math.max(0, threat.health - normalizedDamage),
  };
}

export function getAliveThreats(threats: Threat[]): Threat[] {
  return threats.filter((threat) => threat.health > 0);
}

function getThreatBountyValue(kind: ThreatKind): number {
  const bountyTarget = BOUNTY_TARGET_BY_KIND[kind];
  return bountyTarget === undefined ? 0 : getBaseBountyValue(bountyTarget);
}

function normalizeDifficulty(difficulty: number): number {
  if (!Number.isFinite(difficulty)) {
    return 1;
  }

  return Math.min(9, Math.max(1, Math.floor(difficulty)));
}
