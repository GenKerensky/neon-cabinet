import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MAZE_RUNNER_HIGH_SCORE_KEY,
  formatScore,
  parseStoredHighScore,
  readHighScore,
  writeHighScore,
} from "../../src/game/utils/highScore";

function createRegistry(initialValue?: unknown) {
  const values = new Map<string, unknown>(
    initialValue === undefined ? [] : [["highScore", initialValue]],
  );

  return {
    get: (key: string) => values.get(key),
    set: (key: string, value: unknown) => values.set(key, value),
  };
}

function stubLocalStorage(
  values: Record<string, string> = {},
  options?: { getItemThrows?: boolean; setItemThrows?: boolean },
) {
  const storage = {
    getItem: vi.fn((key: string) => {
      if (options?.getItemThrows) {
        throw new Error("getItem failed");
      }

      return Object.prototype.hasOwnProperty.call(values, key)
        ? values[key]
        : null;
    }),
    setItem: vi.fn((key: string, value: string) => {
      if (options?.setItemThrows) {
        throw new Error("setItem failed");
      }

      values[key] = value;
    }),
  };

  vi.stubGlobal("localStorage", storage as unknown as Storage);

  return storage;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("highScore", () => {
  describe("formatScore", () => {
    it("pads scores below one million to six digits", () => {
      expect(formatScore(0)).toBe("000000");
      expect(formatScore(1234)).toBe("001234");
    });

    it("keeps larger scores as full integers", () => {
      expect(formatScore(1_000_000)).toBe("1000000");
      expect(formatScore(1_234_567)).toBe("1234567");
    });
  });

  describe("parseStoredHighScore", () => {
    it("returns 0 for invalid stored values", () => {
      expect(parseStoredHighScore(null)).toBe(0);
      expect(parseStoredHighScore(undefined)).toBe(0);
      expect(parseStoredHighScore("-1")).toBe(0);
      expect(parseStoredHighScore("12.5")).toBe(0);
      expect(parseStoredHighScore("abc")).toBe(0);
      expect(parseStoredHighScore("Infinity")).toBe(0);
    });

    it("parses digit-only strings", () => {
      expect(parseStoredHighScore("000123")).toBe(123);
      expect(parseStoredHighScore("42")).toBe(42);
    });
  });

  describe("readHighScore", () => {
    it("reads from localStorage when available", () => {
      stubLocalStorage({ [MAZE_RUNNER_HIGH_SCORE_KEY]: "7654" });

      expect(readHighScore()).toBe(7654);
    });

    it("falls back to registry highScore when storage is empty", () => {
      stubLocalStorage();
      const registry = createRegistry(4321);

      expect(readHighScore(registry)).toBe(4321);
    });

    it("returns 0 for invalid stored values", () => {
      stubLocalStorage({ [MAZE_RUNNER_HIGH_SCORE_KEY]: "12.5" });

      expect(readHighScore(createRegistry(9999))).toBe(0);
    });

    it("handles storage errors without throwing", () => {
      stubLocalStorage({}, { getItemThrows: true });
      const registry = createRegistry(55);

      expect(() => readHighScore(registry)).not.toThrow();
      expect(readHighScore(registry)).toBe(55);
    });
  });

  describe("writeHighScore", () => {
    it("persists the larger score and updates the registry", () => {
      const storage = stubLocalStorage({
        [MAZE_RUNNER_HIGH_SCORE_KEY]: "5000",
      });
      const registry = createRegistry(5000);

      expect(writeHighScore(1200, registry)).toBe(5000);
      expect(storage.setItem).toHaveBeenCalledWith(
        MAZE_RUNNER_HIGH_SCORE_KEY,
        "5000",
      );
      expect(registry.get("highScore")).toBe(5000);
    });

    it("stores a new high score when it is larger", () => {
      const storage = stubLocalStorage({ [MAZE_RUNNER_HIGH_SCORE_KEY]: "300" });
      const registry = createRegistry(300);

      expect(writeHighScore(1200, registry)).toBe(1200);
      expect(storage.setItem).toHaveBeenCalledWith(
        MAZE_RUNNER_HIGH_SCORE_KEY,
        "1200",
      );
      expect(registry.get("highScore")).toBe(1200);
    });

    it("handles storage errors without throwing", () => {
      stubLocalStorage({}, { setItemThrows: true });
      const registry = createRegistry(10);

      expect(() => writeHighScore(25, registry)).not.toThrow();
      expect(registry.get("highScore")).toBe(25);
    });
  });
});
