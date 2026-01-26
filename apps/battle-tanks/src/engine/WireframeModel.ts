import { Vector3D } from "./Vector3D";

/**
 * Edge definition with optional color override
 */
export interface Edge {
  start: number;
  end: number;
  color?: number;
}

/**
 * Color configuration for multi-color mode
 */
export interface ColorConfig {
  body?: number;
  accent?: number;
  highlight?: number;
}

/**
 * Wireframe model definition
 */
export interface WireframeModel {
  vertices: Vector3D[];
  edges: Edge[];
  color: number;
  colorMode?: ColorConfig;
}

/**
 * Helper to create edges from vertex index pairs
 */
export function createEdges(pairs: [number, number][], color?: number): Edge[] {
  return pairs.map(([start, end]) => ({ start, end, color }));
}

/**
 * Helper to create a simple wireframe model
 */
export function createModel(
  vertices: Vector3D[],
  edgePairs: [number, number][],
  color = 0x00ff00,
): WireframeModel {
  return {
    vertices,
    edges: createEdges(edgePairs),
    color,
  };
}
