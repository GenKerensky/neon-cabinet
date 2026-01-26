/**
 * Model Export Script
 * Exports WireframeModel to OBJ format for use in Blender
 *
 * Usage: bun run scripts/model-export.ts <category>/<model-name>
 * Example: bun run scripts/model-export.ts weapons/projectile
 */

import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { WireframeModel } from "../src/games/battle-tanks/engine/WireframeModel";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface ModelInfo {
  file: string;
  exportName: string;
}

// Model mapping: category/name -> { file, export }
export const MODEL_MAP: Record<string, ModelInfo> = {
  "enemies/enemy-tank": {
    file: "enemies/enemy-tank.ts",
    exportName: "ENEMY_TANK",
  },
  "enemies/enemy-projectile": {
    file: "enemies/enemy-projectile.ts",
    exportName: "ENEMY_PROJECTILE",
  },
  "terrain/pyramid": { file: "terrain/pyramid.ts", exportName: "PYRAMID" },
  "terrain/cube": { file: "terrain/cube.ts", exportName: "CUBE" },
  "weapons/projectile": {
    file: "weapons/projectile.ts",
    exportName: "PROJECTILE",
  },
  "pickups/shield-pickup": {
    file: "pickups/shield-pickup.ts",
    exportName: "SHIELD_PICKUP",
  },
  "pickups/laser-pickup": {
    file: "pickups/laser-pickup.ts",
    exportName: "LASER_PICKUP",
  },
};

export const MODELS_DIR = join(__dirname, "../src/games/battle-tanks/models");

/**
 * Convert hex color to string
 */
export function colorToHex(color: number): string {
  return "0x" + color.toString(16).padStart(6, "0");
}

/**
 * Convert WireframeModel to OBJ format
 */
export function modelToObj(model: WireframeModel, name: string): string {
  const lines: string[] = [];

  // Header
  lines.push("# Wavefront OBJ file");
  lines.push(`# Exported from Battle Tanks game`);
  lines.push(`# Model: ${name}`);
  lines.push(`# color: ${colorToHex(model.color)}`);
  lines.push("");

  // Vertices (OBJ uses 1-indexed)
  lines.push("# Vertices");
  for (const v of model.vertices) {
    lines.push(`v ${v.x.toFixed(4)} ${v.y.toFixed(4)} ${v.z.toFixed(4)}`);
  }
  lines.push("");

  // Edges as lines (OBJ uses 1-indexed)
  lines.push("# Edges");
  for (const edge of model.edges) {
    // +1 because OBJ is 1-indexed
    lines.push(`l ${edge.start + 1} ${edge.end + 1}`);
  }

  return lines.join("\n");
}

/**
 * Export a model to OBJ
 */
export async function exportModel(
  modelPath: string,
  modelsDir: string = MODELS_DIR,
): Promise<string> {
  const modelInfo = MODEL_MAP[modelPath];

  if (!modelInfo) {
    throw new Error(
      `Unknown model: ${modelPath}. Available: ${Object.keys(MODEL_MAP).join(", ")}`,
    );
  }

  const modelFile = join(modelsDir, modelInfo.file);

  if (!existsSync(modelFile)) {
    throw new Error(`Model file not found: ${modelFile}`);
  }

  // Import the model using Bun's native TypeScript support
  const modelModule = await import(modelFile);
  const model: WireframeModel = modelModule[modelInfo.exportName];

  if (!model) {
    throw new Error(
      `Export "${modelInfo.exportName}" not found in ${modelFile}`,
    );
  }

  // Convert to OBJ
  const objContent = modelToObj(model, modelPath);

  // Determine output path
  const objPath = join(modelsDir, modelPath + ".obj");
  const objDir = dirname(objPath);

  // Ensure directory exists
  if (!existsSync(objDir)) {
    mkdirSync(objDir, { recursive: true });
  }

  // Write OBJ file
  writeFileSync(objPath, objContent);

  return objPath;
}

/**
 * Export all models
 */
export async function exportAllModels(
  modelsDir: string = MODELS_DIR,
): Promise<string[]> {
  const paths: string[] = [];

  for (const modelPath of Object.keys(MODEL_MAP)) {
    const path = await exportModel(modelPath, modelsDir);
    paths.push(path);
  }

  return paths;
}

// Main - only run if this is the entry point
if (import.meta.main) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--all") {
    console.log("Exporting all models...\n");
    const paths = await exportAllModels();
    for (const p of paths) {
      console.log(`Exported: ${p}`);
    }
    console.log("\nAll models exported successfully!");
  } else {
    try {
      const path = await exportModel(args[0]);
      console.log(`Exported: ${path}`);
    } catch (error) {
      console.error((error as Error).message);
      process.exit(1);
    }
  }
}
