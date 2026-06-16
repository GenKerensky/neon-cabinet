import type { WireframePreviewModel } from "../assets/wire-sidecar";

export interface ModelBounds {
  center: { x: number; y: number; z: number };
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
  radius: number;
  size: { x: number; y: number; z: number };
  framingDistance: number;
}

export function computeModelBounds(model: WireframePreviewModel): ModelBounds {
  if (model.vertices.length === 0) {
    return createEmptyBounds();
  }

  const min = { ...model.vertices[0] };
  const max = { ...model.vertices[0] };
  for (const vertex of model.vertices) {
    min.x = Math.min(min.x, vertex.x);
    min.y = Math.min(min.y, vertex.y);
    min.z = Math.min(min.z, vertex.z);
    max.x = Math.max(max.x, vertex.x);
    max.y = Math.max(max.y, vertex.y);
    max.z = Math.max(max.z, vertex.z);
  }

  const size = {
    x: max.x - min.x,
    y: max.y - min.y,
    z: max.z - min.z,
  };
  const center = {
    x: min.x + size.x / 2,
    y: min.y + size.y / 2,
    z: min.z + size.z / 2,
  };
  const radius =
    Math.sqrt(size.x * size.x + size.y * size.y + size.z * size.z) / 2;

  return {
    center,
    min,
    max,
    radius,
    size,
    framingDistance: Math.max(120, radius * 4),
  };
}

function createEmptyBounds(): ModelBounds {
  return {
    center: { x: 0, y: 0, z: 0 },
    framingDistance: 120,
    max: { x: 0, y: 0, z: 0 },
    min: { x: 0, y: 0, z: 0 },
    radius: 1,
    size: { x: 0, y: 0, z: 0 },
  };
}
