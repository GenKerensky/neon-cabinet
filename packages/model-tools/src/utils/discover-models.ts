import { readdirSync, statSync } from "fs";
import { join, extname, basename } from "path";

export interface ModelInfo {
  file: string;
  exportName: string;
  category: string | null;
  name: string;
}

/**
 * Convert model name to export constant name
 */
export function toExportName(name: string): string {
  return name.replace(/-/g, "_").replace(/\s+/g, "_").toUpperCase();
}

/**
 * Discover all models in a models directory
 */
export function discoverModels(modelsDir: string): Record<string, ModelInfo> {
  const modelMap: Record<string, ModelInfo> = {};

  function scanDirectory(dir: string, _category: string | null = null): void {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // Recursively scan subdirectories
        scanDirectory(fullPath, entry);
      } else if (extname(entry) === ".ts" && basename(entry) !== "index.ts") {
        // Found a TypeScript model file
        const name = basename(entry, ".ts");
        const relativePath = fullPath.replace(modelsDir + "/", "");
        const pathParts = relativePath.replace(/\.ts$/, "").split("/");

        let modelKey: string;
        if (pathParts.length > 1) {
          // Has category
          modelKey = pathParts.slice(0, -1).join("/") + "/" + name;
        } else {
          // Root level
          modelKey = name;
        }

        // Try to determine export name by reading the file
        // For now, use naming convention
        const exportName = toExportName(name);

        modelMap[modelKey] = {
          file: relativePath,
          exportName,
          category: pathParts.length > 1 ? pathParts[0] : null,
          name,
        };
      }
    }
  }

  scanDirectory(modelsDir);

  return modelMap;
}

/**
 * Get export name from a TypeScript file
 */
export async function getExportNameFromFile(
  filePath: string,
): Promise<string | null> {
  try {
    const content = await import(filePath);
    // Look for common export patterns
    const exports = Object.keys(content);
    // Prefer uppercase exports (constants)
    const constantExports = exports.filter((e) => e === e.toUpperCase());
    if (constantExports.length > 0) {
      return constantExports[0];
    }
    // Fall back to any export
    if (exports.length > 0) {
      return exports[0];
    }
  } catch {
    // File might not be importable, use naming convention
  }
  return null;
}
