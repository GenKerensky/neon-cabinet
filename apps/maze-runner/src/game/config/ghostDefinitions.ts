export type GhostArchetype =
  | "chaser"
  | "ambusher"
  | "wanderer"
  | "timid"
  | "sentinel"
  | "trickster";

export type GhostScatterTarget =
  | {
      kind: "corner";
      corner: "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
    }
  | {
      kind: "edge";
      edge: "top" | "bottom" | "left" | "right";
      anchor: "center";
    };

export interface GhostBehaviorKnobs {
  speedMultiplier: number;
  aggression: number;
  caution: number;
  ambusherPredictionCells?: number;
  wandererVectorScale?: number;
  timidDistanceThreshold?: number;
}

export interface GhostDefinition {
  id: string;
  svgCacheKey: string;
  assetPath: string;
  displayName: string;
  personality: string;
  catchPhrase: string;
  progressionOrder: number;
  spawnOffset: { x: number; y: number };
  scatterTarget: GhostScatterTarget;
  archetype: GhostArchetype;
  behavior: GhostBehaviorKnobs;
}

export interface GhostAiProfile {
  speed: number;
  ambusherPredictionCells: number;
  wandererVectorScale: number;
  timidDistanceThreshold: number;
}

export interface GhostGameOverCopy {
  headline: string;
  subline: string;
}

const ghostDeathVerbsByArchetype: Record<GhostArchetype, string> = {
  chaser: "Caught",
  ambusher: "Jumped",
  wanderer: "Tracked",
  timid: "Cornered",
  sentinel: "Stopped",
  trickster: "Tricked",
};

export const ghostDefinitions: readonly GhostDefinition[] = [
  {
    id: "chaser",
    svgCacheKey: "ghost_chaser_svg",
    assetPath: "assets/vector/ghosts/chaser.svg",
    displayName: "Blitz",
    personality: "relentless hunter",
    catchPhrase: "No corners left.",
    progressionOrder: 6,
    spawnOffset: { x: -1, y: 0 },
    scatterTarget: { kind: "corner", corner: "topRight" },
    archetype: "chaser",
    behavior: { speedMultiplier: 1.1, aggression: 1, caution: 0.15 },
  },
  {
    id: "ambusher",
    svgCacheKey: "ghost_ambusher_svg",
    assetPath: "assets/vector/ghosts/ambusher.svg",
    displayName: "Vanta",
    personality: "predictive tactician",
    catchPhrase: "I’m already where you’re heading.",
    progressionOrder: 5,
    spawnOffset: { x: 0, y: 0 },
    scatterTarget: { kind: "corner", corner: "topLeft" },
    archetype: "ambusher",
    behavior: {
      speedMultiplier: 1.05,
      aggression: 0.9,
      caution: 0.2,
      ambusherPredictionCells: 5,
    },
  },
  {
    id: "wanderer",
    svgCacheKey: "ghost_wanderer_svg",
    assetPath: "assets/vector/ghosts/wanderer.svg",
    displayName: "Luma",
    personality: "cautious drifter",
    catchPhrase: "Every detour is a plan.",
    progressionOrder: 2,
    spawnOffset: { x: 1, y: 0 },
    scatterTarget: { kind: "corner", corner: "bottomRight" },
    archetype: "wanderer",
    behavior: {
      speedMultiplier: 0.95,
      aggression: 0.45,
      caution: 0.35,
      wandererVectorScale: 2,
    },
  },
  {
    id: "timid",
    svgCacheKey: "ghost_timid_svg",
    assetPath: "assets/vector/ghosts/timid.svg",
    displayName: "Mote",
    personality: "jittery opportunist",
    catchPhrase: "Close enough, then gone.",
    progressionOrder: 1,
    spawnOffset: { x: 0, y: 1 },
    scatterTarget: { kind: "corner", corner: "bottomLeft" },
    archetype: "timid",
    behavior: {
      speedMultiplier: 0.85,
      aggression: 0.2,
      caution: 1,
      timidDistanceThreshold: 10,
    },
  },
  {
    id: "sentinel",
    svgCacheKey: "ghost_sentinel_svg",
    assetPath: "assets/vector/ghosts/sentinel.svg",
    displayName: "Aegis",
    personality: "territorial watcher",
    catchPhrase: "Hold the line.",
    progressionOrder: 4,
    spawnOffset: { x: -2, y: 1 },
    scatterTarget: { kind: "edge", edge: "top", anchor: "center" },
    archetype: "sentinel",
    behavior: {
      speedMultiplier: 0.9,
      aggression: 0.6,
      caution: 0.65,
      ambusherPredictionCells: 3,
    },
  },
  {
    id: "trickster",
    svgCacheKey: "ghost_trickster_svg",
    assetPath: "assets/vector/ghosts/trickster.svg",
    displayName: "Jinx",
    personality: "chaotic flanker",
    catchPhrase: "You looked the wrong way.",
    progressionOrder: 3,
    spawnOffset: { x: 2, y: 1 },
    scatterTarget: { kind: "edge", edge: "bottom", anchor: "center" },
    archetype: "trickster",
    behavior: {
      speedMultiplier: 1,
      aggression: 0.7,
      caution: 0.4,
      wandererVectorScale: 3,
    },
  },
] as const;

export function getActiveGhostDefinitionsForLevel(
  level: number,
): GhostDefinition[] {
  const normalizedLevel = Math.max(1, Math.floor(level));
  const activeCount = Math.min(
    ghostDefinitions.length,
    3 + Math.floor((normalizedLevel - 1) / 2),
  );
  return [...ghostDefinitions]
    .sort((a, b) => a.progressionOrder - b.progressionOrder)
    .slice(0, activeCount);
}

export function buildGhostAiProfile(
  definition: GhostDefinition,
): GhostAiProfile {
  const { behavior } = definition;
  return {
    speed: 80 * behavior.speedMultiplier,
    ambusherPredictionCells:
      behavior.ambusherPredictionCells ??
      Math.max(2, Math.round(2 + behavior.aggression * 3)),
    wandererVectorScale:
      behavior.wandererVectorScale ??
      Math.max(1, Math.round(1 + behavior.aggression * 2)),
    timidDistanceThreshold:
      behavior.timidDistanceThreshold ??
      Math.max(3, Math.round(5 + behavior.caution * 6)),
  };
}

export function getGhostDefinitionById(
  id: string,
): GhostDefinition | undefined {
  return ghostDefinitions.find((ghost) => ghost.id === id);
}

export function buildGhostGameOverCopy(
  definition: GhostDefinition,
): GhostGameOverCopy {
  const verb = ghostDeathVerbsByArchetype[definition.archetype] ?? "Caught";
  return {
    headline: `${verb} by ${definition.displayName}!`,
    subline: `${definition.personality} — “${definition.catchPhrase}”`,
  };
}
