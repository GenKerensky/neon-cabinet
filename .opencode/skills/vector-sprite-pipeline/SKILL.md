---
name: vector-sprite-pipeline
description: Use when creating, editing, or animating vector game assets (SVGs) for Phaser games. Triggers the Studio Agent workflow with Art Director and Illustrator.
---

# Vector Sprite Pipeline & Studio Studio

Use this skill when you need to generate high-quality, procedurally animated vector assets for Phaser.js games using the `sprite-tools` library.

## The Workflow

The pipeline utilizes a three-agent studio loop to ensure visual and technical perfection:

1.  **Illustrator**: Generates the SVG and metadata (UAD).
2.  **Sandbox Engineer**: Compiles the asset and generates a PNG preview with overlays.
3.  **Art Director**: Critiques the render (physics hitboxes, sockets, aesthetics).

### Stage 1: The Fast Local Loop

- **Render**: `bun run libs/sprite-tools/src/bin/render-svg.ts <input.svg> <output.png>`
- **Review**: The Art Director checks the `.png` for alignment and quality.
- **Fix**: The Illustrator modifies the `.svg` based on feedback.

### Stage 2: Studio Preview (Visual & Animation Review)

- **Launch Preview**: `bun nx serve vector-studio`
- **Open Browser**: `http://localhost:4300/?asset=apps/maze-runner/public/assets/vector/player.svg`
- **Review**: Observe procedural animations (chomp, wave, wobble) and CRT shader effects (bloom, chromatic aberration). Use the UI to toggle shaders or change movement direction.

### Stage 3: Engine Integration

- once approved, the asset is instantiated as a `VectorPuppet` in Phaser.
- **Verification**: `npx vitest run -c libs/sprite-tools/vite.config.mts`

## Unified Asset Definition (UAD)

SVGs are the source of truth. Use these attributes:

| Attribute                  | Purpose                              | Example                                   |
| -------------------------- | ------------------------------------ | ----------------------------------------- |
| `data-anim-wave`           | Procedural sine-wave vertex morphing | `frequency:2 amplitude:5 points:20`       |
| `data-anim-wobble`         | Structural oscillation               | `frequency:1 amplitude:3`                 |
| `data-slide-range`         | Directional eye/layer sliding        | `data-slide-range="4"`                    |
| `class="physics-collider"` | Defines an Arcade Physics body       | `<circle ... class="physics-collider" />` |
| `id="socket_*"`            | Transform-aware attachment point     | `<g id="socket_muzzle" ... />`            |
| `data-material-bloom`      | CRT shader glow intensity            | `data-material-bloom="2.0"`               |
| `data-on-anim-peak`        | Audio trigger event name             | `data-on-anim-peak="play_step"`           |

## Implementation Reference

- **Library**: `libs/sprite-tools`
- **Container**: `VectorPuppet` (extends `Phaser.GameObjects.Container`)
- **Parser**: `SVGParser` (utilizes `DOMParser` and `PathTokenizer`)
