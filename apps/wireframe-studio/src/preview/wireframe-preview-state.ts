import type {
  WireSidecarStatus,
  WireframePreviewModel,
} from "../assets/wire-sidecar";
import { computeModelBounds, type ModelBounds } from "./wireframe-model";

export interface WireframePreviewState {
  assetLabel: string;
  autoOrbit: boolean;
  axesEnabled: boolean;
  bounds: ModelBounds;
  edgeColorsEnabled: boolean;
  edgeCount: number;
  gridEnabled: boolean;
  pitch: number;
  shaderEnabled: boolean;
  sidecarStatus: WireSidecarStatus | "NO_MODEL";
  sourcePath: string;
  status: string;
  vertexCount: number;
  warnings: string[];
  yaw: number;
  zoomDistance: number;
  minZoomDistance: number;
  maxZoomDistance: number;
}

const AUTO_ORBIT_DEGREES_PER_SECOND = 12;

export { computeModelBounds };

export function createInitialPreviewState(
  model?: WireframePreviewModel,
): WireframePreviewState {
  const bounds = model
    ? computeModelBounds(model)
    : computeModelBounds(emptyModel());
  return {
    assetLabel: model ? "Model" : "No model selected",
    autoOrbit: false,
    axesEnabled: true,
    bounds,
    edgeColorsEnabled: true,
    edgeCount: model?.edges.length ?? 0,
    gridEnabled: true,
    maxZoomDistance: bounds.framingDistance * 4,
    minZoomDistance: bounds.framingDistance * 0.45,
    pitch: -12,
    shaderEnabled: true,
    sidecarStatus: model ? "NO_SIDE_CAR" : "NO_MODEL",
    sourcePath: "",
    status: model ? "LOADED" : "NO MODEL",
    vertexCount: model?.vertices.length ?? 0,
    warnings: [],
    yaw: 35,
    zoomDistance: bounds.framingDistance,
  };
}

export function zoomPreviewState(
  state: WireframePreviewState,
  delta: number,
): WireframePreviewState {
  return {
    ...state,
    zoomDistance: clamp(
      state.zoomDistance + delta,
      state.minZoomDistance,
      state.maxZoomDistance,
    ),
  };
}

export function advanceAutoOrbit(
  state: WireframePreviewState,
  deltaMs: number,
  isDragging: boolean,
): WireframePreviewState {
  if (!state.autoOrbit || isDragging) return state;
  return {
    ...state,
    yaw: normalizeDegrees(
      state.yaw + (deltaMs / 1000) * AUTO_ORBIT_DEGREES_PER_SECOND,
    ),
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

function emptyModel(): WireframePreviewModel {
  return {
    color: 0x7be8ff,
    edges: [],
    vertices: [],
  };
}
