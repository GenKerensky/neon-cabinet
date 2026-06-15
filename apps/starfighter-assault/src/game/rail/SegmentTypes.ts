export type SegmentRole =
  | "approach"
  | "battery-field"
  | "interceptor-screen"
  | "debris-corridor"
  | "trench-run";

export type ThreatKind =
  | "fighter"
  | "elite-fighter"
  | "mine"
  | "turret"
  | "shield-node"
  | "gun-emplacement"
  | "debris";

export type PickupKind = "torpedo" | "shield" | "bounty-cache";

export interface SegmentConstraints {
  maxSimultaneousThreats: number;
  guaranteedDodgeLanes: number;
  routeCurvature: number;
  maxRouteCurvature: number;
  flightBoxWidth: number;
  flightBoxHeight: number;
}

export interface SegmentPickup {
  kind: PickupKind;
  lane: number;
  inForcedDamageLane: boolean;
}

export interface GeneratedSegment {
  id: string;
  role: SegmentRole;
  label: string;
  allowedThreats: ThreatKind[];
  constraints: SegmentConstraints;
  pickups: SegmentPickup[];
  bountyOpportunities: number;
}

export interface BranchChoice {
  segmentId: string;
  label: string;
  risk: "low" | "medium" | "high";
  reward: "shield" | "torpedo" | "bounty" | "elite";
}

export interface GeneratedSortie {
  seed: number;
  difficulty: number;
  segments: GeneratedSegment[];
  branches: [BranchChoice[], BranchChoice[]];
  finale: {
    kind: "capital-ship";
    label: string;
  };
}
