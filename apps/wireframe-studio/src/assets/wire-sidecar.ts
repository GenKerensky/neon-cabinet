import type { ParsedObjModel } from "./obj-parser";

export interface WireframePreviewModel {
  vertices: Array<{ x: number; y: number; z: number }>;
  edges: Array<{ start: number; end: number; color?: number }>;
  color: number;
}

export type WireSidecarStatus =
  | "NO_SIDE_CAR"
  | "SIDE_CAR_INVALID"
  | "SIDE_CAR_LOADED";

export interface WireframePreviewModelResult {
  model: WireframePreviewModel;
  status: WireSidecarStatus;
  warnings: string[];
}

interface WireSidecar {
  color?: string | number;
  edgeOverrides?: Record<string, string | number>;
  materialRoles?: Record<string, string | number>;
  parts?: Record<string, string | number>;
}

export function applyWireSidecar(
  parsed: ParsedObjModel,
  sidecarSource: string | undefined,
  fallbackColor: number,
): WireframePreviewModelResult {
  if (!sidecarSource) {
    return {
      model: toModel(parsed, fallbackColor),
      status: "NO_SIDE_CAR",
      warnings: [],
    };
  }

  let sidecar: WireSidecar;
  try {
    sidecar = JSON.parse(sidecarSource) as WireSidecar;
  } catch (error) {
    return {
      model: toModel(parsed, fallbackColor),
      status: "SIDE_CAR_INVALID",
      warnings: [
        `Invalid sidecar JSON: ${error instanceof Error ? error.message : "parse failed"}`,
      ],
    };
  }

  const modelColor = readColor(sidecar.color) ?? fallbackColor;
  return {
    model: {
      vertices: parsed.vertices,
      edges: parsed.edges.map((edge) => ({
        start: edge.start,
        end: edge.end,
        color:
          readColor(sidecar.edgeOverrides?.[edge.fingerprint]) ??
          readColor(
            edge.material ? sidecar.materialRoles?.[edge.material] : undefined,
          ) ??
          readColor(edge.group ? sidecar.parts?.[edge.group] : undefined) ??
          readColor(edge.object ? sidecar.parts?.[edge.object] : undefined),
      })),
      color: modelColor,
    },
    status: "SIDE_CAR_LOADED",
    warnings: [],
  };
}

function toModel(
  parsed: ParsedObjModel,
  color: number,
): WireframePreviewModelResult["model"] {
  return {
    vertices: parsed.vertices,
    edges: parsed.edges.map(({ start, end }) => ({ start, end })),
    color,
  };
}

function readColor(value: number | string | undefined): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().replace(/^#/, "0x");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}
