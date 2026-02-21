import { existsSync } from "fs";
import { join, resolve, dirname } from "path";

/**
 * Find the project root by looking for package.json or nx.json
 */
export function findProjectRoot(startPath: string = process.cwd()): string {
  let current = resolve(startPath);

  while (current !== dirname(current)) {
    if (
      existsSync(join(current, "package.json")) ||
      existsSync(join(current, "nx.json"))
    ) {
      return current;
    }
    current = dirname(current);
  }

  return startPath;
}

/**
 * Find the app/project directory (e.g., apps/battle-tanks)
 */
export function findAppRoot(projectRoot: string): string | null {
  // Check if we're in an app directory
  const possiblePaths = [
    projectRoot, // Already in app
    join(projectRoot, "src"), // In src
    join(projectRoot, "src", "game"), // In src/game
  ];

  for (const path of possiblePaths) {
    // Look for models directory
    if (
      existsSync(join(path, "models")) ||
      existsSync(join(path, "game", "models"))
    ) {
      return path;
    }
  }

  // Try to find apps/* directory
  const appsDir = join(projectRoot, "apps");
  if (existsSync(appsDir)) {
    // We're in monorepo root, need to detect which app
    return null;
  }

  return projectRoot;
}

/**
 * Find models directory in a project
 */
export function findModelsDir(appRoot: string): string {
  const possiblePaths = [
    join(appRoot, "src", "game", "models"),
    join(appRoot, "src", "models"),
    join(appRoot, "models"),
  ];

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      return path;
    }
  }

  throw new Error(
    `Models directory not found. Tried: ${possiblePaths.join(", ")}`,
  );
}

/**
 * Find engine directory in a project
 */
export function findEngineDir(appRoot: string): string {
  const possiblePaths = [
    join(appRoot, "src", "game", "engine"),
    join(appRoot, "src", "engine"),
    join(appRoot, "engine"),
  ];

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      return path;
    }
  }

  throw new Error(
    `Engine directory not found. Tried: ${possiblePaths.join(", ")}`,
  );
}

/**
 * Get relative path from models directory to engine directory
 */
export function getEngineRelativePath(
  modelsDir: string,
  engineDir: string,
): string {
  const modelsParts = modelsDir.split("/");
  const engineParts = engineDir.split("/");

  // Find common prefix
  let commonLength = 0;
  while (
    commonLength < modelsParts.length &&
    commonLength < engineParts.length &&
    modelsParts[commonLength] === engineParts[commonLength]
  ) {
    commonLength++;
  }

  // Calculate relative path
  const upLevels = modelsParts.length - commonLength - 1;
  const downPath = engineParts.slice(commonLength).join("/");

  if (upLevels === 0) {
    return `./${downPath}`;
  }

  const upPath = "../".repeat(upLevels);
  return `${upPath}${downPath}`;
}

/**
 * Resolve project paths from current working directory or provided path
 */
export function resolveProjectPaths(projectPath?: string): {
  projectRoot: string;
  appRoot: string;
  modelsDir: string;
  engineDir: string;
  engineRelativePath: string;
} {
  const projectRoot = projectPath
    ? resolve(projectPath)
    : findProjectRoot(process.cwd());

  const appRoot = findAppRoot(projectRoot) || projectRoot;
  const modelsDir = findModelsDir(appRoot);
  const engineDir = findEngineDir(appRoot);
  const engineRelativePath = getEngineRelativePath(modelsDir, engineDir);

  return {
    projectRoot,
    appRoot,
    modelsDir,
    engineDir,
    engineRelativePath,
  };
}
