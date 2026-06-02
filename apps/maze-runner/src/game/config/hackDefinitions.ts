export enum HackPickupId {
  PHASE_CHIP = "phase-chip",
  DECOY_SPARK = "decoy-spark",
  REVERSE_PULSE = "reverse-pulse",
  OVERCLOCK_PELLET = "overclock-pellet",
  SHIELD_RING = "shield-ring",
  SCORE_MAGNET = "score-magnet",
  GHOST_JAMMER = "ghost-jammer",
  GATE_KEY = "gate-key",
}

export interface HackPickupDefinition {
  id: HackPickupId;
  svgCacheKey: string;
  assetPath: string;
  displayName: string;
  shortName: string;
  durationMs: number;
  color: string;
  description: string;
}

export const hackPickupDefinitions: readonly HackPickupDefinition[] = [
  {
    id: HackPickupId.PHASE_CHIP,
    svgCacheKey: "hack_phase_chip_svg",
    assetPath: "assets/vector/hacks/phase-chip.svg",
    displayName: "Phase Chip",
    shortName: "PHASE",
    durationMs: 4000,
    color: "#58f7ff",
    description: "Breach one wall in your current direction.",
  },
  {
    id: HackPickupId.DECOY_SPARK,
    svgCacheKey: "hack_decoy_spark_svg",
    assetPath: "assets/vector/hacks/decoy-spark.svg",
    displayName: "Decoy Spark",
    shortName: "DECOY",
    durationMs: 5000,
    color: "#ff66dd",
    description: "Drop a fake player signal that confuses ghosts.",
  },
  {
    id: HackPickupId.REVERSE_PULSE,
    svgCacheKey: "hack_reverse_pulse_svg",
    assetPath: "assets/vector/hacks/reverse-pulse.svg",
    displayName: "Reverse Pulse",
    shortName: "REV",
    durationMs: 2000,
    color: "#fff266",
    description: "Reverse nearby ghosts and scatter their routes.",
  },
  {
    id: HackPickupId.OVERCLOCK_PELLET,
    svgCacheKey: "hack_overclock_pellet_svg",
    assetPath: "assets/vector/hacks/overclock-pellet.svg",
    displayName: "Overclock Pellet",
    shortName: "CLOCK",
    durationMs: 5000,
    color: "#ff9b42",
    description: "Boost player speed, then provoke a ghost surge.",
  },
  {
    id: HackPickupId.SHIELD_RING,
    svgCacheKey: "hack_shield_ring_svg",
    assetPath: "assets/vector/hacks/shield-ring.svg",
    displayName: "Shield Ring",
    shortName: "SHIELD",
    durationMs: 10000,
    color: "#76ff7a",
    description: "Absorb one lethal hit and stun nearby ghosts.",
  },
  {
    id: HackPickupId.SCORE_MAGNET,
    svgCacheKey: "hack_score_magnet_svg",
    assetPath: "assets/vector/hacks/score-magnet.svg",
    displayName: "Score Magnet",
    shortName: "MAGNET",
    durationMs: 6000,
    color: "#ffffff",
    description: "Pull nearby score dots and pellets toward you.",
  },
  {
    id: HackPickupId.GHOST_JAMMER,
    svgCacheKey: "hack_ghost_jammer_svg",
    assetPath: "assets/vector/hacks/ghost-jammer.svg",
    displayName: "Ghost Jammer",
    shortName: "JAM",
    durationMs: 5000,
    color: "#9f7cff",
    description: "Scramble living ghost targeting.",
  },
  {
    id: HackPickupId.GATE_KEY,
    svgCacheKey: "hack_gate_key_svg",
    assetPath: "assets/vector/hacks/gate-key.svg",
    displayName: "Gate Key",
    shortName: "GATE",
    durationMs: 5000,
    color: "#5cff9d",
    description: "Toggle the ghost pen gate for a short window.",
  },
] as const;

export const hackPickupIds = hackPickupDefinitions.map(({ id }) => id);

export const getHackPickupDefinition = (
  id: HackPickupId,
): HackPickupDefinition => {
  const definition = hackPickupDefinitions.find((hack) => hack.id === id);
  if (!definition) throw new Error(`Unknown hack pickup: ${id}`);
  return definition;
};
