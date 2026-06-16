import { describe, expect, it } from "vitest";
import { edgeFingerprint, parseObjSource } from "./obj-parser";

describe("parseObjSource", () => {
  it("parses vertices and explicit OBJ line edges with part and material context", () => {
    const parsed = parseObjSource(`
o hull
usemtl body_cyan
v 0 0 0
v 10 0 0
g wing_left
usemtl laser_pink
v 10 5 0
l 1 2
l 2 3
`);

    expect(parsed.vertices).toEqual([
      { x: 0, y: 0, z: 0 },
      { x: 10, y: 0, z: 0 },
      { x: 10, y: 5, z: 0 },
    ]);
    expect(parsed.edges).toMatchObject([
      {
        start: 0,
        end: 1,
        material: "laser_pink",
        object: "hull",
        group: "wing_left",
        source: "line",
      },
      {
        start: 1,
        end: 2,
        material: "laser_pink",
        object: "hull",
        group: "wing_left",
        source: "line",
      },
    ]);
  });

  it("derives unique face boundary edges when no explicit lines exist", () => {
    const parsed = parseObjSource(`
o fuselage
usemtl body_cyan
v 0 0 0
v 10 0 0
v 10 10 0
v 0 10 0
f 1 2 3 4
`);

    expect(parsed.edges).toHaveLength(4);
    expect(parsed.edges.map(({ start, end }) => [start, end])).toEqual([
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
    ]);
    expect(parsed.edges.every((edge) => edge.source === "face")).toBe(true);
  });

  it("creates stable fingerprints from quantized endpoint coordinates", () => {
    const fingerprint = edgeFingerprint(
      { x: 0.0002, y: 0, z: 0 },
      { x: 10, y: 5, z: -2 },
    );

    expect(fingerprint).toBe("0,0,0|10,5,-2");
    expect(edgeFingerprint({ x: 10, y: 5, z: -2 }, { x: 0, y: 0, z: 0 })).toBe(
      fingerprint,
    );
  });
});
