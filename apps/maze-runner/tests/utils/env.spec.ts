import { describe, it, expect } from "vitest";
import { isDevMode } from "../../src/game/utils/env";

describe("isDevMode", () => {
  it("returns a boolean", () => {
    expect(typeof isDevMode()).toBe("boolean");
  });

  it("returns true in the Vitest environment", () => {
    expect(isDevMode()).toBe(true);
  });
});
