import { describe, expect, it } from "vitest";
import { parseObjSource } from "./obj-parser";
import { applyWireSidecar } from "./wire-sidecar";

const OBJ = `
o hull
usemtl body
v 0 0 0
v 10 0 0
g cannons
usemtl laser
v 10 10 0
l 1 2
l 2 3
`;

describe("applyWireSidecar", () => {
  it("applies fallback, material, part, and explicit edge colors", () => {
    const parsed = parseObjSource(OBJ);
    const result = applyWireSidecar(
      parsed,
      JSON.stringify({
        color: "#7be8ff",
        materialRoles: {
          laser: "#ff2bd6",
        },
        parts: {
          cannons: "#8e44ff",
        },
        edgeOverrides: {
          "0,0,0|10,0,0": "#25a7ff",
        },
      }),
      0xffffff,
    );

    expect(result.model.color).toBe(0x7be8ff);
    expect(result.model.edges).toMatchObject([
      { start: 0, end: 1, color: 0x25a7ff },
      { start: 1, end: 2, color: 0xff2bd6 },
    ]);
    expect(result.status).toBe("SIDE_CAR_LOADED");
    expect(result.warnings).toEqual([]);
  });

  it("renders with fallback color when sidecar is missing", () => {
    const result = applyWireSidecar(parseObjSource(OBJ), undefined, 0x7be8ff);

    expect(result.model.color).toBe(0x7be8ff);
    expect(result.model.edges.every((edge) => edge.color === undefined)).toBe(
      true,
    );
    expect(result.status).toBe("NO_SIDE_CAR");
  });

  it("returns warnings and fallback color when sidecar JSON is invalid", () => {
    const result = applyWireSidecar(parseObjSource(OBJ), "{", 0x7be8ff);

    expect(result.model.color).toBe(0x7be8ff);
    expect(result.status).toBe("SIDE_CAR_INVALID");
    expect(result.warnings[0]).toContain("Invalid sidecar JSON");
  });
});
