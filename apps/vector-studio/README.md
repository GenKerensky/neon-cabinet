# Vector Studio

Isolated preview environment for iterating on high-fidelity vector assets for the Neon Cabinet arcade.

## Purpose

Vector Studio allows artists and developers to iterate on SVG-based characters and objects without booting the entire game. It provides a production-accurate render environment including procedural animations and the custom `VectorShader` (bloom, scanlines, etc.).

## Usage

1. **Start the studio:**

   ```bash
   bun nx serve vector-studio
   ```

2. **Open in browser:**
   The studio runs on port **4300** by default.
   - [Preview Player](http://localhost:4300/?asset=apps/maze-runner/public/assets/vector/player.svg)
   - [Preview Ghost](http://localhost:4300/?asset=apps/maze-runner/public/assets/vector/ghost.svg)

3. **URL Parameter:**
   Use the `?asset=` query parameter with the workspace-relative path to any SVG asset.

## Features

- **Procedural Preview**: Renders `data-anim-wave` and `data-anim-wobble` animations in real-time.
- **Shader Toggle**: Test how assets look with and without the CRT/Bloom post-processing.
- **Directional Control**: Test eye-sliding and layer movement using the direction buttons.
- **Live Reload**: Automatically refreshes when the underlying SVG file is saved.

## Unified Asset Definition (UAD)

Assets are defined as standard SVGs with custom metadata:

| Attribute                  | Purpose                                  |
| -------------------------- | ---------------------------------------- |
| `data-anim-wave`           | Procedural sine-wave vertex morphing.    |
| `data-anim-wobble`         | Structural oscillation.                  |
| `data-slide-range`         | Directional eye/layer sliding intensity. |
| `class="physics-collider"` | Defines an Arcade Physics body.          |
| `id="socket_*"`            | Transform-aware attachment points.       |
| `data-material-bloom`      | CRT shader glow intensity.               |

## Technical Reference

- **Base Project**: `@nx/web` with Vite
- **Engine**: Phaser 3.90.0
- **Library**: `@neon-cabinet/sprite-tools`
- **Shaders**: `@neon-cabinet/shaders`
