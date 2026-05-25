import { describe, it, expect } from "vitest";
import { getFontFamily } from "../../src/game/utils/font";

function createMockScene(): any {
  const registry = new Map<string, unknown>();
  return {
    registry: {
      get: (key: string) => registry.get(key),
      set: (key: string, value: unknown) => registry.set(key, value),
    },
  };
}

describe("font", () => {
  it("returns Orbitron when registry key is unset", () => {
    const scene = createMockScene();
    expect(getFontFamily(scene)).toBe("Orbitron");
  });

  it("returns custom value when set in registry", () => {
    const scene = createMockScene();
    scene.registry.set("fontFamily", "Arial");
    expect(getFontFamily(scene)).toBe("Arial");
  });
});
