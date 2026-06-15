import type { ThreatKind } from "../rail/SegmentTypes";

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

export function createThreatWave(
  kinds: ThreatKind[],
  difficulty: number,
): Threat[] {
  const centerOffset = (kinds.length - 1) / 2;

  return kinds.map((kind, index) => ({
    id: `${kind}-${index + 1}`,
    kind,
    health: HEALTH_BY_KIND[kind] + difficulty * 5,
    bountyValue: kind === "debris" ? 0 : 25 + difficulty * 10,
    x: (index - centerOffset) * 180,
    y: 0,
    z: 900 + index * 220,
    threat: kind === "elite-fighter" || kind === "gun-emplacement" ? 0.9 : 0.5,
  }));
}

export function damageThreat(threat: Threat, damage: number): Threat {
  return {
    ...threat,
    health: Math.max(0, threat.health - damage),
  };
}

export function getAliveThreats(threats: Threat[]): Threat[] {
  return threats.filter((threat) => threat.health > 0);
}
