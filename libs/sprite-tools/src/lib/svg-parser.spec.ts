import { describe, it, expect, beforeEach } from "vitest";
import { SVGParser } from "./svg-parser.js";

describe("SVGParser", () => {
  let parser: SVGParser;

  beforeEach(() => {
    parser = new SVGParser();
  });

  it("should parse basic SVG metadata and layers", () => {
    const svg = `
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle id="body" cx="50" cy="50" r="40" fill="#ffffff" />
        <path id="wing" d="M 0 0 L 10 10" stroke="#000000" />
      </svg>
    `;
    const metadata = parser.parse(svg);
    expect(metadata.viewBox).toEqual({ x: 0, y: 0, width: 100, height: 100 });
    expect(metadata.layers).toHaveLength(2);
    expect(metadata.layers[0].id).toBe("body");
    expect(metadata.layers[0].type).toBe("circle");
    expect(metadata.layers[1].id).toBe("wing");
    expect(metadata.layers[1].type).toBe("path");
  });

  it("should parse custom data-anim-wave and material metadata", () => {
    const svg = `
      <svg width="100" height="100">
        <path id="skirt" d="M 0 0 L 10 10" data-anim-wave="frequency:0.5 amplitude:10 points:20" />
      </svg>
    `;
    const metadata = parser.parse(svg);
    const layer = metadata.layers[0];
    expect(layer.animations[0]).toEqual({
      type: "wave",
      frequency: 0.5,
      amplitude: 10,
      points: 20,
    });
  });

  it("should parse custom data-anim-pulse metadata", () => {
    const svg = `
      <svg width="100" height="100">
        <circle id="engine_glow" cx="50" cy="50" r="12" data-anim-pulse='{"frequency": 8, "amplitude": 0.35, "speed": 1.5}' />
      </svg>
    `;
    const metadata = parser.parse(svg);
    const layer = metadata.layers[0];
    expect(layer.animations[0]).toEqual({
      type: "pulse",
      frequency: 8,
      amplitude: 0.35,
      speed: 1.5,
    });
  });

  it("should parse line, polyline, and polygon layers", () => {
    const svg = `
      <svg width="100" height="100">
        <line id="muzzle_line" x1="4" y1="8" x2="28" y2="8" stroke="#ffffff" />
        <polyline id="speed_marks" points="4,12 10,14 18,12" stroke="#00ffff" fill="none" />
        <polygon id="ship_plate" points="50,4 70,42 30,42" fill="#000000" stroke="#ffffff" />
      </svg>
    `;
    const metadata = parser.parse(svg);

    expect(metadata.layers.map((layer) => layer.type)).toEqual([
      "line",
      "polyline",
      "polygon",
    ]);
    expect(metadata.layers[0]).toMatchObject({
      id: "muzzle_line",
      x1: 4,
      y1: 8,
      x2: 28,
      y2: 8,
    });
    expect(metadata.layers[1]).toMatchObject({
      id: "speed_marks",
      points: [
        { x: 4, y: 12 },
        { x: 10, y: 14 },
        { x: 18, y: 12 },
      ],
    });
    expect(metadata.layers[2]).toMatchObject({
      id: "ship_plate",
      points: [
        { x: 50, y: 4 },
        { x: 70, y: 42 },
        { x: 30, y: 42 },
      ],
    });
  });

  it("should parse physics colliders", () => {
    const svg = `
      <svg width="100" height="100">
        <circle class="physics-collider" cx="50" cy="50" r="20" data-mass="1.2" data-bounce="0.5" />
      </svg>
    `;
    const metadata = parser.parse(svg);
    const physics = metadata.layers[0].physics;
    expect(physics).toBeDefined();
    expect(physics?.shape).toBe("circle");
    expect(physics?.radius).toBe(20);
    expect(physics?.mass).toBe(1.2);
    expect(physics?.bounce).toBe(0.5);
  });

  it("should parse sockets", () => {
    const svg = `
      <svg width="100" height="100">
        <g id="socket_laser" transform="translate(10, 20)" data-socket-type="weapon" />
      </svg>
    `;
    const metadata = parser.parse(svg);
    expect(metadata.sockets).toHaveLength(1);
    expect(metadata.sockets[0]).toEqual({
      id: "socket_laser",
      x: 10,
      y: 20,
      type: "weapon",
    });
  });

  it("should parse empty data-direction-rotation attribute as defaults", () => {
    const svg = `
      <svg width="100" height="100">
        <g id="body" data-direction-rotation=""></g>
      </svg>
    `;
    const metadata = parser.parse(svg);
    expect(metadata.layers[0].directionRotation).toEqual({
      RIGHT: 0,
      DOWN: 90,
      LEFT: 180,
      UP: -90,
    });
  });

  it("should parse true and 1 data-direction-rotation values as defaults", () => {
    const svgTrue = `
      <svg width="100" height="100">
        <circle id="body_true" cx="10" cy="10" r="5" data-direction-rotation="true" />
      </svg>
    `;
    const metadataTrue = parser.parse(svgTrue);
    expect(metadataTrue.layers[0].directionRotation).toEqual({
      RIGHT: 0,
      DOWN: 90,
      LEFT: 180,
      UP: -90,
    });

    const svgOne = `
      <svg width="100" height="100">
        <circle id="body_one" cx="10" cy="10" r="5" data-direction-rotation="1" />
      </svg>
    `;
    const metadataOne = parser.parse(svgOne);
    expect(metadataOne.layers[0].directionRotation).toEqual({
      RIGHT: 0,
      DOWN: 90,
      LEFT: 180,
      UP: -90,
    });
  });

  it("should parse explicit direction-rotation JSON maps", () => {
    const svg = `
      <svg width="100" height="100">
        <rect
          id="body"
          width="10"
          height="10"
          data-direction-rotation='{"RIGHT":0,"DOWN":90,"LEFT":180,"UP":-90}'
        />
      </svg>
    `;
    const metadata = parser.parse(svg);
    expect(metadata.layers[0].directionRotation).toEqual({
      RIGHT: 0,
      DOWN: 90,
      LEFT: 180,
      UP: -90,
    });
  });

  it("should merge partial direction-rotation JSON with defaults", () => {
    const svg = `
      <svg width="100" height="100">
        <rect id="body" width="10" height="10" data-direction-rotation='{"LEFT":90}' />
      </svg>
    `;
    const metadata = parser.parse(svg);
    expect(metadata.layers[0].directionRotation).toEqual({
      RIGHT: 0,
      DOWN: 90,
      LEFT: 90,
      UP: -90,
    });
  });

  it("should return undefined for invalid direction-rotation JSON", () => {
    const svg = `
      <svg width="100" height="100">
        <path id="body" d="M 0 0 L 10 10" data-direction-rotation="not-json" />
      </svg>
    `;
    const metadata = parser.parse(svg);
    expect(metadata.layers[0].directionRotation).toBeUndefined();
  });

  it("should return undefined for non-object direction-rotation JSON", () => {
    const svg = `
      <svg width="100" height="100">
        <path id="body" d="M 0 0 L 10 10" data-direction-rotation="42" />
      </svg>
    `;
    const metadata = parser.parse(svg);
    expect(metadata.layers[0].directionRotation).toBeUndefined();
  });

  it("should return undefined for non-numeric direction values", () => {
    const svg = `
      <svg width="100" height="100">
        <g id="body" data-direction-rotation='{"LEFT":"bad"}' />
      </svg>
    `;
    const metadata = parser.parse(svg);
    expect(metadata.layers[0].directionRotation).toBeUndefined();
  });

  it("should return undefined for maps with only unknown direction keys", () => {
    const svg = `
      <svg width="100" height="100">
        <g id="body" data-direction-rotation='{"FORWARD":45}' />
      </svg>
    `;
    const metadata = parser.parse(svg);
    expect(metadata.layers[0].directionRotation).toBeUndefined();
  });

  it("should parse group-level direction-rotation metadata on group layer", () => {
    const svg = `
      <svg width="100" height="100">
        <g id="group_body" data-direction-rotation="">
          <circle id="child" cx="10" cy="10" r="5" />
        </g>
      </svg>
    `;
    const metadata = parser.parse(svg);
    const group = metadata.layers[0];
    expect(group.type).toBe("group");
    expect(group.directionRotation).toEqual({
      RIGHT: 0,
      DOWN: 90,
      LEFT: 180,
      UP: -90,
    });
    expect(group.children).toHaveLength(1);
  });
});
