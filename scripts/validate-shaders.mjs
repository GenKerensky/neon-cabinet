#!/usr/bin/env node

import { execSync } from "child_process";
import { readdirSync, existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");
const gamesRoot = join(projectRoot, "src/games");

// Get glslangValidator binary path from the package
const glslangValidatorPackage = require("glslang-validator-prebuilt");
const glslangValidatorPath = glslangValidatorPackage.path;

function collectShaderEntries() {
  const entries = [];
  const isShader = (f) =>
    f.endsWith(".frag") || f.endsWith(".vert") || f.endsWith(".glsl");

  // Shared shaders (_shared/shaders)
  const sharedDir = join(gamesRoot, "_shared/shaders");
  if (existsSync(sharedDir)) {
    for (const file of readdirSync(sharedDir).filter(isShader)) {
      entries.push({
        path: join(sharedDir, file),
        label: `_shared/${file}`,
      });
    }
  }

  // Per-game shaders (*/shaders, exclude _shared)
  for (const name of readdirSync(gamesRoot)) {
    if (name === "_shared") continue;
    const shadersDir = join(gamesRoot, name, "shaders");
    if (!existsSync(shadersDir)) continue;
    for (const file of readdirSync(shadersDir).filter(isShader)) {
      entries.push({
        path: join(shadersDir, file),
        label: `${name}/${file}`,
      });
    }
  }

  return entries;
}

try {
  const shaderEntries = collectShaderEntries();

  if (shaderEntries.length === 0) {
    console.log("No shader files found to validate.");
    process.exit(0);
  }

  console.log(`Validating ${shaderEntries.length} shader file(s)...\n`);

  if (!existsSync(glslangValidatorPath)) {
    console.error(
      `Error: glslangValidator binary not found at ${glslangValidatorPath}`,
    );
    console.error(
      "Try running: bun install to ensure the package is properly installed.",
    );
    process.exit(1);
  }

  let hasErrors = false;

  for (const { path: filePath, label } of shaderEntries) {
    let stage = "frag";
    if (filePath.endsWith(".vert")) stage = "vert";
    else if (filePath.endsWith(".frag")) stage = "frag";

    try {
      execSync(`"${glslangValidatorPath}" -S ${stage} -l "${filePath}"`, {
        encoding: "utf-8",
        stdio: "pipe",
      });
      console.log(`✓ ${label}`);
    } catch (error) {
      hasErrors = true;
      console.error(`✗ ${label}`);
      if (error.stdout) console.error(error.stdout);
      if (error.stderr) console.error(error.stderr);
    }
  }

  if (hasErrors) {
    console.error("\nShader validation failed!");
    process.exit(1);
  } else {
    console.log("\nAll shaders validated successfully!");
    process.exit(0);
  }
} catch (error) {
  console.error("Error validating shaders:", error.message);
  process.exit(1);
}
