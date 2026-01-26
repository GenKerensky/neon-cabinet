/**
 * Model Convert CLI
 * Unified CLI for exporting and importing Battle Tanks wireframe models
 *
 * Usage:
 *   bun run export-model <category>/<name>    Export model to OBJ
 *   bun run export-model --all                Export all models
 *   bun run export-model --import <file>      Import OBJ to TypeScript
 *   bun run export-model --help               Show help
 *
 * Examples:
 *   bun run export-model weapons/projectile
 *   bun run export-model --import weapons/projectile.obj
 *   bun run export-model --all
 */

import { join, dirname } from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = __dirname;

export function showHelp(): void {
  console.log(`
Battle Tanks Model Converter
============================

Export models to OBJ format for editing in Blender, or import OBJ files
back to TypeScript WireframeModel format.

Usage:
  bun run export-model <category>/<name>    Export a single model to OBJ
  bun run export-model --all                Export all models to OBJ
  bun run export-model --import <file>      Import OBJ file to TypeScript
  bun run export-model --list               List all available models
  bun run export-model --help               Show this help message

Available Models:
  enemies/enemy-tank        M1 Abrams-style enemy tank
  enemies/enemy-projectile  Red enemy projectile
  terrain/pyramid           Pyramid obstacle
  terrain/cube              Cube obstacle
  weapons/projectile        Yellow player projectile
  pickups/shield-pickup     Cyan armor pickup (shield with plus)
  pickups/laser-pickup      Gold laser weapon pickup

Examples:
  # Export shield pickup to OBJ for Blender editing
  bun run export-model pickups/shield-pickup

  # Export all models
  bun run export-model --all

  # Import edited OBJ back to TypeScript
  bun run export-model --import pickups/shield-pickup.obj

  # Import a new model from Blender
  bun run export-model --import my-new-model.obj weapons/new-model.ts

File Locations:
  Models:  src/games/battle-tanks/models/<category>/<name>.ts
  OBJ:     src/games/battle-tanks/models/<category>/<name>.obj

For more information, see: src/games/battle-tanks/models/MODELS.md
`);
}

export function showList(): void {
  console.log(`
Available Models:
  enemies/enemy-tank        M1 Abrams-style enemy tank
  enemies/enemy-projectile  Red enemy projectile
  terrain/pyramid           Pyramid obstacle
  terrain/cube              Cube obstacle
  weapons/projectile        Yellow player projectile
  pickups/shield-pickup     Cyan armor pickup (shield with plus)
  pickups/laser-pickup      Gold laser weapon pickup
`);
}

/**
 * Run a script and wait for it to complete
 */
export function runScript(
  scriptPath: string,
  scriptArgs: string[],
): Promise<number | null> {
  return new Promise((resolve) => {
    const proc = spawn("bun", ["run", scriptPath, ...scriptArgs], {
      stdio: "inherit",
    });
    proc.on("close", (code) => {
      resolve(code);
    });
  });
}

/**
 * Parse CLI arguments and determine action
 */
export function parseArgs(args: string[]): {
  action: "help" | "list" | "import" | "export";
  args: string[];
} {
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    return { action: "help", args: [] };
  }

  if (args[0] === "--list" || args[0] === "-l") {
    return { action: "list", args: [] };
  }

  if (args[0] === "--import" || args[0] === "-i") {
    return { action: "import", args: args.slice(1) };
  }

  return { action: "export", args };
}

// Main - only run if this is the entry point
if (import.meta.main) {
  const args = process.argv.slice(2);
  const parsed = parseArgs(args);

  if (parsed.action === "help") {
    showHelp();
    process.exit(0);
  }

  if (parsed.action === "list") {
    showList();
    process.exit(0);
  }

  if (parsed.action === "import") {
    if (parsed.args.length === 0) {
      console.error("Error: --import requires an OBJ file path");
      console.error(
        "Usage: bun run export-model --import <file.obj> [output.ts]",
      );
      process.exit(1);
    }

    const exitCode = await runScript(
      join(SCRIPTS_DIR, "model-import.ts"),
      parsed.args,
    );
    process.exit(exitCode ?? 1);
  }

  // Export mode
  const exitCode = await runScript(
    join(SCRIPTS_DIR, "model-export.ts"),
    parsed.args,
  );
  process.exit(exitCode ?? 1);
}
