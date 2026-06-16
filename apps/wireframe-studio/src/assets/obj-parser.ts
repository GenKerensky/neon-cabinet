export interface ObjVertex {
  x: number;
  y: number;
  z: number;
}

export interface ParsedObjEdge {
  start: number;
  end: number;
  object?: string;
  group?: string;
  material?: string;
  source: "face" | "line";
  fingerprint: string;
}

export interface ParsedObjModel {
  vertices: ObjVertex[];
  edges: ParsedObjEdge[];
  materialLibraries: string[];
}

interface PendingFace {
  vertices: number[];
  object?: string;
  group?: string;
  material?: string;
}

export function parseObjSource(source: string): ParsedObjModel {
  const vertices: ObjVertex[] = [];
  const lineEdges: ParsedObjEdge[] = [];
  const faces: PendingFace[] = [];
  const materialLibraries: string[] = [];
  let currentObject: string | undefined;
  let currentGroup: string | undefined;
  let currentMaterial: string | undefined;

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const [keyword, ...parts] = line.split(/\s+/);
    if (keyword === "mtllib") {
      materialLibraries.push(parts.join(" "));
      continue;
    }
    if (keyword === "o") {
      currentObject = parts.join(" ") || undefined;
      continue;
    }
    if (keyword === "g") {
      currentGroup = parts.join(" ") || undefined;
      continue;
    }
    if (keyword === "usemtl") {
      currentMaterial = parts.join(" ") || undefined;
      continue;
    }
    if (keyword === "v") {
      vertices.push({
        x: Number(parts[0]),
        y: Number(parts[1]),
        z: Number(parts[2]),
      });
      continue;
    }
    if (keyword === "l") {
      const indices = parts.map(parseObjIndex).filter(isValidIndex);
      for (let i = 0; i < indices.length - 1; i++) {
        lineEdges.push(
          createParsedEdge(indices[i], indices[i + 1], vertices, {
            group: currentGroup,
            material: currentMaterial,
            object: currentObject,
            source: "line",
          }),
        );
      }
      continue;
    }
    if (keyword === "f") {
      faces.push({
        vertices: parts.map(parseObjIndex).filter(isValidIndex),
        group: currentGroup,
        material: currentMaterial,
        object: currentObject,
      });
    }
  }

  return {
    vertices,
    edges: lineEdges.length > 0 ? lineEdges : deriveFaceEdges(faces, vertices),
    materialLibraries,
  };
}

export function edgeFingerprint(left: ObjVertex, right: ObjVertex): string {
  const endpoints = [quantizeVertex(left), quantizeVertex(right)].sort();
  return `${endpoints[0]}|${endpoints[1]}`;
}

function deriveFaceEdges(
  faces: PendingFace[],
  vertices: ObjVertex[],
): ParsedObjEdge[] {
  const seen = new Set<string>();
  const edges: ParsedObjEdge[] = [];
  for (const face of faces) {
    for (let i = 0; i < face.vertices.length; i++) {
      const start = face.vertices[i];
      const end = face.vertices[(i + 1) % face.vertices.length];
      const key = start < end ? `${start}:${end}` : `${end}:${start}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push(
        createParsedEdge(start, end, vertices, {
          group: face.group,
          material: face.material,
          object: face.object,
          source: "face",
        }),
      );
    }
  }
  return edges;
}

function createParsedEdge(
  start: number,
  end: number,
  vertices: ObjVertex[],
  context: Omit<ParsedObjEdge, "end" | "fingerprint" | "start">,
): ParsedObjEdge {
  return {
    start,
    end,
    ...context,
    fingerprint: edgeFingerprint(vertices[start], vertices[end]),
  };
}

function parseObjIndex(value: string): number {
  return Number(value.split("/")[0]) - 1;
}

function isValidIndex(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

function quantizeVertex(vertex: ObjVertex): string {
  return [vertex.x, vertex.y, vertex.z]
    .map((value) => String(Math.round(value * 1000) / 1000))
    .join(",");
}
