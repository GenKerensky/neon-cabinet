import { describe, expect, it } from "vitest";
import {
  formatHighScore,
  parseStoredHighScore,
  readHighScore,
  writeHighScore,
} from "./highScore";

describe("highScore", () => {
  it("formats attract-screen scores as six digits", () => {
    expect(formatHighScore(0)).toBe("000000");
    expect(formatHighScore(638)).toBe("000638");
    expect(formatHighScore(1_250_000)).toBe("1250000");
  });

  it("ignores invalid stored scores", () => {
    expect(parseStoredHighScore(null)).toBe(0);
    expect(parseStoredHighScore("-1")).toBe(0);
    expect(parseStoredHighScore("abc")).toBe(0);
  });

  it("persists only the best bounty score", () => {
    const registry = new Map<string, unknown>();
    const bridge = {
      get: (key: string) => registry.get(key),
      set: (key: string, value: unknown) => registry.set(key, value),
    };

    expect(writeHighScore(638, bridge)).toBe(638);
    expect(writeHighScore(500, bridge)).toBe(638);
    expect(readHighScore(bridge)).toBe(638);
  });
});
