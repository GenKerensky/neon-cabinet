import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MAZE_RUNNER_ACHIEVEMENTS_KEY,
  MAZE_RUNNER_BYTES_KEY,
  MAZE_RUNNER_UNLOCKS_KEY,
  awardBytesForRun,
  completeAchievement,
  hasAchievement,
  purchaseHackUpgrade,
  readHackProgression,
} from "../../src/game/utils/hackProgression";

function stubLocalStorage(values: Record<string, string> = {}) {
  const storage = {
    getItem: vi.fn((key: string) =>
      Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null,
    ),
    setItem: vi.fn((key: string, value: string) => {
      values[key] = value;
    }),
  };
  vi.stubGlobal("localStorage", storage as unknown as Storage);
  return { storage, values };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("hackProgression", () => {
  it("awards separate Bytes from score without changing high-score storage", () => {
    const { storage, values } = stubLocalStorage();

    const awarded = awardBytesForRun(1250);

    expect(awarded).toBe(12);
    expect(values[MAZE_RUNNER_BYTES_KEY]).toBe("12");
    expect(storage.setItem).not.toHaveBeenCalledWith(
      "mazeRunnerHighScore",
      expect.any(String),
    );
  });

  it("purchases unlocks only when enough Bytes are available", () => {
    const { values } = stubLocalStorage({
      [MAZE_RUNNER_BYTES_KEY]: "15",
    });

    expect(purchaseHackUpgrade("longer-duration")).toBe(true);
    expect(readHackProgression().bytes).toBe(5);
    expect(readHackProgression().unlocks).toContain("longer-duration");
    expect(values[MAZE_RUNNER_UNLOCKS_KEY]).toContain("longer-duration");
    expect(purchaseHackUpgrade("stronger-shield")).toBe(false);
  });

  it("records achievements idempotently", () => {
    stubLocalStorage({
      [MAZE_RUNNER_ACHIEVEMENTS_KEY]: "not-json",
    });

    expect(hasAchievement("first-hack-used")).toBe(false);
    completeAchievement("first-hack-used");
    completeAchievement("first-hack-used");

    const achievements = readHackProgression().achievements;
    expect(achievements).toEqual(["first-hack-used"]);
  });
});
