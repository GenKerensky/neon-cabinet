export const MAZE_RUNNER_HIGH_SCORE_KEY = "mazeRunnerHighScore";

export function formatScore(score: number): string {
  const normalizedScore = Math.trunc(score);

  if (normalizedScore >= 0 && normalizedScore < 1_000_000) {
    return normalizedScore.toString().padStart(6, "0");
  }

  return normalizedScore.toString();
}

export function parseStoredHighScore(value: string | null | undefined): number {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeHighScore(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value));
  }

  if (typeof value === "string") {
    return parseStoredHighScore(value);
  }

  return 0;
}

function getLocalStorageValue(): string | null {
  if (typeof localStorage === "undefined") {
    return null;
  }

  return localStorage.getItem(MAZE_RUNNER_HIGH_SCORE_KEY);
}

export function readHighScore(registry?: {
  get(key: string): unknown;
}): number {
  try {
    const storedValue = getLocalStorageValue();

    if (storedValue !== null) {
      return parseStoredHighScore(storedValue);
    }
  } catch {
    if (registry?.get) {
      return normalizeHighScore(registry.get("highScore"));
    }

    return 0;
  }

  if (registry?.get) {
    return normalizeHighScore(registry.get("highScore"));
  }

  return 0;
}

export function writeHighScore(
  score: number,
  registry?: {
    get(key: string): unknown;
    set(key: string, value: unknown): void;
  },
): number {
  const candidateScore = Number.isFinite(score) ? Math.trunc(score) : 0;
  const persistedScore = Math.max(candidateScore, readHighScore(registry), 0);

  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(
        MAZE_RUNNER_HIGH_SCORE_KEY,
        persistedScore.toString(),
      );
    }
  } catch {
    void 0;
  }

  if (registry) {
    registry.set("highScore", persistedScore);
  }

  return persistedScore;
}
