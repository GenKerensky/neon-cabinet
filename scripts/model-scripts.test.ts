import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

import { colorToHex, modelToObj, MODEL_MAP, exportModel } from "./model-export";

import {
  parseObj,
  generateTypeScript,
  toExportName,
  importModel,
  getColorForModel,
  CATEGORY_COLOR_MAP,
  MODEL_COLOR_OVERRIDES,
  type ParsedOBJ,
} from "./model-import";

import { parseArgs, showHelp, showList } from "./model-convert";

// Test fixtures
const SAMPLE_OBJ = `# Wavefront OBJ file
# Exported from Battle Tanks game
# Model: test/sample
# color: 0x00ffff

# Vertices
v -10.0000 0.0000 -10.0000
v 10.0000 0.0000 -10.0000
v 10.0000 0.0000 10.0000
v -10.0000 0.0000 10.0000

# Edges
l 1 2
l 2 3
l 3 4
l 4 1
`;

const SAMPLE_OBJ_WITH_FACES = `# Simple cube with faces only
v -1 -1 -1
v 1 -1 -1
v 1 1 -1
v -1 1 -1

f 1 2 3 4
`;

describe("model-export", () => {
  describe("colorToHex", () => {
    it("should convert color to hex string", () => {
      expect(colorToHex(0x00ff00)).toBe("0x00ff00");
      expect(colorToHex(0xff0000)).toBe("0xff0000");
      expect(colorToHex(0x00ffff)).toBe("0x00ffff");
    });

    it("should pad short hex values", () => {
      expect(colorToHex(0x00)).toBe("0x000000");
      expect(colorToHex(0xff)).toBe("0x0000ff");
    });
  });

  describe("modelToObj", () => {
    it("should convert model to OBJ format", () => {
      const model = {
        vertices: [
          {
            x: 0,
            y: 0,
            z: 0,
            add: () => ({}) as never,
            subtract: () => ({}) as never,
            scale: () => ({}) as never,
            length: () => 0,
            normalize: () => ({}) as never,
            rotateY: () => ({}) as never,
            rotateX: () => ({}) as never,
            dot: () => 0,
            cross: () => ({}) as never,
            clone: () => ({}) as never,
            lerp: () => ({}) as never,
          },
          {
            x: 1,
            y: 0,
            z: 0,
            add: () => ({}) as never,
            subtract: () => ({}) as never,
            scale: () => ({}) as never,
            length: () => 0,
            normalize: () => ({}) as never,
            rotateY: () => ({}) as never,
            rotateX: () => ({}) as never,
            dot: () => 0,
            cross: () => ({}) as never,
            clone: () => ({}) as never,
            lerp: () => ({}) as never,
          },
          {
            x: 1,
            y: 1,
            z: 0,
            add: () => ({}) as never,
            subtract: () => ({}) as never,
            scale: () => ({}) as never,
            length: () => 0,
            normalize: () => ({}) as never,
            rotateY: () => ({}) as never,
            rotateX: () => ({}) as never,
            dot: () => 0,
            cross: () => ({}) as never,
            clone: () => ({}) as never,
            lerp: () => ({}) as never,
          },
        ],
        edges: [
          { start: 0, end: 1 },
          { start: 1, end: 2 },
          { start: 2, end: 0 },
        ],
        color: 0x00ff00,
      };

      const obj = modelToObj(model, "test/model");

      expect(obj).toContain("# Wavefront OBJ file");
      expect(obj).toContain("# Model: test/model");
      expect(obj).toContain("# color: 0x00ff00");
      expect(obj).toContain("v 0.0000 0.0000 0.0000");
      expect(obj).toContain("v 1.0000 0.0000 0.0000");
      expect(obj).toContain("v 1.0000 1.0000 0.0000");
      expect(obj).toContain("l 1 2");
      expect(obj).toContain("l 2 3");
      expect(obj).toContain("l 3 1");
    });
  });

  describe("MODEL_MAP", () => {
    it("should have all expected models", () => {
      expect(MODEL_MAP["enemies/enemy-tank"]).toBeDefined();
      expect(MODEL_MAP["enemies/enemy-projectile"]).toBeDefined();
      expect(MODEL_MAP["terrain/pyramid"]).toBeDefined();
      expect(MODEL_MAP["terrain/cube"]).toBeDefined();
      expect(MODEL_MAP["weapons/projectile"]).toBeDefined();
      expect(MODEL_MAP["pickups/shield-pickup"]).toBeDefined();
      expect(MODEL_MAP["pickups/laser-pickup"]).toBeDefined();
    });

    it("should have valid file paths and export names", () => {
      for (const [key, info] of Object.entries(MODEL_MAP)) {
        expect(info.file).toMatch(/\.ts$/);
        expect(info.exportName).toMatch(/^[A-Z_]+$/);
        expect(key).toMatch(/^[a-z-]+\/[a-z-]+$/);
      }
    });
  });
});

describe("model-import", () => {
  describe("parseObj", () => {
    it("should parse vertices from OBJ content", () => {
      const result = parseObj(SAMPLE_OBJ);

      expect(result.vertices).toHaveLength(4);
      expect(result.vertices[0]).toEqual({ x: -10, y: 0, z: -10 });
      expect(result.vertices[1]).toEqual({ x: 10, y: 0, z: -10 });
      expect(result.vertices[2]).toEqual({ x: 10, y: 0, z: 10 });
      expect(result.vertices[3]).toEqual({ x: -10, y: 0, z: 10 });
    });

    it("should parse edges from OBJ content", () => {
      const result = parseObj(SAMPLE_OBJ);

      expect(result.edges).toHaveLength(4);
      // OBJ is 1-indexed, our edges should be 0-indexed
      expect(result.edges).toContainEqual([0, 1]);
      expect(result.edges).toContainEqual([1, 2]);
      expect(result.edges).toContainEqual([2, 3]);
      expect(result.edges).toContainEqual([3, 0]);
    });

    it("should parse color from comment", () => {
      const result = parseObj(SAMPLE_OBJ);
      expect(result.color).toBe(0x00ffff);
    });

    it("should extract edges from faces when no explicit edges", () => {
      const result = parseObj(SAMPLE_OBJ_WITH_FACES);

      expect(result.vertices).toHaveLength(4);
      expect(result.edges).toHaveLength(4);
      // Edges should be extracted from the quad face
      expect(result.edges).toContainEqual([0, 1]);
      expect(result.edges).toContainEqual([1, 2]);
      expect(result.edges).toContainEqual([2, 3]);
      expect(result.edges).toContainEqual([0, 3]);
    });

    it("should handle empty content", () => {
      const result = parseObj("");
      expect(result.vertices).toHaveLength(0);
      expect(result.edges).toHaveLength(0);
      expect(result.color).toBeNull();
    });

    it("should handle OBJ with faces containing texture/normal indices", () => {
      const objWithIndices = `v 0 0 0
v 1 0 0
v 1 1 0
f 1/1/1 2/2/2 3/3/3
`;
      const result = parseObj(objWithIndices);
      expect(result.vertices).toHaveLength(3);
      expect(result.edges).toHaveLength(3);
    });
  });

  describe("toExportName", () => {
    it("should convert kebab-case to SCREAMING_SNAKE_CASE", () => {
      expect(toExportName("shield-pickup")).toBe("SHIELD_PICKUP");
      expect(toExportName("enemy-tank")).toBe("ENEMY_TANK");
      expect(toExportName("simple")).toBe("SIMPLE");
    });

    it("should handle spaces", () => {
      expect(toExportName("my model")).toBe("MY_MODEL");
    });
  });

  describe("generateTypeScript", () => {
    it("should generate valid TypeScript code", () => {
      const data: ParsedOBJ = {
        vertices: [
          { x: 0, y: 0, z: 0 },
          { x: 1, y: 0, z: 0 },
        ],
        edges: [[0, 1]],
        color: 0x00ffff,
      };

      const code = generateTypeScript(
        "test-model",
        "TEST_MODEL",
        data,
        "pickups",
      );

      expect(code).toContain(
        'import { Vector3D } from "../../engine/Vector3D"',
      );
      expect(code).toContain(
        'import { WireframeModel, createEdges } from "../../engine/WireframeModel"',
      );
      expect(code).toContain('import { COLORS } from "../colors"');
      expect(code).toContain("export const TEST_MODEL: WireframeModel");
      expect(code).toContain("new Vector3D(0, 0, 0)");
      expect(code).toContain("new Vector3D(1, 0, 0)");
      expect(code).toContain("[0, 1]");
      expect(code).toContain("color: COLORS.pickup_armor");
    });

    it("should use correct import depth for root level models", () => {
      const data: ParsedOBJ = {
        vertices: [{ x: 0, y: 0, z: 0 }],
        edges: [],
        color: null,
      };

      const code = generateTypeScript("test", "TEST", data, null);

      expect(code).toContain('import { Vector3D } from "../engine/Vector3D"');
      expect(code).toContain('import { COLORS } from "./colors"');
    });

    it("should use category-based color for enemies", () => {
      const data: ParsedOBJ = {
        vertices: [],
        edges: [],
        color: null,
      };

      const code = generateTypeScript(
        "enemy-tank",
        "ENEMY_TANK",
        data,
        "enemies",
      );
      expect(code).toContain("color: COLORS.enemy");
    });

    it("should use model override for special models", () => {
      const data: ParsedOBJ = {
        vertices: [],
        edges: [],
        color: null,
      };

      const code = generateTypeScript(
        "laser-pickup",
        "LASER_PICKUP",
        data,
        "pickups",
      );
      expect(code).toContain("color: COLORS.pickup_weapon");
    });
  });

  describe("getColorForModel", () => {
    it("should return category color for standard models", () => {
      expect(getColorForModel("enemy-tank", "enemies")).toBe("COLORS.enemy");
      expect(getColorForModel("pyramid", "terrain")).toBe("COLORS.obstacle");
      expect(getColorForModel("projectile", "weapons")).toBe(
        "COLORS.projectile",
      );
      expect(getColorForModel("shield-pickup", "pickups")).toBe(
        "COLORS.pickup_armor",
      );
    });

    it("should return model override when available", () => {
      expect(getColorForModel("laser-pickup", "pickups")).toBe(
        "COLORS.pickup_weapon",
      );
      expect(getColorForModel("enemy-projectile", "enemies")).toBe(
        "COLORS.enemy",
      );
    });

    it("should return default for unknown category", () => {
      expect(getColorForModel("unknown", null)).toBe("COLORS.player");
      expect(getColorForModel("unknown", "unknown-category")).toBe(
        "COLORS.player",
      );
    });
  });

  describe("CATEGORY_COLOR_MAP", () => {
    it("should map categories to colors", () => {
      expect(CATEGORY_COLOR_MAP["enemies"]).toBe("COLORS.enemy");
      expect(CATEGORY_COLOR_MAP["terrain"]).toBe("COLORS.obstacle");
      expect(CATEGORY_COLOR_MAP["weapons"]).toBe("COLORS.projectile");
      expect(CATEGORY_COLOR_MAP["pickups"]).toBe("COLORS.pickup_armor");
    });
  });

  describe("MODEL_COLOR_OVERRIDES", () => {
    it("should have overrides for special models", () => {
      expect(MODEL_COLOR_OVERRIDES["laser-pickup"]).toBe(
        "COLORS.pickup_weapon",
      );
      expect(MODEL_COLOR_OVERRIDES["enemy-projectile"]).toBe("COLORS.enemy");
    });
  });
});

describe("model-convert", () => {
  describe("parseArgs", () => {
    it("should return help action for empty args", () => {
      expect(parseArgs([])).toEqual({ action: "help", args: [] });
    });

    it("should return help action for --help flag", () => {
      expect(parseArgs(["--help"])).toEqual({ action: "help", args: [] });
      expect(parseArgs(["-h"])).toEqual({ action: "help", args: [] });
    });

    it("should return list action for --list flag", () => {
      expect(parseArgs(["--list"])).toEqual({ action: "list", args: [] });
      expect(parseArgs(["-l"])).toEqual({ action: "list", args: [] });
    });

    it("should return import action with args for --import flag", () => {
      expect(parseArgs(["--import", "test.obj"])).toEqual({
        action: "import",
        args: ["test.obj"],
      });
      expect(parseArgs(["-i", "test.obj", "output.ts"])).toEqual({
        action: "import",
        args: ["test.obj", "output.ts"],
      });
    });

    it("should return export action for model paths", () => {
      expect(parseArgs(["weapons/projectile"])).toEqual({
        action: "export",
        args: ["weapons/projectile"],
      });
      expect(parseArgs(["--all"])).toEqual({
        action: "export",
        args: ["--all"],
      });
    });
  });

  describe("showHelp", () => {
    it("should not throw when called", () => {
      // Capture console output
      const originalLog = console.log;
      let output = "";
      console.log = (msg: string) => {
        output += msg;
      };

      showHelp();

      console.log = originalLog;
      expect(output).toContain("Battle Tanks Model Converter");
      expect(output).toContain("Available Models:");
    });
  });

  describe("showList", () => {
    it("should not throw when called", () => {
      const originalLog = console.log;
      let output = "";
      console.log = (msg: string) => {
        output += msg;
      };

      showList();

      console.log = originalLog;
      expect(output).toContain("enemies/enemy-tank");
      expect(output).toContain("pickups/shield-pickup");
    });
  });
});

describe("exportModel function", () => {
  it("should throw for unknown model", async () => {
    await expect(exportModel("unknown/model")).rejects.toThrow("Unknown model");
  });

  it("should have all models available for export", () => {
    const availableModels = Object.keys(MODEL_MAP);
    expect(availableModels.length).toBeGreaterThan(0);
    expect(availableModels).toContain("pickups/shield-pickup");
  });
});

describe("integration: export and import roundtrip", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = join(tmpdir(), `model-test-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true });
    }
  });

  it("should export and import a model with preserved data", () => {
    // Create a test OBJ file at root level
    const objPath = join(tempDir, "test.obj");
    writeFileSync(objPath, SAMPLE_OBJ);

    // Import the OBJ
    const tsPath = join(tempDir, "test.ts");
    const { data } = importModel(objPath, tsPath, tempDir);

    expect(data.vertices).toHaveLength(4);
    expect(data.edges).toHaveLength(4);
    expect(data.color).toBe(0x00ffff); // OBJ still parses color, just doesn't use it

    // Verify TypeScript file was created
    expect(existsSync(tsPath)).toBe(true);

    const tsContent = readFileSync(tsPath, "utf-8");
    expect(tsContent).toContain("export const TEST: WireframeModel");
    expect(tsContent).toContain("new Vector3D(-10, 0, -10)");
    // Root level models default to COLORS.player
    expect(tsContent).toContain("COLORS.player");
  });

  it("should handle nested category paths with category-based colors", () => {
    // Create category directory
    const categoryDir = join(tempDir, "weapons");
    mkdirSync(categoryDir, { recursive: true });

    const objPath = join(categoryDir, "laser.obj");
    writeFileSync(objPath, SAMPLE_OBJ);

    const { tsPath } = importModel(objPath, undefined, tempDir);

    expect(tsPath).toBe(join(categoryDir, "laser.ts"));
    expect(existsSync(tsPath)).toBe(true);

    const content = readFileSync(tsPath, "utf-8");
    expect(content).toContain(
      'import { Vector3D } from "../../engine/Vector3D"',
    );
    expect(content).toContain('import { COLORS } from "../colors"');
    // Weapons category should use projectile color
    expect(content).toContain("COLORS.projectile");
  });

  it("should use enemy color for enemies category", () => {
    const categoryDir = join(tempDir, "enemies");
    mkdirSync(categoryDir, { recursive: true });

    const objPath = join(categoryDir, "tank.obj");
    writeFileSync(objPath, SAMPLE_OBJ);

    const { tsPath } = importModel(objPath, undefined, tempDir);
    const content = readFileSync(tsPath, "utf-8");

    expect(content).toContain("COLORS.enemy");
  });

  it("should use pickup_armor color for pickups category", () => {
    const categoryDir = join(tempDir, "pickups");
    mkdirSync(categoryDir, { recursive: true });

    const objPath = join(categoryDir, "shield-pickup.obj");
    writeFileSync(objPath, SAMPLE_OBJ);

    const { tsPath } = importModel(objPath, undefined, tempDir);
    const content = readFileSync(tsPath, "utf-8");

    expect(content).toContain("COLORS.pickup_armor");
  });

  it("should use model override for laser-pickup", () => {
    const categoryDir = join(tempDir, "pickups");
    mkdirSync(categoryDir, { recursive: true });

    const objPath = join(categoryDir, "laser-pickup.obj");
    writeFileSync(objPath, SAMPLE_OBJ);

    const { tsPath } = importModel(objPath, undefined, tempDir);
    const content = readFileSync(tsPath, "utf-8");

    // laser-pickup has a model override to use pickup_weapon
    expect(content).toContain("COLORS.pickup_weapon");
  });
});
