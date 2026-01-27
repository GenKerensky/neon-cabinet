/**
 * Type definitions for WireframeModel
 * These match the structure used in game projects
 */

export interface Edge {
  start: number;
  end: number;
  color?: number;
}

export interface ColorConfig {
  body?: number;
  [key: string]: number | undefined;
}

export interface WireframeModel {
  vertices: Array<{ x: number; y: number; z: number }>;
  edges: Edge[];
  color: number;
  colorMode?: ColorConfig;
}
