/**
 * Model Import Script
 * Imports OBJ files and converts them to WireframeModel TypeScript format
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { resolveProjectPaths } from "./utils/project";
import { toExportName } from "./utils/discover-models";

export interface Vertex {
  x: number;
  y: number;
  z: number;
}

export interface ParsedOBJ {
  vertices: Vertex[];
  edges: [number, number][];
  color: number | null;
}

/**
 * Parse OBJ file and extract vertices and edges
 */
export function parseObj(content: string): ParsedOBJ {
  const vertices: Vertex[] = [];
  const edges: [number, number][] = [];
  const faces: number[][] = [];
  let color: number | null = null;

  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    // Parse color from comment
    if (trimmed.startsWith("# color:")) {
      const colorStr = trimmed.replace("# color:", "").trim();
      color = parseInt(colorStr, 16);
      continue;
    }

    // Parse vertex
    if (trimmed.startsWith("v ")) {
      const parts = trimmed.split(/\s+/);
      vertices.push({
        x: parseFloat(parts[1]),
        y: parseFloat(parts[2]),
        z: parseFloat(parts[3]),
      });
      continue;
    }

    // Parse line/edge
    if (trimmed.startsWith("l ")) {
      const parts = trimmed.split(/\s+/).slice(1);
      // OBJ is 1-indexed, convert to 0-indexed
      const v1 = parseInt(parts[0]) - 1;
      const v2 = parseInt(parts[1]) - 1;
      edges.push([v1, v2]);
      continue;
    }

    // Parse face (for edge extraction fallback)
    if (trimmed.startsWith("f ")) {
      const parts = trimmed.split(/\s+/).slice(1);
      // OBJ face can have format: v, v/vt, v/vt/vn, v//vn
      const faceVerts = parts.map((p) => parseInt(p.split("/")[0]) - 1);
      faces.push(faceVerts);
      continue;
    }
  }

  // If no explicit edges but we have faces, extract edges from faces
  if (edges.length === 0 && faces.length > 0) {
    const edgeSet = new Set<string>();

    for (const face of faces) {
      for (let i = 0; i < face.length; i++) {
        const v1 = face[i];
        const v2 = face[(i + 1) % face.length];
        // Normalize edge order to avoid duplicates
        const edge = v1 < v2 ? `${v1},${v2}` : `${v2},${v1}`;
        edgeSet.add(edge);
      }
    }

    for (const edge of edgeSet) {
      const [v1, v2] = edge.split(",").map(Number);
      edges.push([v1, v2]);
    }
  }

  return { vertices, edges, color };
}

// Color mapping based on category folder
export const CATEGORY_COLOR_MAP: Record<string, string> = {
  enemies: "COLORS.enemy",
  terrain: "COLORS.obstacle",
  weapons: "COLORS.projectile",
  pickups: "COLORS.pickup_armor", // Default for pickups, can be overridden by model name
};

// Special model name overrides (takes precedence over category)
export const MODEL_COLOR_OVERRIDES: Record<string, string> = {
  "laser-pickup": "COLORS.pickup_weapon",
  "enemy-projectile": "COLORS.enemy",
};

/**
 * Determine color reference based on category and model name
 */
export function getColorForModel(
  modelName: string,
  category: string | null,
): string {
  // Check for model-specific override first
  if (MODEL_COLOR_OVERRIDES[modelName]) {
    return MODEL_COLOR_OVERRIDES[modelName];
  }

  // Fall back to category-based color
  if (category && CATEGORY_COLOR_MAP[category]) {
    return CATEGORY_COLOR_MAP[category];
  }

  // Default
  return "COLORS.player";
}

/**
 * Generate TypeScript code for WireframeModel
 */
export function generateTypeScript(
  modelName: string,
  exportName: string,
  data: ParsedOBJ,
  category: string | null,
  engineRelativePath: string,
  _modelsDir: string,
): string {
  const { vertices, edges } = data;

  // Format vertex lines
  const vertexLines = vertices.map(
    (v) => `    new Vector3D(${v.x}, ${v.y}, ${v.z}),`,
  );

  // Format edge lines
  const edgeLines = edges.map((e) => `    [${e[0]}, ${e[1]}],`);

  // Determine color based on category/model name
  const colorRef = getColorForModel(modelName, category);

  // Calculate relative path to colors
  const colorsPath = category ? "../" : "./";

  const code = `import { Vector3D } from "${engineRelativePath}/Vector3D";
import { WireframeModel, createEdges } from "${engineRelativePath}/WireframeModel";
import { COLORS } from "${colorsPath}colors";

/**
 * ${modelName} - imported from OBJ
 */
export const ${exportName}: WireframeModel = {
  vertices: [
${vertexLines.join("\n")}
  ],
  edges: createEdges([
${edgeLines.join("\n")}
  ]),
  color: ${colorRef},
};
`;

  return code;
}

/**
 * Import OBJ file and generate TypeScript
 */
export function importModel(
  objPath: string,
  outputPath?: string,
  projectPath?: string,
): { tsPath: string; data: ParsedOBJ } {
  const { modelsDir, engineRelativePath } = resolveProjectPaths(projectPath);

  // Resolve path relative to MODELS_DIR if not absolute
  let fullObjPath = objPath;
  if (!objPath.startsWith("/")) {
    fullObjPath = join(modelsDir, objPath);
  }

  if (!existsSync(fullObjPath)) {
    throw new Error(`OBJ file not found: ${fullObjPath}`);
  }

  // Read and parse OBJ
  const content = readFileSync(fullObjPath, "utf-8");
  const data = parseObj(content);

  // Determine output path
  let tsPath = outputPath;
  if (!tsPath) {
    // Replace .obj with .ts
    tsPath = fullObjPath.replace(/\.obj$/, ".ts");
  } else if (!tsPath.startsWith("/")) {
    tsPath = join(modelsDir, tsPath);
  }

  // Extract model name and category from path
  const relativePath = tsPath.replace(modelsDir + "/", "");
  const parts = relativePath.replace(/\.ts$/, "").split("/");
  const category = parts.length > 1 ? parts[0] : null;
  const modelName = parts[parts.length - 1];
  const exportName = toExportName(modelName);

  // Generate TypeScript
  const tsContent = generateTypeScript(
    modelName,
    exportName,
    data,
    category,
    engineRelativePath,
    modelsDir,
  );

  // Write TypeScript file
  writeFileSync(tsPath, tsContent);

  return { tsPath, data };
}
