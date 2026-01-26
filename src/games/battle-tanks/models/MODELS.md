# Battle Tanks Wireframe Models

This guide explains how to export, edit, and import wireframe models for Battle Tanks using Blender.

## Quick Start

```bash
# Export a model to OBJ for Blender
bun run export-model pickups/shield-pickup

# Export all models
bun run export-model --all

# Import edited OBJ back to TypeScript
bun run export-model --import pickups/shield-pickup.obj

# Show help
bun run export-model --help
```

## Available Models

| Model Path                 | Description                          |
| -------------------------- | ------------------------------------ |
| `enemies/enemy-tank`       | M1 Abrams-style enemy tank           |
| `enemies/enemy-projectile` | Red enemy projectile                 |
| `terrain/pyramid`          | Pyramid obstacle                     |
| `terrain/cube`             | Cube obstacle                        |
| `weapons/projectile`       | Yellow player projectile             |
| `pickups/shield-pickup`    | Cyan armor pickup (shield with plus) |
| `pickups/laser-pickup`     | Gold laser weapon pickup             |

## File Locations

- **TypeScript models**: `src/games/battle-tanks/models/<category>/<name>.ts`
- **OBJ exports**: `src/games/battle-tanks/models/<category>/<name>.obj`

---

## Exporting Models from Game to Blender

### Export a Single Model

```bash
bun run export-model weapons/projectile
```

This creates `src/games/battle-tanks/models/weapons/projectile.obj`

### Export All Models

```bash
bun run export-model --all
```

### What Gets Exported

- **Vertices**: 3D coordinates (x, y, z)
- **Edges**: Connections between vertices (as OBJ `l` lines)
- **Color**: Stored as a comment in the OBJ (for reference only—color is determined by folder on import)

---

## Importing Models into Blender

### Step 1: Open Blender

Create a new file or open an existing project.

### Step 2: Import OBJ

1. Go to **File → Import → Wavefront (.obj)**
2. Navigate to `src/games/battle-tanks/models/<category>/`
3. Select the `.obj` file
4. Click **Import OBJ**

### Step 3: Import Settings

Use these recommended settings:

- **Forward Axis**: -Z Forward
- **Up Axis**: Y Up
- **Split by Object**: Unchecked
- **Split by Group**: Unchecked

### Step 4: View the Model

After importing:

1. Press `Z` to open shading menu
2. Select **Wireframe** to see edges clearly
3. Press `Numpad .` to focus on the selected object

### Understanding the Coordinate System

Battle Tanks uses a right-handed coordinate system:

- **X**: Left (-) to Right (+)
- **Y**: Down (0) to Up (+) — ground is at Y=0
- **Z**: Back (-) to Front (+) — forward direction

---

## Editing Models in Blender

### Working with Vertices and Edges

1. **Enter Edit Mode**: Select the model and press `Tab`
2. **Vertex Select**: Press `1` to select vertices
3. **Edge Select**: Press `2` to select edges
4. **Move**: Press `G` to grab/move selection
5. **Scale**: Press `S` to scale selection
6. **Rotate**: Press `R` to rotate selection

### Creating New Wireframe Geometry

To create new edges:

1. Enter Edit Mode (`Tab`)
2. Select two vertices
3. Press `F` to create an edge between them

To add new vertices:

1. Enter Edit Mode
2. `Ctrl+Click` to add a new vertex connected to the selected vertex
3. Or use **Mesh → Add → Single Vert**

### Best Practices

1. **Keep it simple**: Fewer vertices = better performance
2. **Use whole numbers**: Round coordinates when possible
3. **Ground level**: Keep Y=0 as the ground plane
4. **Center origin**: Models should be centered at X=0, Z=0
5. **Test often**: Export and reimport frequently to check results

---

## Exporting from Blender Back to Game

### Step 1: Select the Model

In Object Mode, select the model you want to export.

### Step 2: Export as OBJ

1. Go to **File → Export → Wavefront (.obj)**
2. Navigate to `src/games/battle-tanks/models/<category>/`
3. Name the file (e.g., `my-model.obj`)

### Step 3: Export Settings

**Important settings for wireframe models:**

- **Include → Selection Only**: Check if you only want the selected object
- **Transform → Forward**: -Z Forward
- **Transform → Up**: Y Up
- **Geometry → Write Edges**: **CHECKED** (Important!)
- **Geometry → Write Normals**: Unchecked (not needed)
- **Geometry → Include UVs**: Unchecked (not needed)
- **Geometry → Write Materials**: Unchecked (not needed)
- **Geometry → Triangulate Faces**: Unchecked (not needed)

### Step 4: Import to Game

```bash
bun run export-model --import <category>/<name>.obj
```

This generates a new TypeScript file with the model definition.

---

## Game Constraints and Limitations

### Supported Features

| Feature                    | Support |
| -------------------------- | ------- |
| Vertices (3D coordinates)  | ✅ Yes  |
| Edges (vertex connections) | ✅ Yes  |
| Single color per model     | ✅ Yes  |
| Wireframe rendering        | ✅ Yes  |

### Not Supported

| Feature         | Support | Notes                      |
| --------------- | ------- | -------------------------- |
| Faces/surfaces  | ❌ No   | Only edges are rendered    |
| Textures        | ❌ No   | Wireframe only             |
| Materials       | ❌ No   | Single color per model     |
| Multiple colors | ❌ No   | One color for entire model |
| Animation       | ❌ No   | Static models only         |
| Rigging/bones   | ❌ No   | Not applicable             |
| Normals         | ❌ No   | Not used                   |
| UV coordinates  | ❌ No   | No textures                |

### Color Palette

**Colors are automatically determined by the folder the model is in:**

| Folder     | Color Constant        | Description    |
| ---------- | --------------------- | -------------- |
| `enemies/` | `COLORS.enemy`        | Red            |
| `terrain/` | `COLORS.obstacle`     | Green          |
| `weapons/` | `COLORS.projectile`   | Yellow         |
| `pickups/` | `COLORS.pickup_armor` | Cyan (default) |

**Special model overrides:**

| Model Name         | Color Constant         | Description |
| ------------------ | ---------------------- | ----------- |
| `laser-pickup`     | `COLORS.pickup_weapon` | Gold        |
| `enemy-projectile` | `COLORS.enemy`         | Red         |

You don't need to specify color in the OBJ file—it's set automatically based on which folder the model is imported to.

---

## Blender Workflow Tips

### Viewport Setup

1. Press `Numpad 5` for orthographic view
2. Press `Numpad 1` for front view
3. Press `Numpad 3` for side view
4. Press `Numpad 7` for top view
5. Press `Z` and select **Wireframe** for best editing

### Useful Shortcuts

| Shortcut        | Action                  |
| --------------- | ----------------------- |
| `Tab`           | Toggle Edit/Object Mode |
| `G`             | Grab/Move               |
| `S`             | Scale                   |
| `R`             | Rotate                  |
| `X`, `Y`, `Z`   | Constrain to axis       |
| `Shift+D`       | Duplicate               |
| `X` or `Delete` | Delete                  |
| `F`             | Create edge/face        |
| `E`             | Extrude                 |
| `Ctrl+Z`        | Undo                    |

### Checking Your Work

Before exporting:

1. Switch to **Wireframe** view (`Z` → Wireframe)
2. Check that all edges are connected
3. Verify no duplicate vertices (Mesh → Merge → By Distance)
4. Confirm scale is reasonable (typical models are 50-100 units)

---

## Troubleshooting

### "No edges in OBJ file"

Make sure **Write Edges** is checked when exporting from Blender.

If your model only has faces, edges will be extracted automatically during import.

### Model appears at wrong position

Check the origin point in Blender. Use **Object → Set Origin → Origin to Geometry** to center it.

### Model is too big/small

The game uses a scale where:

- Tank is ~100 units wide
- Pickups are ~40-50 units
- Projectiles are ~20 units

Scale in Blender accordingly, or adjust after import.

### Wrong color applied

Colors are determined by the folder the model is in:

- `enemies/` → Red (COLORS.enemy)
- `terrain/` → Green (COLORS.obstacle)
- `weapons/` → Yellow (COLORS.projectile)
- `pickups/` → Cyan (COLORS.pickup_armor)

If you need a different color, either:

1. Move the model to the appropriate folder
2. Manually edit the generated TypeScript file to use the correct `COLORS.xxx` reference

---

## Creating a New Model

1. **Create in Blender**:
   - Start with a simple mesh or create from scratch
   - Work in Edit Mode to add vertices and edges
   - Keep it simple - wireframe only!

2. **Export**:

   ```bash
   # In Blender: File → Export → Wavefront (.obj)
   # Save to: src/games/battle-tanks/models/<category>/new-model.obj
   ```

3. **Import**:

   ```bash
   bun run export-model --import <category>/new-model.obj
   ```

4. **Register the model**:
   - Edit `models/<category>/index.ts` to export the new model
   - Edit `models/index.ts` to re-export from the category
   - Update `scripts/model-export.ts` MODEL_MAP to include the new model

5. **Use in game**:
   ```typescript
   import { NEW_MODEL } from "../models";
   ```

---

## OBJ File Format Reference

Battle Tanks uses a subset of the OBJ format:

```
# Wavefront OBJ file
# Exported from Battle Tanks game
# Model: weapons/projectile
# color: 0xffff00

# Vertices (1-indexed in OBJ)
v 0.0000 0.0000 -8.0000
v -2.0000 0.0000 0.0000
v 2.0000 0.0000 0.0000

# Edges (line elements)
l 1 2
l 2 3
l 3 1
```

- `#` = Comment
- `v x y z` = Vertex position
- `l v1 v2` = Line/edge connecting two vertices (1-indexed)
- `f v1 v2 v3 ...` = Face (converted to edges on import)
