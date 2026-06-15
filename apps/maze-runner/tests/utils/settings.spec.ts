import { describe, it, expect, vi } from "vitest";

vi.mock("@neon-cabinet/shaders", () => {
  return {
    VectorMode: { MONOCHROME: 0, COLOR: 1 },
    VectorShader: class {},
  };
});

import {
  getVectorMode,
  setVectorMode,
  isColorMode,
  VectorMode,
} from "../../src/game/utils/settings";

function createMockScene(): any {
  const registry = new Map<string, unknown>();
  return {
    registry: {
      get: (key: string) => registry.get(key),
      set: (key: string, value: unknown) => registry.set(key, value),
    },
  };
}

describe("settings", () => {
  describe("getVectorMode", () => {
    it("returns COLOR when registry key is unset", () => {
      const scene = createMockScene();
      expect(getVectorMode(scene)).toBe(VectorMode.COLOR);
    });
  });

  describe("setVectorMode / getVectorMode round-trip", () => {
    it("stores and retrieves MONOCHROME", () => {
      const scene = createMockScene();
      setVectorMode(scene, VectorMode.MONOCHROME);
      expect(getVectorMode(scene)).toBe(VectorMode.MONOCHROME);
    });
  });

  describe("isColorMode", () => {
    it("returns true for COLOR", () => {
      const scene = createMockScene();
      setVectorMode(scene, VectorMode.COLOR);
      expect(isColorMode(scene)).toBe(true);
    });

    it("returns false for MONOCHROME", () => {
      const scene = createMockScene();
      setVectorMode(scene, VectorMode.MONOCHROME);
      expect(isColorMode(scene)).toBe(false);
    });
  });
});
