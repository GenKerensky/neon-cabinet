/**
 * Model Export Script
 * Exports WireframeModel to OBJ format for use in Blender
 */

import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import type { WireframeModel } from "./types";
import { resolveProjectPaths } from "./utils/project";
import { discoverModels, getExportNameFromFile } from "./utils/discover-models";

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
  lines.push(`# Exported from wireframe model`);
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
  projectPath?: string,
): Promise<string> {
  const { modelsDir } = resolveProjectPaths(projectPath);
  const modelMap = discoverModels(modelsDir);

  const modelInfo = modelMap[modelPath];

  if (!modelInfo) {
    const available = Object.keys(modelMap).join(", ");
    throw new Error(
      `Unknown model: ${modelPath}. Available: ${available || "none"}`,
    );
  }

  const modelFile = join(modelsDir, modelInfo.file);

  if (!existsSync(modelFile)) {
    throw new Error(`Model file not found: ${modelFile}`);
  }

  // Import the model using Bun's native TypeScript support
  const modelModule = await import(modelFile);

  // Try to find the export - first use the discovered name, then try to find it
  let exportName = modelInfo.exportName;
  if (!modelModule[exportName]) {
    // Try to find it dynamically
    const foundName = await getExportNameFromFile(modelFile);
    if (foundName && modelModule[foundName]) {
      exportName = foundName;
    }
  }

  if (!exportName || !modelModule[exportName]) {
    throw new Error(
      `Export "${modelInfo.exportName}" not found in ${modelFile}. Available exports: ${Object.keys(modelModule).join(", ")}`,
    );
  }

  const model: WireframeModel = modelModule[exportName];

  if (!model) {
    throw new Error(`Export "${exportName}" not found in ${modelFile}`);
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
export async function exportAllModels(projectPath?: string): Promise<string[]> {
  const { modelsDir } = resolveProjectPaths(projectPath);
  const modelMap = discoverModels(modelsDir);
  const paths: string[] = [];

  for (const modelPath of Object.keys(modelMap)) {
    const path = await exportModel(modelPath, projectPath);
    paths.push(path);
  }

  return paths;
}
