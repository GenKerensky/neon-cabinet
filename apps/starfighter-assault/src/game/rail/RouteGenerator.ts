import type {
  BranchChoice,
  GeneratedSegment,
  GeneratedSortie,
  PickupKind,
  SegmentRole,
  ThreatKind,
} from "./SegmentTypes";

interface GenerateSortieOptions {
  seed: number;
  difficulty: number;
}

const ROLE_ORDER: SegmentRole[] = [
  "approach",
  "battery-field",
  "interceptor-screen",
  "debris-corridor",
  "trench-run",
];

const ROLE_THREATS: Record<SegmentRole, ThreatKind[]> = {
  approach: ["fighter", "mine"],
  "battery-field": ["turret", "gun-emplacement", "fighter"],
  "interceptor-screen": ["fighter", "elite-fighter"],
  "debris-corridor": ["debris", "mine", "fighter"],
  "trench-run": ["turret", "shield-node", "gun-emplacement"],
};

const ROLE_PICKUPS: Record<SegmentRole, PickupKind[]> = {
  approach: ["shield", "bounty-cache"],
  "battery-field": ["bounty-cache"],
  "interceptor-screen": ["torpedo", "bounty-cache"],
  "debris-corridor": ["torpedo", "shield"],
  "trench-run": ["bounty-cache", "torpedo"],
};

export function generateSortie(options: GenerateSortieOptions): GeneratedSortie {
  const random = createSeededRandom(options.seed);
  const roles = pickRoles(random);
  const difficulty = normalizeDifficulty(options.difficulty);
  const segments = roles.map((role, index) =>
    createSegment(role, index, difficulty, random),
  );

  return {
    seed: options.seed,
    difficulty,
    segments,
    branches: [
      createBranches(segments[1], segments[2]),
      createFinalSegmentBranches(segments[2]),
    ],
    finale: {
      kind: "capital-ship",
      label: "Capital Ship: Obsidian Crown",
    },
  };
}

function pickRoles(random: () => number): SegmentRole[] {
  const first = "approach";
  const second = ROLE_ORDER[1 + Math.floor(random() * 3)];
  const thirdCandidates = ROLE_ORDER.slice(2).filter((role) => role !== second);
  const third =
    thirdCandidates[Math.floor(random() * thirdCandidates.length)] ??
    "trench-run";
  return [first, second, third];
}

function createSegment(
  role: SegmentRole,
  index: number,
  difficulty: number,
  random: () => number,
): GeneratedSegment {
  const pressure = difficulty + index + 2;
  const maxRouteCurvature = role === "trench-run" ? 0.45 : 0.65;
  const routeCurvature = round(Math.min(maxRouteCurvature, random() * 0.5 + 0.1));
  const pickupKinds = ROLE_PICKUPS[role];
  return {
    id: `${index + 1}-${role}`,
    role,
    label: formatRoleLabel(role),
    allowedThreats: [...ROLE_THREATS[role]],
    constraints: {
      maxSimultaneousThreats: clamp(pressure, 3, 8),
      guaranteedDodgeLanes: role === "trench-run" ? 1 : 2,
      routeCurvature,
      maxRouteCurvature,
      flightBoxWidth: role === "trench-run" ? 420 : 620,
      flightBoxHeight: role === "trench-run" ? 260 : 380,
    },
    pickups: pickupKinds.map((kind, pickupIndex) => ({
      kind,
      lane: pickupIndex - 1,
      inForcedDamageLane: false,
    })),
    bountyOpportunities: role === "debris-corridor" ? 1 : 2 + index,
  };
}

function createBranches(
  left: GeneratedSegment,
  right: GeneratedSegment,
): BranchChoice[] {
  return [
    {
      segmentId: left.id,
      label: `${left.label}: ${rewardLabel(left.role)}`,
      risk: left.role === "debris-corridor" ? "low" : "medium",
      reward: rewardKind(left.role),
    },
    {
      segmentId: right.id,
      label: `${right.label}: ${rewardLabel(right.role)}`,
      risk: right.role === "trench-run" ? "high" : "medium",
      reward: rewardKind(right.role),
    },
  ];
}

function createFinalSegmentBranches(segment: GeneratedSegment): BranchChoice[] {
  return [
    {
      segmentId: segment.id,
      label: `${segment.label}: ${rewardLabel(segment.role)}`,
      risk: segment.role === "trench-run" ? "high" : "medium",
      reward: rewardKind(segment.role),
    },
    {
      segmentId: segment.id,
      label: `${segment.label}: Clean Attack Vector`,
      risk: "medium",
      reward: "shield",
    },
  ];
}

function rewardKind(role: SegmentRole): BranchChoice["reward"] {
  if (role === "debris-corridor") return "torpedo";
  if (role === "battery-field" || role === "trench-run") return "bounty";
  if (role === "interceptor-screen") return "elite";
  return "shield";
}

function rewardLabel(role: SegmentRole): string {
  const reward = rewardKind(role);
  if (reward === "torpedo") return "Torpedo Cache";
  if (reward === "bounty") return "High Bounty";
  if (reward === "elite") return "Elite Ace";
  return "Shield Boost";
}

function formatRoleLabel(role: SegmentRole): string {
  return role
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function createSeededRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

function normalizeDifficulty(difficulty: number): number {
  if (!Number.isFinite(difficulty)) {
    return 1;
  }
  return clamp(Math.floor(difficulty), 1, 9);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
