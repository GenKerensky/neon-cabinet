# @neon-cabinet/model-tools

Tools for exporting and importing wireframe models for game projects.

## Features

- **Auto-discovery**: Automatically discovers models in any project
- **Project-agnostic**: Works with any project structure in the monorepo
- **OBJ Export**: Export WireframeModel TypeScript definitions to OBJ format
- **OBJ Import**: Import OBJ files and generate TypeScript WireframeModel code

## Usage

### From a project directory (e.g., `apps/battle-tanks`)

```bash
# Export a model to OBJ
bun run export-model weapons/projectile

# Export all models
bun run export-model --all

# Import OBJ to TypeScript
bun run export-model --import weapons/projectile.obj

# List available models
bun run export-model --list

# Show help
bun run export-model --help
```

### Direct usage

```bash
# From any directory, specify project path
bun run @neon-cabinet/model-tools/src/bin/model-convert.ts --project apps/battle-tanks weapons/projectile
```

## How It Works

The tools automatically:

1. **Discover project structure**: Finds `src/game/models` or `src/models` directories
2. **Find engine directory**: Locates `src/game/engine` or `src/engine` for imports
3. **Discover models**: Scans for `.ts` files in the models directory
4. **Generate correct paths**: Calculates relative import paths automatically

## Project Structure

The tools work with projects that have this structure:

```
project/
  src/
    game/          # or just src/
      models/      # Model definitions
        category/
          model.ts
          model.obj
      engine/      # Engine code
        Vector3D.ts
        WireframeModel.ts
```

## API

```typescript
import {
  exportModel,
  exportAllModels,
  importModel,
} from "@neon-cabinet/model-tools";

// Export a single model
const objPath = await exportModel("weapons/projectile", "apps/battle-tanks");

// Export all models
const paths = await exportAllModels("apps/battle-tanks");

// Import OBJ file
const { tsPath, data } = importModel(
  "weapons/projectile.obj",
  undefined,
  "apps/battle-tanks",
);
```
