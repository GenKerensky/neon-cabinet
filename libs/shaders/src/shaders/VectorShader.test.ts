import { describe, it, expect, vi } from "vitest";

// Mock Phaser before importing VectorShader (uses named imports: Game, Renderer)
vi.mock("phaser", () => ({
  Game: vi.fn(),
  Renderer: {
    WebGL: {
      Pipelines: {
        PostFXPipeline: class {
          constructor() {}
        },
      },
    },
  },
}));

// Import after mocking
import { VectorMode } from "./VectorShader";

describe("VectorMode enum", () => {
  it("should have MONOCHROME value", () => {
    expect(VectorMode.MONOCHROME).toBe(0);
  });

  it("should have COLOR value", () => {
    expect(VectorMode.COLOR).toBe(1);
  });

  it("should have only two numeric values", () => {
    const values = Object.values(VectorMode).filter(
      (v) => typeof v === "number",
    );
    expect(values.length).toBe(2);
    expect(values).toContain(0);
    expect(values).toContain(1);
  });

  it("should be usable as enum values", () => {
    const monochrome: VectorMode = VectorMode.MONOCHROME;
    const color: VectorMode = VectorMode.COLOR;
    expect(monochrome).toBe(0);
    expect(color).toBe(1);
  });

  it("should be exported from the module", () => {
    expect(VectorMode).toBeDefined();
    expect(typeof VectorMode.MONOCHROME).toBe("number");
    expect(typeof VectorMode.COLOR).toBe("number");
  });
});
