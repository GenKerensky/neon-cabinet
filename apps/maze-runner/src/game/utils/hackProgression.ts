import { HackPickupId } from "../config/hackDefinitions";

export const MAZE_RUNNER_BYTES_KEY = "mazeRunnerBytes";
export const MAZE_RUNNER_UNLOCKS_KEY = "mazeRunnerHackUnlocks";
export const MAZE_RUNNER_ACHIEVEMENTS_KEY = "mazeRunnerAchievements";
export const MAZE_RUNNER_USED_HACKS_KEY = "mazeRunnerUsedHackTypes";

export type HackUpgradeId =
  | "spawn-chance"
  | "longer-duration"
  | "stronger-shield"
  | "magnet-pull";

export type HackAchievementId =
  | "first-hack-used"
  | "clear-level-holding-hack"
  | "eat-3-ghosts-power-window"
  | "shield-save"
  | "clear-level-no-lives-lost"
  | "earn-5000-score"
  | "use-every-hack-type";

export interface HackUpgradeDefinition {
  id: HackUpgradeId;
  name: string;
  cost: number;
  description: string;
}

export interface HackProgression {
  bytes: number;
  unlocks: HackUpgradeId[];
  achievements: HackAchievementId[];
  usedHackTypes: HackPickupId[];
}

const storageAvailable = (): Storage | undefined => {
  if (typeof localStorage === "undefined") return undefined;
  return localStorage;
};

const readNumber = (key: string): number => {
  const storage = storageAvailable();
  if (!storage) return 0;
  const value = Number.parseInt(storage.getItem(key) ?? "0", 10);
  return Number.isFinite(value) && value > 0 ? value : 0;
};

const readArray = <T extends string>(
  key: string,
  allowed: readonly T[],
): T[] => {
  const storage = storageAvailable();
  if (!storage) return [];
  try {
    const parsed: unknown = JSON.parse(storage.getItem(key) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    const allowedSet = new Set<string>(allowed);
    return parsed.filter(
      (value): value is T => typeof value === "string" && allowedSet.has(value),
    );
  } catch {
    return [];
  }
};

const writeArray = <T extends string>(
  key: string,
  value: readonly T[],
): void => {
  try {
    storageAvailable()?.setItem(key, JSON.stringify([...new Set(value)]));
  } catch {
    /* localStorage may be unavailable or full; progression fails closed. */
  }
};

const writeBytes = (bytes: number): void => {
  try {
    storageAvailable()?.setItem(
      MAZE_RUNNER_BYTES_KEY,
      String(Math.max(0, bytes)),
    );
  } catch {
    /* localStorage may be unavailable or full; progression fails closed. */
  }
};

export const hackUpgradeDefinitions: readonly HackUpgradeDefinition[] = [
  {
    id: "spawn-chance",
    name: "Signal Seeder",
    cost: 15,
    description: "More hack pickups appear in future mazes.",
  },
  {
    id: "longer-duration",
    name: "Longer Trace",
    cost: 10,
    description: "Temporary hacks last longer.",
  },
  {
    id: "stronger-shield",
    name: "Shield Bloom",
    cost: 20,
    description: "Shield saves stun ghosts in a wider pulse.",
  },
  {
    id: "magnet-pull",
    name: "Magnet Tuning",
    cost: 12,
    description: "Score Magnet pulls dots faster.",
  },
] as const;

const hackUpgradeIds = hackUpgradeDefinitions.map(({ id }) => id);

const achievementIds: readonly HackAchievementId[] = [
  "first-hack-used",
  "clear-level-holding-hack",
  "eat-3-ghosts-power-window",
  "shield-save",
  "clear-level-no-lives-lost",
  "earn-5000-score",
  "use-every-hack-type",
] as const;

export const readHackProgression = (): HackProgression => ({
  bytes: readNumber(MAZE_RUNNER_BYTES_KEY),
  unlocks: readArray(MAZE_RUNNER_UNLOCKS_KEY, hackUpgradeIds),
  achievements: readArray(MAZE_RUNNER_ACHIEVEMENTS_KEY, achievementIds),
  usedHackTypes: readArray(
    MAZE_RUNNER_USED_HACKS_KEY,
    Object.values(HackPickupId),
  ),
});

export const awardBytesForRun = (score: number): number => {
  const awarded = Math.max(0, Math.floor(score / 100));
  writeBytes(readNumber(MAZE_RUNNER_BYTES_KEY) + awarded);
  return awarded;
};

export const purchaseHackUpgrade = (id: HackUpgradeId): boolean => {
  const definition = hackUpgradeDefinitions.find(
    (upgrade) => upgrade.id === id,
  );
  if (!definition) return false;

  const progression = readHackProgression();
  if (progression.unlocks.includes(id) || progression.bytes < definition.cost) {
    return false;
  }

  writeBytes(progression.bytes - definition.cost);
  writeArray(MAZE_RUNNER_UNLOCKS_KEY, [...progression.unlocks, id]);
  return true;
};

export const completeAchievement = (id: HackAchievementId): boolean => {
  const progression = readHackProgression();
  if (progression.achievements.includes(id)) return false;
  writeArray(MAZE_RUNNER_ACHIEVEMENTS_KEY, [...progression.achievements, id]);
  return true;
};

export const hasAchievement = (id: HackAchievementId): boolean => {
  return readHackProgression().achievements.includes(id);
};

export const recordHackUse = (id: HackPickupId): void => {
  const progression = readHackProgression();
  const usedHackTypes = [...progression.usedHackTypes, id];
  writeArray(MAZE_RUNNER_USED_HACKS_KEY, usedHackTypes);
  if (new Set(usedHackTypes).size >= Object.values(HackPickupId).length) {
    completeAchievement("use-every-hack-type");
  }
};
