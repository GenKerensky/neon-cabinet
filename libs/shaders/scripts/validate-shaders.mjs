#!/usr/bin/env node

import { execSync } from "child_process";
import { existsSync, readdirSync } from "fs";
import { dirname, join, relative } from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");
const shadersRoot = join(projectRoot, "src/shaders");

// Get glslangValidator binary path from the package
const glslangValidatorPackage = require("glslang-validator-prebuilt");
const glslangValidatorPath = glslangValidatorPackage.path;

const shaderExtensions = new Set([".frag", ".vert", ".glsl"]);

function collectShaderEntries() {
  if (!existsSync(shadersRoot)) {
    return [];
  }

  const entries = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      const extension = entry.name.slice(entry.name.lastIndexOf("."));
      if (!shaderExtensions.has(extension)) {
        continue;
      }
      entries.push({
        path: fullPath,
        label: relative(shadersRoot, fullPath),
      });
    }
  };

  walk(shadersRoot);
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
    console.warn(
      `Warning: glslangValidator binary not found at ${glslangValidatorPath}`,
    );
    console.warn("Skipping shader validation. Run: bun install");
    process.exit(0);
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
