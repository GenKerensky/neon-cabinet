#!/usr/bin/env bun
/**
 * Model Convert CLI
 * Unified CLI for exporting and importing wireframe models
 *
 * Usage:
 *   model-convert <category>/<name>        Export model to OBJ
 *   model-convert --all                    Export all models
 *   model-convert --import <file>          Import OBJ to TypeScript
 *   model-convert --help                   Show help
 *
 * Examples:
 *   model-convert weapons/projectile
 *   model-convert --import weapons/projectile.obj
 *   model-convert --all
 */

import { resolveProjectPaths } from "../utils/project";
import { discoverModels } from "../utils/discover-models";
import * as exportModule from "../export";
import * as importModule from "../import";

export function showHelp(projectPath?: string): void {
  let modelList = "  (no models found)";
  try {
    const { modelsDir } = resolveProjectPaths(projectPath);
    const modelMap = discoverModels(modelsDir);
    modelList =
      Object.keys(modelMap)
        .map((key) => `  ${key.padEnd(30)} ${modelMap[key].name}`)
        .join("\n") || "  (no models found)";
  } catch {
    // Models directory not found, use default message
  }

  console.log(`
Wireframe Model Converter
=========================

Export models to OBJ format for editing in Blender, or import OBJ files
back to TypeScript WireframeModel format.

Usage:
  model-convert <category>/<name>        Export a single model to OBJ
  model-convert --all                    Export all models to OBJ
  model-convert --import <file>          Import OBJ file to TypeScript
  model-convert --list                   List all available models
  model-convert --help                   Show this help message

Available Models:
${modelList}

Examples:
  # Export shield pickup to OBJ for Blender editing
  model-convert pickups/shield-pickup

  # Export all models
  model-convert --all

  # Import edited OBJ back to TypeScript
  model-convert --import pickups/shield-pickup.obj

  # Import a new model from Blender
  model-convert --import my-new-model.obj weapons/new-model.ts
`);
}

export function showList(projectPath?: string): void {
  let modelList = "  (no models found)";
  try {
    const { modelsDir } = resolveProjectPaths(projectPath);
    const modelMap = discoverModels(modelsDir);
    modelList =
      Object.keys(modelMap)
        .map((key) => `  ${key.padEnd(30)} ${modelMap[key].name}`)
        .join("\n") || "  (no models found)";
  } catch {
    // Models directory not found, use default message
  }

  console.log(`
Available Models:
${modelList}
`);
}

/**
 * Parse CLI arguments and determine action
 */
export function parseArgs(args: string[]): {
  action: "help" | "list" | "import" | "export";
  args: string[];
  projectPath?: string;
} {
  let projectPath: string | undefined;
  const filteredArgs: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--project" || args[i] === "-p") {
      if (i + 1 < args.length) {
        projectPath = args[i + 1];
        i++; // Skip next arg
      }
    } else {
      filteredArgs.push(args[i]);
    }
  }

  if (
    filteredArgs.length === 0 ||
    filteredArgs[0] === "--help" ||
    filteredArgs[0] === "-h"
  ) {
    return { action: "help", args: [], projectPath };
  }

  if (filteredArgs[0] === "--list" || filteredArgs[0] === "-l") {
    return { action: "list", args: [], projectPath };
  }

  if (filteredArgs[0] === "--import" || filteredArgs[0] === "-i") {
    return { action: "import", args: filteredArgs.slice(1), projectPath };
  }

  return { action: "export", args: filteredArgs, projectPath };
}

// Main - only run if this is the entry point
if (import.meta.main) {
  const args = process.argv.slice(2);
  const parsed = parseArgs(args);

  if (parsed.action === "help") {
    showHelp(parsed.projectPath);
    process.exit(0);
  }

  if (parsed.action === "list") {
    showList(parsed.projectPath);
    process.exit(0);
  }

  if (parsed.action === "import") {
    if (parsed.args.length === 0) {
      console.error("Error: --import requires an OBJ file path");
      console.error("Usage: model-convert --import <file.obj> [output.ts]");
      process.exit(1);
    }

    try {
      const { tsPath, data } = importModule.importModel(
        parsed.args[0],
        parsed.args[1],
        parsed.projectPath,
      );
      console.log(
        `Parsed OBJ: ${data.vertices.length} vertices, ${data.edges.length} edges`,
      );
      console.log(`Generated: ${tsPath}`);
    } catch (error) {
      console.error((error as Error).message);
      process.exit(1);
    }
    process.exit(0);
  }

  // Export mode
  try {
    if (parsed.args.length === 0 || parsed.args[0] === "--all") {
      console.log("Exporting all models...\n");
      const paths = await exportModule.exportAllModels(parsed.projectPath);
      for (const p of paths) {
        console.log(`Exported: ${p}`);
      }
      console.log("\nAll models exported successfully!");
    } else {
      const path = await exportModule.exportModel(
        parsed.args[0],
        parsed.projectPath,
      );
      console.log(`Exported: ${path}`);
    }
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }
}
